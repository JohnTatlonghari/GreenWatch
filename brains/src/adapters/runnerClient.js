const RUNNER_URL = "http://127.0.0.1:3030/infer";

export async function inferWellbeing(text) {
  try {
    const response = await fetch(RUNNER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();

    // If backend returned error shape
    if (data.error) {
      return { error: data.error };
    }

    // Expected success shape
    return {
      level: data.level,
      confidence: data.confidence,
      inference_ms: data.inference_ms,
      on_device: data.on_device
    };

  } catch (err) {
    return { error: "Runner offline" };
  }
}