"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { ChatMessage, type Message } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"

export interface Question {
  id: string
  text: string
  category: "document" | "emotional"
}

const QUESTIONS: Question[] = [
  // Engineering Fields
  { id: "vessel_name", text: "What is the vessel name?", category: "document" },
  { id: "watch_period", text: "Which watch period is this? (e.g., 08:00–12:00)", category: "document" },
  { id: "main_engine_rpm", text: "What was the main engine RPM?", category: "document" },
  { id: "main_engine_load_percent", text: "What was the engine load percentage?", category: "document" },
  { id: "alarms", text: "Were there any alarms or faults? If none, say 'none'.", category: "document" },
  { id: "actions_taken", text: "What actions were taken? If none, say 'none'.", category: "document" },
  // Emotional Well-being Fields
  { id: "emo-1", text: "What are three aspects of your health and well-being you want to improve?", category: "emotional" },
  { id: "emo-2", text: "I feel that my manager supports flexibility for my daily needs.", category: "emotional" },
  { id: "emo-3", text: "My company allows me to express my feelings and emotions without fear of punishment.", category: "emotional" },
]

interface QuestionFlowProps {
  documentName: string
  sessionId: string // Kept in props for compatibility, but unused
  onComplete: (answers: Record<string, string>, messages: Message[]) => void
}

export function QuestionFlow({ documentName, onComplete }: QuestionFlowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const totalQuestions = QUESTIONS.length
  const progress = Math.round((currentIndex / totalQuestions) * 100)
  const allDone = currentIndex >= totalQuestions

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Initial Boot Sequence
  useEffect(() => {
    let cancelled = false
    setMessages([])
    setIsTyping(true)

    const init = setTimeout(() => {
      if (cancelled) return
      const firstQ = QUESTIONS[0]
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: `Beginning Engineering Watch Log for "${documentName}".`,
          timestamp: new Date(),
        },
        {
          id: `q-${firstQ.id}`,
          role: "assistant",
          content: firstQ.text,
          timestamp: new Date(),
        }
      ])
      setIsTyping(false)
    }, 1000)

    return () => { cancelled = true; clearTimeout(init); }
  }, [documentName])

  const handleAnswer = useCallback(
    (answer: string) => {
      if (allDone || isTyping) return

      const currentQ = QUESTIONS[currentIndex]
      const userMsg: Message = { id: `a-${currentQ.id}-${Date.now()}`, role: "user", content: answer, timestamp: new Date() }
      
      const updatedAnswers = { ...answers, [currentQ.id]: answer }
      setAnswers(updatedAnswers)
      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      const nextIndex = currentIndex + 1

      // Artificial delay to simulate "processing" and transitions
      setTimeout(() => {
        if (nextIndex < totalQuestions) {
          const nextQ = QUESTIONS[nextIndex]
          const nextMsgs: Message[] = []

          // Transition: Moving from document to emotional
          if (currentQ.category === "document" && nextQ.category === "emotional") {
            nextMsgs.push({
              id: "transition-wellbeing",
              role: "assistant",
              content: "Thank you for those operational details. Now, I'd like to shift focus to your personal well-being and professional environment.",
              timestamp: new Date()
            })
          }

          nextMsgs.push({ id: `q-${nextQ.id}`, role: "assistant", content: nextQ.text, timestamp: new Date() })
          
          setMessages((prev) => [...prev, ...nextMsgs])
          setCurrentIndex(nextIndex)
          setIsTyping(false)
        } else {
          // Hard-coded neutral statement before final summary
          const neutralStatement: Message = {
            id: "neutral-statement",
            role: "assistant",
            content: "This concludes the reflection section. Your responses have been recorded as part of today's log.",
            timestamp: new Date()
          }

          // Final Summary Template
          const summaryContent = `
### Engineering Watch Log & Wellbeing Summary

**Vessel:** ${updatedAnswers.vessel_name || "N/A"}
**Watch Period:** ${updatedAnswers.watch_period || "N/A"}
**Main Engine RPM:** ${updatedAnswers.main_engine_rpm || "N/A"}
**Engine Load:** ${updatedAnswers.main_engine_load_percent || "0"}%
**Alarms/Faults:** ${updatedAnswers.alarms || "none"}
**Actions Taken:** ${updatedAnswers.actions_taken || "none"}
          `.trim()

          const finalSummaryMsg: Message = {
            id: "final-summary",
            role: "assistant",
            content: summaryContent,
            timestamp: new Date(),
          }

          const finalHistory = [...messages, userMsg, neutralStatement, finalSummaryMsg]
          setMessages(finalHistory)
          setCurrentIndex(nextIndex)
          setIsTyping(false)
          onComplete(updatedAnswers, finalHistory)
        }
      }, 800)
    },
    [currentIndex, allDone, isTyping, answers, totalQuestions, onComplete, messages]
  )

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {!allDone && (
        <div className="z-10 flex items-center gap-3 border-b border-border bg-card/50 px-4 py-2.5 backdrop-blur-md">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="shrink-0 font-mono text-xs font-medium text-muted-foreground">{currentIndex}/{totalQuestions}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto w-full">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 break-words">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isTyping && (
            <div className="flex w-full">
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

      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleAnswer} isLoading={isTyping} disabled={allDone} placeholder={allDone ? "Submission complete" : "Type your answer..."} />
        </div>
      </div>
    </div>
  )
}