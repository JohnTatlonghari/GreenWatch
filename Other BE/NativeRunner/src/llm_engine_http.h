#pragma once
#include "llm_engine.h"
#include "httplib.h"
#include <chrono>

class LLMEngineHttp final : public LLMEngine {
public:
    explicit LLMEngineHttp(std::string host = "127.0.0.1", int port = 50060)
        : host_(std::move(host)), port_(port) {}

    bool is_loaded() const override { return true; } // service decides
    std::string model_name() const override { return "executorch_http"; }

    LLMResult generate(const std::string& prompt, int max_new_tokens, float temperature) override {
        LLMResult r;
        r.used = true;
        r.on_device = true;
        r.model_name = model_name();

        try {
            auto t0 = std::chrono::steady_clock::now();

            httplib::Client cli(host_, port_);
            cli.set_connection_timeout(2);
            cli.set_read_timeout(60);

            nlohmann::json req = {
                {"prompt", prompt},
                {"max_new_tokens", max_new_tokens},
                {"temperature", temperature}
            };

            auto res = cli.Post("/generate", req.dump(), "application/json");
            if (!res) {
                r.ok = false;
                r.error = "No response from LLM service (docker not running?)";
                return r;
            }

            auto t1 = std::chrono::steady_clock::now();
            r.latency_ms = (int)std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();

            nlohmann::json out = nlohmann::json::parse(res->body, nullptr, false);
            if (out.is_discarded()) {
                r.ok = false;
                r.error = "Invalid JSON from LLM service";
                return r;
            }

            r.ok = out.value("ok", false);
            r.text = out.value("text", "");
            r.error = out.value("error", "");
            return r;
        }
        catch (const std::exception& e) {
            r.ok = false;
            r.error = e.what();
            return r;
        }
    }

private:
    std::string host_;
    int port_;
};
