// main.cpp — stable runner API + history + DB logging + LLM hook (stub via llm_engine_stub.h)
//
// IMPORTANT:
// - Do NOT define LLMResult/LLMEngine/LLMEngineStub here.
// - Those live in llm_engine.h / llm_engine_stub.h.

#include "httplib.h"
#include "nlohmann/json.hpp"

#include "llm_engine.h"
#include "llm_engine_stub.h"
#include "llm_engine_http.h"
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <ctime>
#include <exception>
#include <memory>
#include <mutex>
#include <random>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

// ------------------ Utilities ------------------

static long long unix_seconds_now() {
    return (long long)time(nullptr);
}

static int64_t unix_ms_now() {
    using namespace std::chrono;
    return (int64_t)duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
}

static std::string random_id(size_t bytes = 16) {
    static thread_local std::mt19937_64 rng{ std::random_device{}() };
    std::uniform_int_distribution<unsigned int> dist(0, 255);

    std::ostringstream oss;
    oss << std::hex;
    for (size_t i = 0; i < bytes; i++) {
        unsigned int v = dist(rng);
        if (v < 16) oss << '0';
        oss << v;
    }
    return oss.str();
}

static void add_cors(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type");
}

static int64_t make_event_id() {
    // (ms << 12) | random(0..4095)
    static thread_local std::mt19937_64 rng{ std::random_device{}() };
    std::uniform_int_distribution<int> dist(0, 4095);
    return (unix_ms_now() << 12) | dist(rng);
}

// ------------------ Vector DB Bridge (best-effort logging) ------------------

// Returns true if bridge responded HTTP 200.
static bool vdb_upsert(const nlohmann::json& payload, std::string* err_out = nullptr) {
    try {
        httplib::Client cli("127.0.0.1", 50052);
        cli.set_connection_timeout(2); // seconds
        cli.set_read_timeout(5);

        nlohmann::json req = {
            {"collection", payload.at("collection")},
            {"payload", payload.at("payload")}
        };

        auto res = cli.Post("/upsert", req.dump(), "application/json");
        if (!res) {
            if (err_out) *err_out = "No response from bridge (connection failed?)";
            return false;
        }
        if (res->status != 200) {
            if (err_out) *err_out = "Bridge returned HTTP " + std::to_string(res->status) + " body=" + res->body;
            return false;
        }
        return true;
    }
    catch (const std::exception& e) {
        if (err_out) *err_out = std::string("vdb_upsert exception: ") + e.what();
        return false;
    }
    catch (...) {
        if (err_out) *err_out = "vdb_upsert unknown exception";
        return false;
    }
}

static void log_error_event(const std::string& session_id,
    const std::string& where,
    const std::string& message) {
    try {
        std::string err;
        vdb_upsert({
            {"collection", "errors"},
            {"payload", {
                {"_id", make_event_id()},
                {"session_id", session_id},
                {"where", where},
                {"message", message},
                {"ts", unix_seconds_now()}
            }}
            }, &err);

        if (!err.empty()) std::fprintf(stderr, "DB error-log failed: %s\n", err.c_str());
    }
    catch (...) {
        // never throw from logger
    }
}

// ------------------ LLM Engine wiring ------------------

static std::unique_ptr<LLMEngine> g_llm = std::make_unique<LLMEngineHttp>();

static LLMResult llm_unused_result() {
    LLMResult r;              // relies on llm_engine.h defaults
    r.used = false;
    r.ok = true;
    r.on_device = (g_llm ? g_llm->is_loaded() : false);
    r.model_name = (g_llm ? g_llm->model_name() : "");
    r.latency_ms = 0;
    r.error.clear();
    r.text.clear();
    return r;
}

static nlohmann::json llm_json(const LLMResult& r) {
    return nlohmann::json{
        {"on_device", r.on_device},
        {"model_name", r.model_name},
        {"latency_ms", r.latency_ms},
        {"used", r.used},
        {"ok", r.ok},
        {"error", r.error}
    };
}

// ------------------ In-memory session store ------------------

struct Msg {
    std::string role; // "user" | "assistant"
    std::string text;
    long long ts = 0;
    int turn_index = 0;
};

struct SessionState {
    long long started_at = 0;
    int turns = 0;

    std::string mode = "collecting"; // "collecting" | "active"
    std::unordered_map<std::string, std::string> slots;

    std::vector<Msg> history; // cap 100
};

