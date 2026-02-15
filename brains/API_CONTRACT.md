# API_CONTRACT.md
## GreenWatch — Runner API Contract (Demo v1)

---

## 1. Overview

This document defines the stable HTTP contract between:

- C++ Runner (backend brain)
- React UI (frontend)
- Future LLM integration
- Future VectorAI retrieval

This contract must remain stable during demo development.

All field names must match exactly.

---

## 2. Base URL

Local runner:

http://127.0.0.1:8080

---

## 3. Endpoints

---

### 3.1 GET /health

Response:

{
  "status": "ok"
}

---

### 3.2 POST /session/start

Request:

{}

Response:

{
  "session_id": "string"
}

Creates a new session and initializes empty slots.

---

### 3.3 POST /session/message

Request:

{
  "session_id": "string",
  "text": "string"
}

Response:

{
  "session_id": "string",
  "turn_index": 1,

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

  "missing_fields": [
    "main_engine_rpm",
    "alarms"
  ],

  "missing_count": 2,

  "progress": 0.66,

  "ui": {
    "prompt": "What was the main engine RPM?"
  },

  "db": {
    "ok": true
  },

  "llm": {
    "on_device": false,
    "model_name": "stub",
    "latency_ms": 0
  },

  "retrieval": {
    "hits_count": 0
  }
}

---

## 4. Mode Definitions

COLLECTING  
- At least one required field is missing  
- Assistant should ask exactly one missing field question  
- UI shows progress bar and prompt  

DONE  
- All required fields are filled  
- Assistant returns final summary  
- UI shows completed log  

---

## 5. Required Fields (from LOG_FIELDS.md)

vessel_name  
watch_period  
main_engine_rpm  
main_engine_load_percent  
alarms  
actions_taken  

Session is DONE when all 6 are filled.

---

## 6. Progress Calculation

progress = filled_required_fields / 6

Example:
4 filled → progress = 0.66

---

## 7. UI Integration Rules

React UI should:

- Always render assistant_text
- If mode === "COLLECTING":
  - Display ui.prompt
  - Display progress bar
- If mode === "DONE":
  - Display summary (assistant_text)
- Never implement business logic locally
- Trust runner for slot state

---

## 8. Future Extensions (Non-Breaking)

The following fields may be expanded later:

- db.error
- llm.on_device true when ExecuTorch integrated
- retrieval.hits_count when DB search added
- Additional optional slot fields

These must not remove or rename existing fields.

---

## 9. Stability Rule

Field names and casing are final for demo:

vessel_name  
watch_period  
main_engine_rpm  
main_engine_load_percent  
alarms  
actions_taken  

Do not rename.

---

## 10. Example DONE Response

{
  "session_id": "abc123",
  "turn_index": 7,
  "mode": "DONE",
  "assistant_text": "GreenWatch — Engineering Watch Log\n\nVessel: MV Horizon\nWatch Period: 08:00–12:00\nMain Engine RPM: 1200\nEngine Load: 65%\nAlarms/Faults: none\nActions Taken: none\n\nStatus: Log complete.",
  "slots": {
    "vessel_name": "MV Horizon",
    "watch_period": "08:00–12:00",
    "main_engine_rpm": 1200,
    "main_engine_load_percent": 65,
    "alarms": "none",
    "actions_taken": "none"
  },
  "missing_fields": [],
  "missing_count": 0,
  "progress": 1.0,
  "ui": {
    "prompt": null
  },
  "db": { "ok": true },
  "llm": { "on_device": false, "model_name": "stub", "latency_ms": 12 },
  "retrieval": { "hits_count": 0 }
}
