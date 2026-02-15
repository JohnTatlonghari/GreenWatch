"use client"

import Link from "next/link"
import { Leaf, ArrowLeft, RotateCcw, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface GreenWatchHeaderProps {
  documentName?: string
  onReset: () => void
}

export function GreenWatchHeader({
  documentName,
  onReset,
}: GreenWatchHeaderProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href="/" aria-label="Back to home">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to Home</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight text-foreground">
                GreenWatch Assistant
              </span>
              <span className="text-xs text-muted-foreground">
                {documentName ? "Analyzing your document" : "Ready to help"}
              </span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {documentName && (
            <div className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 sm:flex">
              <FileText className="h-3 w-3 text-primary" />
              <span className="max-w-[140px] truncate text-xs font-medium text-foreground">
                {documentName}
              </span>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onReset}
                aria-label="Reset session"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Start over</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}
