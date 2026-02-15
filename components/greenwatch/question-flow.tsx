"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { ChatMessage, type Message } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { sessionMessage } from "@/lib/api"

export interface Question {
  id: string
  text: string
  category: "document" | "emotional"
}

const QUESTIONS: Question[] = [
  { id: "doc-1", text: "Training Session ID:", category: "document" },
  { id: "doc-2", text: "Trainer's Name:", category: "document" },
  { id: "doc-3", text: "Key Topics Covered:", category: "document" },
  { id: "emo-1", text: "What are three aspects of your health and well-being you want to improve?", category: "emotional" },
  { id: "emo-2", text: "I feel that my manager supports flexibility for my daily needs.", category: "emotional" },
  { id: "emo-3", text: "My company allows me to express my feelings and emotions without fear of punishment.", category: "emotional" },
]

interface QuestionFlowProps {
  documentName: string
  sessionId: string
  onComplete: (answers: Record<string, string>, messages: Message[]) => void
}

export function QuestionFlow({ documentName, sessionId, onComplete }: QuestionFlowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const totalQuestions = QUESTIONS.length
  const progress = Math.round((currentIndex / totalQuestions) * 100)
  const allDone = currentIndex >= totalQuestions

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Initial Boot Sequence
  useEffect(() => {
    let cancelled = false
    setMessages([])
    setIsTyping(true)

    const timer = setTimeout(() => {
      if (cancelled) return
      const firstQ = QUESTIONS[0]
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: `I've received "${documentName}". Let's get started.`,
          timestamp: new Date(),
        },
        {
          id: `q-${firstQ.id}`,
          role: "assistant",
          content: firstQ.text,
          timestamp: new Date(),
          category: firstQ.category,
        }
      ])
      setIsTyping(false)
    }, 1500)

    return () => { cancelled = true; clearTimeout(timer); }
  }, [documentName])

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (allDone || isTyping) return

      const currentQ = QUESTIONS[currentIndex]
      const charLimit = 30

      // 1. Local Validation for Emotional Questions
      if (currentQ.category === "emotional" && answer.length < charLimit) {
        const userErrId = `err-u-${Date.now()}`
        setMessages((prev) => [...prev, { id: userErrId, role: "user", content: answer, timestamp: new Date() }])
        setIsTyping(true)
        
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            id: `err-a-${Date.now()}`,
            role: "assistant",
            content: `This reflection is a bit brief (${answer.length}/${charLimit} chars). Could you please share a bit more detail?`,
            timestamp: new Date(),
          }])
          setIsTyping(false)
        }, 800)
        return
      }

      // 2. Post User Message and Start Loading
      const userMsg: Message = { id: `a-${currentQ.id}-${Date.now()}`, role: "user", content: answer, timestamp: new Date() }
      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      try {
        // 3. API CALL: Send to backend and wait for LLM assistant_text
        const response = await sessionMessage(sessionId, answer)
        const feedbackText = response?.assistant_text || "Thank you for sharing that."

        // 4. Update Answers state
        const newAnswers = { ...answers, [currentQ.id]: answer }
        setAnswers(newAnswers)

        // 5. Display LLM Feedback
        setMessages((prev) => [...prev, {
          id: `feedback-${Date.now()}`,
          role: "assistant",
          content: feedbackText,
          timestamp: new Date(),
        }])

        const nextIndex = currentIndex + 1

        // 6. Sequence the Next Step
        setTimeout(() => {
          if (nextIndex < totalQuestions) {
            const nextQ = QUESTIONS[nextIndex]
            
            // Check for transition to Emotional category
            if (currentQ.category === "document" && nextQ.category === "emotional") {
              setMessages((prev) => [...prev, {
                id: "trans", 
                role: "assistant", 
                content: "That covers the basics. Now, let's move into some deeper reflections.", 
                timestamp: new Date() 
              }])
              
              setTimeout(() => {
                setMessages((prev) => [...prev, { id: `q-${nextQ.id}`, role: "assistant", content: nextQ.text, timestamp: new Date() }])
                setCurrentIndex(nextIndex)
                setIsTyping(false)
              }, 1200)
            } else {
              setMessages((prev) => [...prev, { id: `q-${nextQ.id}`, role: "assistant", content: nextQ.text, timestamp: new Date() }])
              setCurrentIndex(nextIndex)
              setIsTyping(false)
            }
          } else {
            // Completion
            setMessages((prev) => [...prev, {
              id: "summary",
              role: "assistant",
              content: "Thank you! I've successfully mapped all your responses to the form.",
              timestamp: new Date(),
            }])
            setCurrentIndex(nextIndex)
            setIsTyping(false)
            onComplete(newAnswers, messages)
          }
        }, 1000)

      } catch (error) {
        console.error("Failed to submit message:", error)
        setIsTyping(false)
        // Optionally add a "Retry" message here
      }
    },
    [currentIndex, allDone, isTyping, answers, totalQuestions, onComplete, messages, sessionId]
  )

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Progress Header */}
      {!allDone && (
        <div className="z-10 flex items-center gap-3 border-b border-border bg-card/50 px-4 py-3 backdrop-blur-md">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="shrink-0 font-mono text-xs font-medium text-muted-foreground">
            {currentIndex}/{totalQuestions}
          </span>
        </div>
      )}

      {/* Message Container: Set to flex-1 to grow vertically, w-full to fill width */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
          {messages.map((msg) => (
            <div key={msg.id} className="w-full break-words">
              <ChatMessage message={msg} />
            </div>
          ))}
          
          {/* Custom Typing Indicator for the LLM feedback phase */}
          {isTyping && (
            <div className="flex w-full animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-2xl bg-muted px-4 py-3 text-muted-foreground">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-2 w-full" />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput 
            onSend={handleAnswer} 
            isLoading={isTyping} 
            disabled={allDone} 
            placeholder={allDone ? "Form Submitted!" : "Type your response..."} 
          />
        </div>
      </div>
    </div>
  )
}