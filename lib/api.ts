/**
 * Boilerplate backend service layer.
 *
 * All functions currently return mock data with simulated network latency.
 * Replace the implementations with real API calls when a backend is available.
 */

// ---------- Types ----------

export interface UploadResult {
  /** Unique ID returned by the backend for this document */
  documentId: string
  /** Field names extracted from the uploaded form (for dynamic question generation) */
  fields: string[]
}

// ---------- Helpers ----------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------- API Functions ----------

/**
 * Upload a document (PDF) to the backend for processing.
 *
 * TODO: Replace with a real `fetch` / `POST` to your upload endpoint.
 * Example:
 *   const formData = new FormData()
 *   formData.append("file", file)
 *   const res = await fetch("/api/documents/upload", { method: "POST", body: formData })
 *   return res.json()
 */
export async function uploadDocument(file: File): Promise<UploadResult> {
  // Simulate network latency
  await delay(800 + Math.random() * 600)

  // Mock response -- in production, the backend would parse the PDF and return extracted fields
  return {
    documentId: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fields: [
      "project_name",
      "primary_contact",
      "submission_date",
      "classification",
    ],
  }
}

/**
 * Submit a user's answer to a specific question.
 *
 * TODO: Replace with a real `fetch` / `POST` to your answers endpoint.
 * Example:
 *   await fetch("/api/documents/${documentId}/answers", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ questionId, answer }),
 *   })
 */
export async function submitAnswer(
  documentId: string,
  questionId: string,
  answer: string
): Promise<void> {
  // Simulate network latency
  await delay(300 + Math.random() * 300)

  // In production, this would persist the answer on the backend
  // eslint-disable-next-line no-console
  console.log(
    `[API Mock] Answer submitted: doc=${documentId}, question=${questionId}, answer=${answer}`
  )
}

/**
 * Send a free-form chat message and receive a response.
 *
 * TODO: Replace with a real `fetch` / `POST` to your chat endpoint.
 * Example:
 *   const res = await fetch("/api/documents/${documentId}/chat", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ message }),
 *   })
 *   const data = await res.json()
 *   return data.reply
 */
export async function sendMessage(
  documentId: string,
  message: string
): Promise<string> {
  // Simulate network latency
  await delay(1000 + Math.random() * 1000)

  // Mock responses -- in production, this would call an LLM or backend service
  const responses = [
    "Based on the document you uploaded, I can see the relevant sections. Could you clarify which part you'd like me to focus on?",
    "That's a great question. According to the document, the information you're looking for is in section 3. Let me summarize it for you.",
    "I've analyzed the relevant fields in your document. Here's what I found -- please let me know if you need more detail.",
    "The document mentions several key dates and contacts. Would you like me to list them for you?",
    "I understand your concern. Based on the document's classification, here are some recommendations I can offer.",
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}
