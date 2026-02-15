{
  "session_id": "string",
  "turn_index": 3,

  "mode": "COLLECTING" | "DONE",

  "assistant_text": "string",

  "slots": {
    "vessel_name": null,
    "watch_period": null,
    "main_engine_rpm": null,
    "main_engine_load_percent": null,
    "alarms": null,
    "actions_taken": null
  },

  "missing_fields": ["main_engine_rpm", "alarms"],
  "missing_count": 2,
  "progress": 0.66,

  "ui": {
    "prompt": "What was the main engine RPM?"
  },

  "db": { "ok": true },
  "llm": { "on_device": false },
  "retrieval": { "hits_count": 0 }
}