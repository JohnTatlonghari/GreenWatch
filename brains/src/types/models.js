// MESSAGE FACTORY

// Message object represents a single piece of communication in the conversation.
// This factory function creates a new message with all required fields.
export function createMessage({ id, sessionId, role, content }) {
  const safeId = id ?? crypto.randomUUID(); // If caller didn't provide an id, generate one.
  const safeRole = role === "user" || role === "assistant" || role === "system" ? role : "user"; // Prevent invalid roles.

  return { 
    id: safeId,  // Unique identifier for this message.
    sessionId: sessionId, // Links this message to a specific chat session.
    role: safeRole, // Who sent the message.  "user" | "assistant" | "system"
    content: content,  // The actual text of the message.
    timestamp: Date.now() // Automatically records time of creation in milliseconds.
  };
}

// SESSION FACTORY
// Creates a new conversation session object.
export function createSession() {
  return {
    id: crypto.randomUUID(), // Generates a unique session ID automatically.
    startedAt: Date.now(), // Records when the session began.
    endedAt: null, // Will remain null until session is closed.
    title: null // Optional short name for session.
  };
}

// SLOT STATE FACTORY
// Creates an empty slot object.
// Slots store structured info extracted from conversation.
export function createEmptySlots() {
  return {
    taskType: null, // Example: "inspection", "loading", "paperwork"
    urgency: null, // Expected values: "routine" or "urgent"
    role: null, // Example: "dock worker", "supervisor"
    constraints: [], // List of constraints affecting task.
    environment: null, // Example: "night shift", "heavy wind"
  };
}

// LOG EVENT FACTORY
// Creates a structured log event entry.
// Every internal action in your system should create one of these.
export function createLogEvent({ sessionId, type, payload }) {
  return {
    id: crypto.randomUUID(), // Unique identifier for this event.
    sessionId: sessionId, // Links event to a session.
    type: type, // Type of event: "SESSION_STARTED," "USER_MESSAGE," "ASSISTANT_MESSAGE"
    payload: payload, // Any additional data attached to event.
    timestamp: Date.now() // Records when event occurred.
  }
}