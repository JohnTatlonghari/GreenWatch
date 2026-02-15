#pragma once
#include "llm_engine.h"
#include <chrono>

class LLMEngineStub final : public LLMEngine {
public:
    bool is_loaded() const override { return true; }
    std::string model_name() const override { return "stub"; }

    LLMResult generate(const std::string& prompt, int max_new_tokens, float temperature) override {
        (void)prompt; (void)max_new_tokens; (void)temperature;

        auto t0 = std::chrono::steady_clock::now();
        LLMResult r;
        r.used = true;
        r.ok = true;
        r.on_device = true;
        r.model_name = "stub";
        r.text = "On-device LLM hook is wired (stub). What outcome do you want most right now?";
        auto t1 = std::chrono::steady_clock::now();
        r.latency_ms = (int)std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
        return r;
    }
};
