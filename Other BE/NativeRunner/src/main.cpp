#include "httplib.h"
#include "nlohmann/json.hpp"

#include <chrono>
#include <cstdint>
#include <cstdio>
#include <ctime>
#include <exception>
#include <mutex>
#include <random>
#include <sstream>
#include <string>
#include <unordered_map>

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

// Returns true if bridge responded HTTP 200.
static bool vdb_upsert(const nlohmann::json& payload, std::string* err_out = nullptr) {
    try {
        httplib::Client cli("127.0.0.1", 50052);
        cli.set_connection_timeout(2); // seconds
        cli.set_read_timeout(5);

        // payload is expected to contain {"collection": "...", "payload": {...}}
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
            if (err_out) {
                *err_out = "Bridge returned HTTP " + std::to_string(res->status) + " body=" + res->body;
            }
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

// ------------------ In-memory session store ------------------

struct SessionState {
    long long started_at = 0;
    int turns = 0;

    // slot-filling
    std::string mode = "collecting"; // "collecting" | "active"
    std::unordered_map<std::string, std::string> slots;
};

static std::unordered_map<std::string, SessionState> g_sessions;
static std::mutex g_mu;

// ------------------ Orchestrator helpers ------------------

static std::string next_missing_slot(const SessionState& st) {
    if (st.slots.find("role") == st.slots.end()) return "role";
    if (st.slots.find("issue_type") == st.slots.end()) return "issue_type";
    if (st.slots.find("urgency") == st.slots.end()) return "urgency";
    return "";
}

static std::string question_for_slot(const std::string& slot) {
    // ASCII-only strings to avoid invalid UTF-8 in JSON
    if (slot == "role") return "What's your role onboard? (deck / engine / galley / other)";
    if (slot == "issue_type") return "What do you want help with? (fatigue / schedule / safety / pay / conflict / other)";
    if (slot == "urgency") return "How urgent is it? (now / today / this week)";
    return "Tell me more.";
}

// ------------------ Main ------------------

int main() {
    using json = nlohmann::json;

    httplib::Server svr;

    // CORS preflight for browser fetch()
    svr.Options(R"(.*)", [&](const httplib::Request&, httplib::Response& res) {
        add_cors(res);
        res.status = 204;
        });

    // GET /health
    svr.Get("/health", [&](const httplib::Request&, httplib::Response& res) {
        add_cors(res);
        json out = { {"ok", true}, {"ts", unix_seconds_now()} };
        res.set_content(out.dump(), "application/json");
        });

    // GET /debug/db_write_test
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

    // POST /session/start
    svr.Post("/session/start", [&](const httplib::Request& req, httplib::Response& res) {
        add_cors(res);
        (void)req;

        std::string session_id = random_id(16);
        long long now = unix_seconds_now();

        // Log session record
        {
            std::string err;
            if (!vdb_upsert({
                {"collection", "sessions"},
                {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"started_at", now}}}
                }, &err)) {
                std::fprintf(stderr, "VectorDB log failed (sessions): %s\n", err.c_str());
            }
        }

        // Log event
        {
            std::string err;
            if (!vdb_upsert({
                {"collection", "events"},
                {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"type", "session_start"}, {"ts", now}}}
                }, &err)) {
                std::fprintf(stderr, "VectorDB log failed (events): %s\n", err.c_str());
            }
        }

        {
            std::lock_guard<std::mutex> lock(g_mu);
            SessionState st;
            st.started_at = now;
            st.turns = 0;
            st.mode = "collecting";
            g_sessions[session_id] = std::move(st);
        }

        json out = { {"session_id", session_id}, {"started_at", now} };
        res.set_content(out.dump(), "application/json");
        });

    // POST /session/message (SAFE)
    svr.Post("/session/message", [&](const httplib::Request& req, httplib::Response& res) {
        add_cors(res);

        std::string sid_for_error = "(unknown)";

        try {
            json body;
            try {
                body = json::parse(req.body);
            }
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

            // Log user message (best-effort)
            {
                std::string err;
                vdb_upsert({
                    {"collection", "messages"},
                    {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"role", "user"}, {"text", user_text}, {"ts", unix_seconds_now()}}}
                    }, &err);
                if (!err.empty()) std::fprintf(stderr, "VectorDB log failed (user msg): %s\n", err.c_str());
            }

            std::string assistant;
            std::string mode;

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

                if (st.mode == "collecting") {
                    // Put the user's answer into the current missing slot
                    std::string missing = next_missing_slot(st);
                    if (!missing.empty()) st.slots[missing] = user_text;

                    // Ask next question or switch to active
                    std::string next = next_missing_slot(st);
                    if (!next.empty()) {
                        st.mode = "collecting";
                        mode = "collecting";
                        assistant = question_for_slot(next);
                    }
                    else {
                        st.mode = "active";
                        mode = "active";

                        auto role_it = st.slots.find("role");
                        auto issue_it = st.slots.find("issue_type");
                        auto urg_it = st.slots.find("urgency");

                        std::string role = (role_it != st.slots.end()) ? role_it->second : "";
                        std::string issue = (issue_it != st.slots.end()) ? issue_it->second : "";
                        std::string urg = (urg_it != st.slots.end()) ? urg_it->second : "";

                        // ASCII-only (no en-dash)
                        assistant =
                            "Got it. Role: " + role +
                            ", issue: " + issue +
                            ", urgency: " + urg + ".\n"
                            "Tell me what happened in 2-3 sentences and what outcome you want.";
                    }
                }
                else {
                    mode = "active";
                    assistant = "Understood. What's the biggest constraint right now (time / fatigue / safety / other)?";
                }
            }

            // Log assistant message (best-effort)
            {
                std::string err;
                vdb_upsert({
                    {"collection", "messages"},
                    {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"role", "assistant"}, {"text", assistant}, {"ts", unix_seconds_now()}}}
                    }, &err);
                if (!err.empty()) std::fprintf(stderr, "VectorDB log failed (assistant msg): %s\n", err.c_str());
            }

            // Slots snapshot (best-effort)
            nlohmann::json slots_json = nlohmann::json::object();
            {
                std::lock_guard<std::mutex> lock(g_mu);
                auto it = g_sessions.find(session_id);
                if (it != g_sessions.end()) {
                    for (const auto& kv : it->second.slots) slots_json[kv.first] = kv.second;
                }
            }

            // Turn event (best-effort)
            {
                std::string err;
                vdb_upsert({
                    {"collection", "events"},
                    {"payload", {{"_id", make_event_id()}, {"session_id", session_id}, {"type", "turn"}, {"mode", mode}, {"slots", slots_json}, {"ts", unix_seconds_now()}}}
                    }, &err);
                if (!err.empty()) std::fprintf(stderr, "VectorDB log failed (turn event): %s\n", err.c_str());
            }

            json out = { {"assistant_text", assistant}, {"mode", mode} };
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

    // Local-only bind
    const char* host = "127.0.0.1";
    const int port = 8080;

    std::printf("GreenWatch runner listening on http://%s:%d\n", host, port);

    if (!svr.listen(host, port)) {
        std::fprintf(stderr, "Failed to bind/listen on %s:%d\n", host, port);
        return 1;
    }
    return 0;
}
