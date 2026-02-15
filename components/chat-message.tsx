"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User, FileText, Leaf } from "lucide-react"

// ... (formatTime and formatFileSize helpers remain the same)
function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CategoryBadge({ category }: { category: "document" | "emotional" }) {
  const isDocument = category === "document"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isDocument
          ? "bg-primary/10 text-primary"
          : "bg-orange-100 text-orange-700"
      )}
    >
      {isDocument ? "Document Info" : "Well-being Check"}
    </span>
  )
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex items-start gap-3 px-4 py-2 w-full", isUser && "flex-row-reverse")}>
      <Avatar className={cn("h-8 w-8 shrink-0", isUser ? "bg-primary" : "bg-muted")}>
        <AvatarFallback className={cn(isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          {isUser ? <User className="h-4 w-4" /> : <Leaf className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[85%] flex-col gap-1 min-w-0", isUser && "items-end")}>
        {!isUser && message.category && <CategoryBadge category={message.category} />}
        
        {/* RESTORED: Attachment Icons Section */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {message.attachments.map((file) => (
              <div key={file.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-sm">
                <FileText className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium truncate max-w-[120px]">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words h-auto", 
              isUser
                ? "rounded-tr-md bg-primary text-primary-foreground"
                : "rounded-tl-md border border-border bg-card text-card-foreground shadow-sm"
            )}
          >
            {message.content}
          </div>
        )}
        <span className="px-1 text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  )
}