// Generic deterministic LogEngine (A3)
// Schema-driven structured logging engine

export function createLogEngine(schema) {
  let log = {};
  let pendingFieldKey = null;

  function applyUserText(text) {
    const cleaned = String(text || "").trim();
    if (!cleaned) {
      return { clarification: getNextQuestion() };
    }

    // If waiting for a specific field
    if (pendingFieldKey) {
      const field = getFieldByKey(pendingFieldKey);
      pendingFieldKey = null;

      const result = tryFillField(field, cleaned);
      if (result.clarification) {
        pendingFieldKey = field.key;
        return { clarification: result.clarification };
      }
    }

    // Try to fill missing required fields
    for (const field of getRequiredFields()) {
      if (log[field.key] !== undefined) continue;

      const result = tryFillField(field, cleaned);
      if (result.clarification) {
        pendingFieldKey = field.key;
        return { clarification: result.clarification };
      }
    }

    if (!isComplete()) {
      return { clarification: getNextQuestion() };
    }

    return { clarification: null };
  }

  function isComplete() {
    return getRequiredFields().every(f => log[f.key] !== undefined);
  }

  function getProgress() {
    const required = getRequiredFields();
    const filled = required.filter(f => log[f.key] !== undefined);
    return required.length === 0 ? 1 : filled.length / required.length;
  }

  function getNextQuestion() {
    const next = getRequiredFields().find(f => log[f.key] === undefined);
    return next ? next.question : null;
  }

  function getLog() {
    return { ...log };
  }

  function preFill(values) {
    Object.assign(log, values);
  }

  function reset() {
    log = {};
    pendingFieldKey = null;
  }

  function getFieldByKey(key) {
    return schema.find(f => f.key === key);
  }

  function getRequiredFields() {
    return schema.filter(f => f.required);
  }

  function tryFillField(field, text) {
    if (!field.parse) return { filled: false };

    const raw = field.parse(text);
    if (raw === null || raw === undefined) return { filled: false };

    if (!field.validate(raw)) {
      return { clarification: field.question };
    }

    log[field.key] = field.normalize ? field.normalize(raw) : raw;
    return { filled: true };
  }

  return {
    applyUserText,
    isComplete,
    getProgress,
    getNextQuestion,
    getLog,
    preFill,
    reset
  };
}