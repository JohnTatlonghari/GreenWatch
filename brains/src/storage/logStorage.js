// import { createLogEvent } from "../types/models.js"; // Reuse your factory so all events have the same shape.

// // Prefix keeps our log keys grouped in localStorage (avoids collisions with other app keys).
// const LOG_KEY_PREFIX = "sfhacks26_log_"; // Example final key: sfhacks26_log_<sessionId>

// // Builds the localStorage key for a given session.
// function keyFor(sessionId) {
//   return `${LOG_KEY_PREFIX}${sessionId}`; // Ensures every session has its own isolated log list.
// }

// // Safely read and parse the stored log array for a session.
// // If nothing exists yet, return an empty array.
// function readLogArray(sessionId) {
//   const raw = localStorage.getItem(keyFor(sessionId)); // Fetch string from localStorage.
//   if (!raw) return []; // No log stored yet.

//   try {
//     const parsed = JSON.parse(raw); // Convert string back into JS data.
//     return Array.isArray(parsed) ? parsed : []; // Ensure it’s an array; otherwise treat as empty.
//   } catch {
//     return []; // If JSON is corrupted, fail safely instead of crashing the app.
//   }
// }

// // Write the entire log array back to storage.
// function writeLogArray(sessionId, events) {
//   localStorage.setItem(keyFor(sessionId), JSON.stringify(events)); // Persist as JSON string.
// }

// // Append a new event to the session log.
// export function appendEvent(sessionId, type, payload = {}) {
//   const events = readLogArray(sessionId); // Load existing events.
//   const event = createLogEvent({ sessionId, type, payload }); // Create a properly-shaped event record.
//   events.push(event); // Append to end (chronological order).
//   writeLogArray(sessionId, events); // Save back.
//   return event; // Return the event (useful for debugging / UI updates).
// }

// // List all events for a session (chronological).
// export function listEvents(sessionId) {
//   return readLogArray(sessionId); // Just return the stored array.
// }

// // Remove all log events for a session (optional helper).
// export function clearEvents(sessionId) {
//   localStorage.removeItem(keyFor(sessionId)); // Delete the session log key entirely.
// }

// // Export a session log as a JSON string (handy for demo/export).
// export function exportEvents(sessionId) {
//   const events = readLogArray(sessionId); // Read events.
//   return JSON.stringify(events, null, 2); // Pretty-print JSON.
// }