"use client"
import { useState, useCallback, useEffect } from "react"
import { GreenWatchHeader } from "@/components/greenwatch/greenwatch-header"
import { DocumentUpload } from "@/components/greenwatch/document-upload"
import { QuestionFlow } from "@/components/greenwatch/question-flow"
import { FreeChat } from "@/components/greenwatch/free-chat"
import { ChatInput } from "@/components/chat-input"

// Import the API functions
import { sessionStart, sessionHistory, SessionStartResponse, health } from "@/lib/api"

import type { Message } from "@/components/chat-message"

type Phase = "upload" | "questions" | "chat"

export function GreenWatchContainer() {
  const [phase, setPhase] = useState<Phase>("upload")
  const [documentName, setDocumentName] = useState<string | undefined>()
  const [sessionId, setSessionId] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [isInitializing, setIsInitializing] = useState(false)

  const [isBackendReady, setIsBackendReady] = useState<boolean>(false)
  const [healthError, setHealthError] = useState<string | null>(null)

  // 1. Implement the health check on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const status = await health() //
        
        if (status.ok && status.llm_loaded) {
          setIsBackendReady(true)
          console.log(`LLM Loaded: ${status.llm_model}`)
        } else if (!status.llm_loaded) {
          //setHealthError("Backend is running, but LLM is still loading...")
        }
      } catch (err) {
        //setHealthError("Cannot connect to the AI runner. Is it running on port 8080?")
        setIsBackendReady(false)
      }
    }

    checkHealth()
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    setIsInitializing(true)
    setDocumentName(file.name)

    try {
      // 1. Start the session via the Runner API
      const session: SessionStartResponse = await sessionStart()
      
      // 2. Store the session ID for subsequent message calls
      setSessionId(session.session_id)
      
      // 3. Move to the questions phase
      // Note: In a real app, you'd likely upload the file to a different 
      // endpoint, but here we initiate the conversation flow.
      setPhase("questions")
    } catch (error) {
      console.error("Failed to start session:", error)
      // Fallback or error handling
      setSessionId(`fallback-${Date.now()}`)
      setPhase("questions")
    } finally {
      setIsInitializing(false)
    }
  }, [])

  const handleQuestionsComplete = useCallback(
    async (_answers: Record<string, string>, messages: Message[]) => {
      // The session is already active in the backend. 
      // We update our local UI state to transition to the free chat phase.
      setChatMessages(messages)
      setPhase("chat")
    },
    []
  )

  const handleReset = useCallback(() => {
    setPhase("upload")
    setDocumentName(undefined)
    setSessionId("")
    setChatMessages([])
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      <GreenWatchHeader documentName={documentName} onReset={handleReset} />

      {/* 2. Use the health status to guide the user */}
      {phase === "upload" && (
        <>
          {healthError && (
            <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-gray-800 dark:text-red-400">
              {healthError}
            </div>
          )}
          
          <DocumentUpload 
            onUpload={handleUpload} 
          />
          
          <ChatInput
            onSend={() => {}}
            isLoading={false}
            disabled
            placeholder={
              (!isBackendReady && isInitializing)
                ? "Waiting for AI engine..." 
                : "Upload a document to begin..."
            }
          />
        </>
      )}

      {phase === "questions" && documentName && (
        <QuestionFlow
          documentName={documentName}
          sessionId={sessionId}
          onComplete={handleQuestionsComplete}
        />
      )}

      {phase === "chat" && (
        <FreeChat initialMessages={chatMessages} />
      )}
    </div>
  )
}