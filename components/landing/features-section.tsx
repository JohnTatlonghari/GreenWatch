import { FileUp, MessageSquareText, HeartPulse } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

const features = [
  {
    icon: FileUp,
    title: "Document Upload & Analysis",
    description:
      "Upload your PDF documentation forms and let our AI extract the key fields and structure automatically.",
  },
  {
    icon: MessageSquareText,
    title: "Guided Questionnaire",
    description:
      "Answer targeted questions about your document to ensure accuracy and completeness before submission.",
  },
  {
    icon: HeartPulse,
    title: "Emotional Check-ins",
    description:
      "We check in on how you're feeling throughout the process to ensure a supportive, stress-free experience.",
  },
]

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pb-32"
    >
      <div className="mb-12 text-center">
        <h2 className="text-balance text-2xl font-bold text-foreground md:text-3xl">
          How It Works
        </h2>
        <p className="mt-3 text-muted-foreground">
          Three simple steps to smarter document handling
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription className="leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
