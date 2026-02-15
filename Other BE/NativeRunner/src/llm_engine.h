#pragma once
#include <string>

struct LLMResult {
    bool ok = false;
    std::string text;
    int latency_ms = 0;
    std::string model_name;
    std::string error;
};

class LLMEngine {
public:
    virtual ~LLMEngine() = default;
    virtual bool is_loaded() const = 0;
    virtual std::string model_name() const = 0;
    virtual LLMResult generate(const std::string& prompt,
        int max_new_tokens,
        float temperature) = 0;
};
