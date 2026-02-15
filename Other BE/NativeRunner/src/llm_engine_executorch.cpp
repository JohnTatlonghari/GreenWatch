#include "llm_engine_executorch.h"
#include <chrono>

LLMEngineExecuTorch::LLMEngineExecuTorch(const std::string& pte_path,
    const std::string& tokenizer_path)
    : pte_path_(pte_path), tok_path_(tokenizer_path) {
    // TODO (next steps): real ExecuTorch init and model load.
    // For now keep it "not loaded" so main.cpp falls back to stub.
    loaded_ = false;
    model_ = "executorch_unwired";
    err_ = "ExecuTorch engine skeleton created (not linked/loaded yet)";
}

bool LLMEngineExecuTorch::is_loaded() const {
    return loaded_;
}

std::string LLMEngineExecuTorch::model_name() const {
    return model_;
}

LLMResult LLMEngineExecuTorch::generate(const std::string& prompt, int max_new_tokens, float temperature) {
    (void)prompt; (void)max_new_tokens; (void)temperature;
    auto t0 = std::chrono::steady_clock::now();

    LLMResult r;
    r.used = true;

    if (!loaded_) {
        r.ok = false;
        r.model_name = model_;
        r.error = err_;
        r.text = "Local model not loaded (ExecuTorch engine not ready).";
    }
    else {
        // TODO: real inference.
        r.ok = true;
        r.model_name = model_;
        r.text = "ExecuTorch loaded, but generate() not implemented yet.";
    }

    auto t1 = std::chrono::steady_clock::now();
    r.latency_ms = (int)std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
    return r;
}
