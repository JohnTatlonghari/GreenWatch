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

  // FIX: Consolidated single useEffect to prevent double-triggering
  useEffect(() => {
    let cancelled = false
    setMessages([])
    setIsTyping(true)

    const t1 = setTimeout(() => {
      if (cancelled) return
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: `I've received "${documentName}". I'll now ask you a few questions.`,
        timestamp: new Date(),
      }])
      setIsTyping(false)
    }, 1000)

    const t2 = setTimeout(() => {
      if (cancelled) return
      setIsTyping(true)
    }, 1800)

    const t3 = setTimeout(() => {
      if (cancelled) return
      const q = QUESTIONS[0]
      setMessages((prev) => [...prev, {
        id: `q-${q.id}`,
        role: "assistant",
        content: q.text,
        timestamp: new Date(),
        category: q.category,
      }])
      setIsTyping(false)
    }, 2800)

    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }
  }, [documentName])

  const handleAnswer = useCallback(
    (answer: string) => {
      if (allDone || isTyping) return

      const currentQ = QUESTIONS[currentIndex]
      
      // NEW: Minimum character limit logic for emotional questions
      const charLimit = 100
      if (currentQ.category === "emotional" && answer.length < charLimit) {
        const userMsg: Message = { id: `err-u-${Date.now()}`, role: "user", content: answer, timestamp: new Date() }
        setMessages((prev) => [...prev, userMsg])
        setIsTyping(true)
        
        setTimeout(() => {
          const errorMsg: Message = {
            id: `err-a-${Date.now()}`,
            role: "assistant",
            content: `This reflection is a bit brief (${answer.length}/${charLimit} chars). To ensure we capture your true thoughts, please provide a more detailed response.`,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, errorMsg])
          setIsTyping(false)
        }, 800)
        return
      }

      const userMsg: Message = { id: `a-${currentQ.id}`, role: "user", content: answer, timestamp: new Date() }
      const newAnswers = { ...answers, [currentQ.id]: answer }
      setAnswers(newAnswers)
      setMessages((prev) => [...prev, userMsg])

      const nextIndex = currentIndex + 1
      setIsTyping(true)

      setTimeout(() => {
        // Transition: Moving from document to emotional
        if (nextIndex < totalQuestions && currentQ.category === "document" && QUESTIONS[nextIndex].category === "emotional") {
          setMessages((prev) => [...prev, {
            id: "trans", role: "assistant", content: "Thank you. Now, let's move into some deeper emotional reflections.", timestamp: new Date()
          }])
          setTimeout(() => {
            const nextQ = QUESTIONS[nextIndex]
            setMessages((prev) => [...prev, { id: `q-${nextQ.id}`, role: "assistant", content: nextQ.text, timestamp: new Date() }])
            setCurrentIndex(nextIndex)
            setIsTyping(false)
          }, 1500)
          return
        }

        if (nextIndex < totalQuestions) {
          const nextQ = QUESTIONS[nextIndex]
          setMessages((prev) => [...prev, { id: `q-${nextQ.id}`, role: "assistant", content: nextQ.text, timestamp: new Date() }])
          setCurrentIndex(nextIndex)
          setIsTyping(false)
        } else {
          // Final Completion: Display Field Mapping
          const summaryMsg: Message = {
            id: "summary",
            role: "assistant",
            content: "Form complete! Here is how your data was mapped:",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, summaryMsg])
          setCurrentIndex(nextIndex)
          setIsTyping(false)
          onComplete(newAnswers, messages)
        }
      }, 900)
    },
    [currentIndex, allDone, isTyping, answers, totalQuestions, onComplete, messages]
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {!allDone && (
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="shrink-0 text-xs font-medium text-muted-foreground">{currentIndex} / {totalQuestions}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl py-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput onSend={handleAnswer} isLoading={isTyping} disabled={allDone} placeholder={allDone ? "Form Submitted!" : "Type your answer..."} />
    </div>
  )
}