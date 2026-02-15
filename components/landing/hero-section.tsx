import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function HeroSection() {
  return (
    <section className="flex flex-col items-center px-6 pb-20 pt-24 text-center md:pb-32 md:pt-36">
      <Badge
        variant="secondary"
        className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium"
      >
        AI-Powered Document Analysis
      </Badge>

      <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl md:leading-tight">
        Smarter Document Analysis, Powered by AI
      </h1>

      <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
        Upload your documents, answer guided questions, and let GreenWatch
        analyze everything for you. Simple, fast, and intelligent.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="gap-2 px-8">
          <Link href="/greenwatch">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="px-8">
          <Link href="#features">Learn More</Link>
        </Button>
      </div>
    </section>
  )
}
