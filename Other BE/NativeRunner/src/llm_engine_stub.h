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
        r.ok = true;
        r.model_name = "stub";
        r.text = "LLM is not wired yet, but the hook works. (This will be ExecuTorch output.)";

        auto t1 = std::chrono::steady_clock::now();
        r.latency_ms = (int)std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
        return r;
    }
};
