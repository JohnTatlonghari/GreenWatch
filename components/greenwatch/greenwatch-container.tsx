"use client"

import { useState, useCallback } from "react"
import { GreenWatchHeader } from "@/components/greenwatch/greenwatch-header"
import { DocumentUpload } from "@/components/greenwatch/document-upload"
import { QuestionFlow } from "@/components/greenwatch/question-flow"
import { FreeChat } from "@/components/greenwatch/free-chat"
import { ChatInput } from "@/components/chat-input"
import { uploadDocument } from "@/lib/api"
import type { Message } from "@/components/chat-message"

type Phase = "upload" | "questions" | "chat"

export function GreenWatchContainer() {
  const [phase, setPhase] = useState<Phase>("upload")
  const [documentName, setDocumentName] = useState<string | undefined>()
  const [documentId, setDocumentId] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<Message[]>([])

  const handleUpload = useCallback(async (file: File) => {
    console.log("[v0] handleUpload called with file:", file.name)
    setDocumentName(file.name)

    // Call the boilerplate backend upload
    try {
      const result = await uploadDocument(file)
      console.log("[v0] Upload result:", result)
      setDocumentId(result.documentId)
    } catch {
      // Fallback ID in case the mock fails
      setDocumentId(`doc-${Date.now()}`)
    }

    console.log("[v0] Setting phase to questions")
    setPhase("questions")
  }, [])

  const handleQuestionsComplete = useCallback(
    (_answers: Record<string, string>, messages: Message[]) => {
      // TODO: Send answers to backend via submitAnswers()
      setChatMessages(messages)
      setPhase("chat")
    },
    []
  )

  const handleReset = useCallback(() => {
    setPhase("upload")
    setDocumentName(undefined)
    setDocumentId("")
    setChatMessages([])
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      <GreenWatchHeader documentName={documentName} onReset={handleReset} />

      {phase === "upload" && (
        <>
          <DocumentUpload onUpload={handleUpload} />
          {/* Disabled input shown at bottom so the user sees the full chat UI */}
          <ChatInput
            onSend={() => {}}
            isLoading={false}
            disabled
            placeholder="Upload a document to begin..."
          />
        </>
      )}

      {phase === "questions" && documentName && (
        <QuestionFlow
          documentName={documentName}
          onComplete={handleQuestionsComplete}
        />
      )}

      {phase === "chat" && (
        <FreeChat documentId={documentId} initialMessages={chatMessages} />
      )}
    </div>
  )
}