static std::unordered_map<std::string, SessionState> g_sessions;
static std::mutex g_mu;

static void history_push(SessionState& st, const std::string& role, const std::string& text, int turn_index) {
    Msg m;
    m.role = role;
    m.text = text;
    m.ts = unix_seconds_now();
    m.turn_index = turn_index;
    st.history.push_back(std::move(m));

    const size_t CAP = 100;
    if (st.history.size() > CAP) {
        st.history.erase(st.history.begin(), st.history.begin() + (st.history.size() - CAP));
    }
}

// ------------------ Orchestrator helpers ------------------

static std::string next_missing_slot(const SessionState& st) {
    if (st.slots.find("role") == st.slots.end()) return "role";
    if (st.slots.find("issue_type") == st.slots.end()) return "issue_type";
    if (st.slots.find("urgency") == st.slots.end()) return "urgency";
    return "";
}

static std::vector<std::string> missing_fields_vec(const SessionState& st) {
    std::vector<std::string> miss;
    if (st.slots.find("role") == st.slots.end()) miss.push_back("role");
    if (st.slots.find("issue_type") == st.slots.end()) miss.push_back("issue_type");
    if (st.slots.find("urgency") == st.slots.end()) miss.push_back("urgency");
    return miss;
}

static std::string question_for_slot(const std::string& slot) {
    if (slot == "role") return "What's your role onboard? (deck / engine / galley / other)";
    if (slot == "issue_type") return "What do you want help with? (fatigue / schedule / safety / pay / conflict / other)";
    if (slot == "urgency") return "How urgent is it? (now / today / this week)";
    return "Tell me more.";
}

static nlohmann::json slots_snapshot_json(const SessionState& st) {
    nlohmann::json out = nlohmann::json::object();
    for (const auto& kv : st.slots) out[kv.first] = kv.second;
    return out;
}

static std::string build_prompt_from_state(const SessionState& st,
    const nlohmann::json& slots_json,
    const std::vector<std::string>& missing_fields,
    const std::string& last_user_text) {
    std::ostringstream p;

    p << "You are GreenWatch, an onboard assistant.\n";
    p << "Be brief: 1-2 short sentences.\n";
    p << "Ask at most ONE question.\n";
    p << "If collecting a log, ask for exactly one missing field.\n\n";

    p << "Slots: " << slots_json.dump() << "\n";
    p << "Missing fields: [";
    for (size_t i = 0; i < missing_fields.size(); i++) {
        if (i) p << ", ";
        p << missing_fields[i];
    }
    p << "]\n\n";

    p << "Conversation:\n";
    int start = (int)st.history.size() - 10;
    if (start < 0) start = 0;
    for (int i = start; i < (int)st.history.size(); i++) {
        p << st.history[i].role << ": " << st.history[i].text << "\n";
    }
    p << "user: " << last_user_text << "\n";
    p << "assistant:";

    return p.str();
}

// ------------------ Main ------------------

