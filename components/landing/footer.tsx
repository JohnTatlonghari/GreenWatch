import Link from "next/link"
import { Leaf } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            GreenWatch
          </span>
        </div>

        <div className="flex gap-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Link
            href="/greenwatch"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            GreenWatch
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} GreenWatch. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
