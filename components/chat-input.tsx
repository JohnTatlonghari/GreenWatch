"use client"

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowUp, Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  isLoading,
  disabled = false,
  placeholder = "Type your answer...",
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const hasContent = input.trim().length > 0

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading || disabled) return
    onSend(trimmed)
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }

  // Speech recognition
  // const startRecording = useCallback(() => {
  //   if (disabled) return
  //   const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  //   if (!SR) return

  //   const recognition = new SR()
  //   recognition.continuous = true
  //   recognition.interimResults = true
  //   recognition.lang = "en-US"

  //   let finalTranscript = ""

  //   recognition.onresult = (event: SpeechRecognitionEvent) => {
  //     let interim = ""
  //     for (let i = event.resultIndex; i < event.results.length; i++) {
  //       const transcript = event.results[i][0].transcript
  //       if (event.results[i].isFinal) {
  //         finalTranscript += transcript
  //       } else {
  //         interim += transcript
  //       }
  //     }
  //     setInput(() => finalTranscript + interim)
  //   }

  //   recognition.onerror = () => {
  //     setIsRecording(false)
  //     setRecordingTime(0)
  //     if (timerRef.current) clearInterval(timerRef.current)
  //   }

  //   recognition.onend = () => {
  //     setIsRecording(false)
  //     setRecordingTime(0)
  //     if (timerRef.current) clearInterval(timerRef.current)
  //   }

  //   recognitionRef.current = recognition
  //   recognition.start()
  //   setIsRecording(true)
  //   setRecordingTime(0)
  //   timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
  // }, [disabled])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    setRecordingTime(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // function toggleRecording() {
  //   if (isRecording) stopRecording()
  //   else startRecording()
  // }

  // function formatRecordingTime(seconds: number) {
  //   const m = Math.floor(seconds / 60)
  //   const s = seconds % 60
  //   return `${m}:${s.toString().padStart(2, "0")}`
  // }

  return (
    <TooltipProvider delayDuration={300}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "border-t border-border bg-card px-4 py-3 transition-opacity",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2">
            {/* Mic button */}
            <div className="flex shrink-0 items-center gap-1 pb-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className={cn(
                      "h-8 w-8 transition-colors",
                      isRecording
                        ? "text-destructive hover:text-destructive/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    //onClick={toggleRecording}
                    aria-label={
                      isRecording ? "Stop recording" : "Start voice input"
                    }
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isRecording ? "Stop recording" : "Voice input"}
                </TooltipContent>
              </Tooltip>

              {isRecording && (
                <span className="flex items-center gap-1.5 text-xs text-destructive">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                  {/*formatRecordingTime(recordingTime)*/}
                </span>
              )}
            </div>

            {/* Textarea */}
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder={
                  disabled
                    ? "Upload a document to begin..."
                    : isRecording
                      ? "Listening..."
                      : placeholder
                }
                disabled={disabled}
                rows={1}
                className="min-h-[44px] max-h-[160px] resize-none rounded-xl border-border bg-background pr-12 text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Chat message input"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!hasContent || isLoading || disabled}
                className={cn(
                  "absolute bottom-1.5 right-1.5 h-8 w-8 shrink-0 rounded-lg transition-all",
                  hasContent && !isLoading && !disabled
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground"
                )}
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            {"Press Enter to send, Shift+Enter for a new line"}
          </p>
        </div>
      </form>
    </TooltipProvider>
  )
}