int main() {
    using json = nlohmann::json;
    httplib::Server svr;

    svr.Options(R"(.*)", [&](const httplib::Request&, httplib::Response& res) {
        add_cors(res);
        res.status = 204;
        });

    svr.Get("/health", [&](const httplib::Request&, httplib::Response& res) {
        add_cors(res);
        json out = {
            {"ok", true},
            {"ts", unix_seconds_now()},
            {"llm_loaded", g_llm ? g_llm->is_loaded() : false},
            {"llm_model", g_llm ? g_llm->model_name() : ""}
        };
        res.set_content(out.dump(), "application/json");
        });

    svr.Get("/debug/db_write_test", [&](const httplib::Request&, httplib::Response& res) {
        add_cors(res);

        std::string err;
        bool ok = vdb_upsert({
            {"collection", "events"},
            {"payload", {
                {"_id", make_event_id()},
                {"type", "debug_db_write_test"},
                {"ts", unix_seconds_now()},
                {"note", "If you see this in DB, logging works."}
            }}
            }, &err);

        json out = { {"ok", ok} };
        if (!ok) out["error"] = err;
        res.set_content(out.dump(), "application/json");
        });

    // GET /debug/llm_test?prompt=hello
    svr.Get("/debug/llm_test", [&](const httplib::Request& req, httplib::Response& res) {
        add_cors(res);

        std::string prompt = req.has_param("prompt") ? req.get_param_value("prompt") : "hello";
        LLMResult r = llm_unused_result();

        if (!g_llm) {
            r.used = true;
            r.ok = false;
            r.error = "LLM engine not set";
        }
        else {
            r = g_llm->generate(prompt, 64, 0.7f);
            r.used = true;
            r.on_device = g_llm->is_loaded();
            r.model_name = g_llm->model_name();
        }

        json out = {
            {"ok", r.ok},
            {"text", r.text},
            {"latency_ms", r.latency_ms},
            {"model_name", r.model_name},
            {"used", r.used},
            {"on_device", r.on_device},
            {"error", r.error}
        };
        res.set_content(out.dump(), "application/json");
        });

    // GET /session/history?session_id=...&n=50
    svr.Get("/session/history", [&](const httplib::Request& req, httplib::Response& res) {
        add_cors(res);

        if (!req.has_param("session_id")) {
            res.status = 400;
            res.set_content(json({ {"error","Missing session_id"} }).dump(), "application/json");
            return;
        }

        std::string session_id = req.get_param_value("session_id");
        int n = 50;
        if (req.has_param("n")) {
            try { n = std::stoi(req.get_param_value("n")); }
            catch (...) { n = 50; }
        }
        n = std::max(1, std::min(200, n));

        json out;
        {
            std::lock_guard<std::mutex> lock(g_mu);
            auto it = g_sessions.find(session_id);
            if (it == g_sessions.end()) {
                res.status = 404;
                res.set_content(json({ {"error","Unknown session_id"} }).dump(), "application/json");
                return;
            }

            const SessionState& st = it->second;
            int start = (int)st.history.size() - n;
            if (start < 0) start = 0;

            json msgs = json::array();
            for (int i = start; i < (int)st.history.size(); i++) {
                msgs.push_back({
                    {"turn_index", st.history[i].turn_index},
                    {"role", st.history[i].role},
                    {"text", st.history[i].text},
                    {"ts", st.history[i].ts}
                    });
            }

            out = {
                {"session_id", session_id},
                {"mode", st.mode},
                {"turn_index", st.turns},
                {"slots", slots_snapshot_json(st)},
                {"missing_fields", missing_fields_vec(st)},
                {"messages", msgs}
            };
        }

        res.set_content(out.dump(), "application/json");
        });

    // POST /session/start
    svr.Post("/session/start", [&](const httplib::Request&, httplib::Response& res) {
        add_cors(res);

        std::string session_id = random_id(16);
        long long now = unix_seconds_now();

        // best-effort DB logs
        {
            std::string err;
            vdb_upsert({
                {"collection", "sessions"},
                {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"started_at", now}}}
                }, &err);
        }
        {
            std::string err;
            vdb_upsert({
                {"collection", "events"},
                {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"type", "session_start"}, {"ts", now}}}
                }, &err);
        }

        {
            std::lock_guard<std::mutex> lock(g_mu);
            SessionState st;
            st.started_at = now;
            st.turns = 0;
            st.mode = "collecting";
            st.slots.clear();
            st.history.clear();
            g_sessions[session_id] = std::move(st);
        }

        LLMResult lr = llm_unused_result();
        json out = {
            {"session_id", session_id},
            {"started_at", now},
            {"mode", "collecting"},
            {"turn_index", 0},
            {"slots", json::object()},
            {"missing_fields", json::array({"role","issue_type","urgency"})},
            {"llm", llm_json(lr)}
        };
        res.set_content(out.dump(), "application/json");
        });

    // POST /session/message
    svr.Post("/session/message", [&](const httplib::Request& req, httplib::Response& res) {
        add_cors(res);
        std::string sid_for_error = "(unknown)";

        try {
            json body;
            try { body = json::parse(req.body); }
            catch (...) {
                res.status = 400;
                res.set_content(json({ {"error","Invalid JSON"} }).dump(), "application/json");
                return;
            }

            if (!body.contains("session_id") || !body.contains("user_text")) {
                res.status = 400;
                res.set_content(json({ {"error","Missing session_id or user_text"} }).dump(), "application/json");
                return;
            }

            std::string session_id = body["session_id"].get<std::string>();
            std::string user_text = body["user_text"].get<std::string>();
            sid_for_error = session_id;

            std::string assistant_text;
            std::string mode_out;
            int turn_index = 0;
            json slots_json = json::object();
            std::vector<std::string> missing_fields;
            LLMResult llmR = llm_unused_result();

            bool should_call_llm = false;
            std::string prompt_for_llm;

            // ---- lock: mutate state + compute prompt ----
            SessionState st_copy; // for prompt building only
            {
                std::lock_guard<std::mutex> lock(g_mu);
                auto it = g_sessions.find(session_id);
                if (it == g_sessions.end()) {
                    res.status = 404;
                    res.set_content(json({ {"error","Unknown session_id"} }).dump(), "application/json");
                    return;
                }

                SessionState& st = it->second;
                st.turns += 1;
                turn_index = st.turns;

                history_push(st, "user", user_text, turn_index);

                if (st.mode == "collecting") {
                    std::string missing = next_missing_slot(st);
                    if (!missing.empty()) st.slots[missing] = user_text;

                    std::string next = next_missing_slot(st);
                    if (!next.empty()) {
                        st.mode = "collecting";
                        mode_out = "collecting";
                        assistant_text = question_for_slot(next);
                        llmR = llm_unused_result(); // unused
                    }
                    else {
                        st.mode = "active";
                        mode_out = "active";
                        should_call_llm = true;
                    }
                }
                else {
                    st.mode = "active";
                    mode_out = "active";
                    should_call_llm = true;
                }

                slots_json = slots_snapshot_json(st);
                missing_fields = missing_fields_vec(st);

                // copy for prompt building outside lock
                st_copy = st;
            }
            // ---- end lock ----

            if (should_call_llm) {
                prompt_for_llm = build_prompt_from_state(st_copy, slots_json, missing_fields, user_text);

                if (!g_llm) {
                    llmR = llm_unused_result();
                    llmR.used = true;
                    llmR.ok = false;
                    llmR.error = "LLM engine not set";
                    assistant_text = "Local model is not loaded. Please try again.";
                }
                else {
                    llmR = g_llm->generate(prompt_for_llm, 160, 0.7f);
                    llmR.used = true;
                    llmR.on_device = g_llm->is_loaded();
                    llmR.model_name = g_llm->model_name();

                    if (llmR.ok && !llmR.text.empty()) assistant_text = llmR.text;
                    else {
                        llmR.ok = false;
                        if (llmR.error.empty()) llmR.error = "LLM generation failed";
                        assistant_text = "I hit a local model error. Tell me in one sentence what you need most right now.";
                    }
                }
            }

            // push assistant to history
            {
                std::lock_guard<std::mutex> lock(g_mu);
                auto it = g_sessions.find(session_id);
                if (it != g_sessions.end()) {
                    history_push(it->second, "assistant", assistant_text, turn_index);
                }
            }

            // best-effort DB logs
            {
                std::string err;
                vdb_upsert({
                    {"collection","messages"},
                    {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"role","user"}, {"text", user_text}, {"ts", unix_seconds_now()}, {"turn_index", turn_index}}}
                    }, &err);
            }
            {
                std::string err;
                vdb_upsert({
                    {"collection","messages"},
                    {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"role","assistant"}, {"text", assistant_text}, {"ts", unix_seconds_now()}, {"turn_index", turn_index}}}
                    }, &err);
            }
            {
                std::string err;
                vdb_upsert({
                    {"collection","events"},
                    {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"type","turn"}, {"mode", mode_out}, {"slots", slots_json}, {"ts", unix_seconds_now()}, {"turn_index", turn_index}}}
                    }, &err);
            }

            json out = {
                {"session_id", session_id},
                {"turn_index", turn_index},
                {"mode", mode_out},
                {"assistant_text", assistant_text},
                {"slots", slots_json},
                {"missing_fields", missing_fields},
                {"llm", llm_json(llmR)}
            };
            res.set_content(out.dump(), "application/json");

        }
        catch (const std::exception& e) {
            log_error_event(sid_for_error, "/session/message", e.what());
            res.status = 500;
            res.set_content(json({ {"error","Internal error"}, {"detail", e.what()} }).dump(), "application/json");
        }
        catch (...) {
            log_error_event(sid_for_error, "/session/message", "unknown exception");
            res.status = 500;
            res.set_content(json({ {"error","Internal error"}, {"detail","unknown exception"} }).dump(), "application/json");
        }
        });

    const char* host = "127.0.0.1";
    const int port = 8080;

    std::printf("GreenWatch runner listening on http://%s:%d\n", host, port);

    if (!svr.listen(host, port)) {
        std::fprintf(stderr, "Failed to bind/listen on %s:%d\n", host, port);
        return 1;
    }
    return 0;
}
