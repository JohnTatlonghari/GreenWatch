# LOG_FIELDS.md
## GreenWatch — Engineering Watch Log (Demo Scope)

---

## 1. Purpose
This file defines the minimal engineering watch log schema used for the GreenWatch demo.

The goal is to:
- Collect core operational engineering data
- Ask one question at a time
- Produce a clean structured summary
- Keep implementation simple

This schema is intentionally minimal for demo speed and stability.

## 2. Required Fields (Demo Scope)

The session is complete when all of the following are filled:

vessel_name  
watch_period  
main_engine_rpm  
main_engine_load_percent  
alarms  
actions_taken  

Progress = filled_required / 6

---

## 3. Field Definitions

---

### vessel_name
- Type: string
- Required: Yes
- Prompt:
  "What is the vessel name?"
- Example:
  "MV Horizon"

---

### watch_period
- Type: string
- Required: Yes
- Prompt:
  "Which watch period is this? (e.g., 08:00–12:00)"
- Example:
  "08:00-12:00"

---

### main_engine_rpm
- Type: integer
- Required: Yes
- Validation:
  0 – 5000
- Prompt:
  "What was the main engine RPM?"
- Example:
  "1200"

---

### main_engine_load_percent
- Type: integer
- Required: Yes
- Validation:
  0 – 100
- Prompt:
  "What was the engine load percentage?"
- Example:
  "65"

---

### alarms
- Type: string
- Required: Yes
- Validation:
  Any text OR "none"
- Prompt:
  "Were there any alarms or faults? If none, say 'none'."
- Example:
  "none"
  "High temperature alarm"

---

### actions_taken
- Type: string
- Required: Yes
- Validation:
  Any text OR "none"
- Prompt:
  "What actions were taken? If none, say 'none'."
- Example:
  "Replaced fuel filter"
  "Reset alarm and monitored"

---


## 4. Completion Rule

When all required fields are filled:

mode → DONE  
Generate final summary.

---

## 5. Final Log Summary Template

GreenWatch — Engineering Watch Log

Vessel: {vessel_name}  
Watch Period: {watch_period}  

Main Engine RPM: {main_engine_rpm}  
Engine Load: {main_engine_load_percent}%  

Alarms/Faults: {alarms}  
Actions Taken: {actions_taken}  

Status: Log complete.

---

## 6. Demo Constraints

- Ask only ONE question at a time.
- Keep responses short.
- Do not overwhelm the user.
- Do not ask compound questions.
- If value invalid → re-ask same field.
- Keep logic deterministic.

---

## 7. Implementation Notes for Runner

- Maintain a slots object with the 6 required keys.
- After each message:
  - Update slots
  - Compute missing fields
  - Ask next missing field prompt
- When missing_count == 0 → mode = DONE
- Return slots snapshot in API response.

