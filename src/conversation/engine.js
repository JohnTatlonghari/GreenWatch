// CONVERSATION ENGINE (Minimal)

// Update slot values based on user message
export function updateSlots(slots, text) {
  const lower = text.toLowerCase();

  // ---- TASK TYPE DETECTION ----
  if (!slots.taskType) {
    if (lower.includes("inspection")) {
      slots.taskType = "inspection";
    } else if (lower.includes("loading")) {
      slots.taskType = "loading";
    } else if (lower.includes("paperwork")) {
      slots.taskType = "paperwork";
    }
  }

  // ---- URGENCY DETECTION ----
  if (!slots.urgency) {
    if (
      lower.includes("urgent") ||
      lower.includes("asap") ||
      lower.includes("emergency")
    ) {
      slots.urgency = "urgent";
    } else if (
      lower.includes("routine") ||
      lower.includes("normal")
    ) {
      slots.urgency = "routine";
    }
  }
  return slots;
}

// Decide what should happen next
export function decideNextAction(slots) {

  // Ask for missing task type
  if (!slots.taskType) {
    return {
      type: "ask",
      text: "What type of task are you performing? (inspection, loading, paperwork)"
    };
  }

  // Ask for missing urgency
  if (!slots.urgency) {
    return {
      type: "ask",
      text: "Is this routine or urgent?"
    };
  }

  // All required information gathered
  return {
    type: "respond"
  };
}