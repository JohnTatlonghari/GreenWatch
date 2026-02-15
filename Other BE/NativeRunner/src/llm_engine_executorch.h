#pragma once
#include "llm_engine.h"

#include <string>

class LLMEngineExecuTorch final : public LLMEngine {
public:
    // You can add more paths later (tokenizer_config, config.json, etc.)
    LLMEngineExecuTorch(const std::string& pte_path,
        const std::string& tokenizer_path);

    bool is_loaded() const override;
    std::string model_name() const override;
    LLMResult generate(const std::string& prompt, int max_new_tokens, float temperature) override;

    std::string last_error() const { return err_; }

private:
    bool loaded_ = false;
    std::string model_ = "executorch_unwired";
    std::string err_ = "ExecuTorch not initialized";
    std::string pte_path_;
    std::string tok_path_;
};