"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Leaf } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <Avatar className="h-8 w-8 shrink-0 bg-muted">
        <AvatarFallback className="bg-muted text-muted-foreground">
          <Leaf className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-sm">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
        <span className="sr-only">Assistant is typing</span>
      </div>
    </div>
  )
}
