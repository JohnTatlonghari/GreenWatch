"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { ChatMessage, type Message } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { TypingIndicator } from "@/components/typing-indicator"

export interface Question {
  id: string
  text: string
  category: "document" | "emotional"
}

// Boilerplate questions -- replace document questions with actual extracted fields later
const QUESTIONS: Question[] = [
  // Document-related questions (boilerplate)
  {
    id: "doc-1",
    text: "What is the project name listed on the document?",
    category: "document",
  },
  {
    id: "doc-2",
    text: "Who is the primary contact or author of this document?",
    category: "document",
  },
  {
    id: "doc-3",
    text: "What is the submission or effective date?",
    category: "document",
  },
  {
    id: "doc-4",
    text: "What is the document classification or type?",
    category: "document",
  },
  // Emotional state questions
  {
    id: "emo-1",
    text: "How are you feeling about this submission?",
    category: "emotional",
  },
  {
    id: "emo-2",
    text: "On a scale of 1-5, how confident are you in the accuracy of this document?",
    category: "emotional",
  },
  {
    id: "emo-3",
    text: "Is there anything causing you concern about this process?",
    category: "emotional",
  },
]

interface QuestionFlowProps {
  documentName: string
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

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Push the first assistant question on mount
  useEffect(() => {
    // Reset ref on each mount so strict mode re-mount works
    let cancelled = false

    const greetingMsg: Message = {
      id: "greeting",
      role: "assistant",
      content: `I've received "${documentName}". I'll now ask you a few questions about the document and how you're feeling. 
      Remember: The questions do not reflect the actual document and this is for demo purposes only! Let's begin! 
      `,
      timestamp: new Date(),
    }

    setIsTyping(true)
    setMessages([])

    const t1 = setTimeout(() => {
      if (cancelled) return
      setMessages([greetingMsg])
      setIsTyping(false)
    }, 1000)

    const t2 = setTimeout(() => {
      if (cancelled) return
      setIsTyping(true)
    }, 1400)

    const t3 = setTimeout(() => {
      if (cancelled) return
      const q = QUESTIONS[0]
      const qMsg: Message = {
        id: `q-${q.id}`,
        role: "assistant",
        content: q.text,
        timestamp: new Date(),
        category: q.category,
      }
      setMessages((prev) => [...prev, qMsg])
      setIsTyping(false)
    }, 2200)

    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAnswer = useCallback(
    (answer: string) => {
      if (allDone || isTyping) return

      const currentQ = QUESTIONS[currentIndex]

      // Add user message
      const userMsg: Message = {
        id: `a-${currentQ.id}`,
        role: "user",
        content: answer,
        timestamp: new Date(),
      }

      const newAnswers = { ...answers, [currentQ.id]: answer }
      setAnswers(newAnswers)
      setMessages((prev) => [...prev, userMsg])

      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)

      // Show next question or completion
      setIsTyping(true)
      setTimeout(() => {
        if (nextIndex < totalQuestions) {
          const nextQ = QUESTIONS[nextIndex]
          const nextMsg: Message = {
            id: `q-${nextQ.id}`,
            role: "assistant",
            content: nextQ.text,
            timestamp: new Date(),
            category: nextQ.category,
          }
          setMessages((prev) => {
            const updated = [...prev, nextMsg]
            return updated
          })
          setIsTyping(false)
        } else {
          // Build a summary mapping each question to its answer
          const documentLines = QUESTIONS
            .filter((q) => q.category === "document")
            .map((q) => `- **${q.text}**\n  ${newAnswers[q.id] || "(no answer)"}`)
            .join("\n")

          const emotionalLines = QUESTIONS
            .filter((q) => q.category === "emotional")
            .map((q) => `- **${q.text}**\n  ${newAnswers[q.id] || "(no answer)"}`)
            .join("\n")

          const summaryContent =
            `Here's a summary of your responses:\n\n` +
            `Document Information:\n${documentLines}\n\n` +
            `Well-being Check:\n${emotionalLines}\n\n` +
            `If everything looks correct, feel free to continue chatting about your document.`

          const doneMsg: Message = {
            id: "complete",
            role: "assistant",
            content: summaryContent,
            timestamp: new Date(),
          }
          setMessages((prev) => {
            const updated = [...prev, doneMsg]
            onComplete(newAnswers, updated)
            return updated
          })
          setIsTyping(false)
        }
      }, 900)
    },
    [currentIndex, allDone, isTyping, answers, totalQuestions, onComplete]
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Progress bar */}
      {!allDone && (
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {currentIndex} / {totalQuestions}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl py-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleAnswer}
        isLoading={isTyping}
        disabled={allDone}
        placeholder={
          allDone ? "Questions complete!" : "Type your answer..."
        }
      />
    </div>
  )
}
