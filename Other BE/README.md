# GreenWatch
Here's the full file structure, grouped by purpose:

---

### App (Pages & Layout)

| File | Purpose
|-----|-----
| `app/layout.tsx` | Root layout. Sets up the Inter font, HTML wrapper, and metadata (title: "GreenWatch", theme color).
| `app/globals.css` | Global CSS with Tailwind directives and all design tokens (green/teal palette for light & dark mode).
| `app/page.tsx` | **About / Landing page** (`/`). Composes the Navbar, HeroSection, FeaturesSection, and Footer.
| `app/greenwatch/page.tsx` | **GreenWatch chatbot page** (`/greenwatch`). Renders the `GreenwatchContainer`.


### Landing Page Components (`components/landing/`)

| File | Purpose
|-----|-----
| `navbar.tsx` | Top navigation bar with the GreenWatch brand logo, nav links, and a CTA button linking to `/greenwatch`.
| `hero-section.tsx` | Hero banner with headline, subtitle, and a primary call-to-action button.
| `features-section.tsx` | Three feature cards explaining the app workflow (Upload, Answer Questions, Get Insights).
| `footer.tsx` | Simple site footer with copyright and nav links.


### GreenWatch Chatbot Components (`components/greenwatch/`)

| File | Purpose
|-----|-----
| `greenwatch-container.tsx` | **Orchestrator** for the chatbot page. Manages the three-phase state machine: upload -> questions -> free chat.
| `greenwatch-header.tsx` | Header bar for the chatbot page showing brand, current phase indicator (upload/questions/chat), and a back-to-home link.
| `document-upload.tsx` | **Phase 1 -- Upload gate.** Drag-and-drop or browse file picker for PDFs. Blocks all other input until a document is uploaded. Calls `api.uploadDocument()`.
| `question-flow.tsx` | **Phase 2 -- Guided questionnaire.** Presents document-related and emotional-state questions one at a time with a progress bar. Calls `api.submitAnswer()`.
| `free-chat.tsx` | **Phase 3 -- Free chat.** Unrestricted chat with the assistant using text input and microphone. Calls `api.sendMessage()`.


### Shared Chat Components (`components/`)

| File | Purpose
|-----|-----
| `chat-input.tsx` | Reusable textarea input with microphone (Web Speech API) support and a send button. Accepts a `disabled` prop for the upload gate.
| `chat-message.tsx` | Renders a single chat bubble (user or assistant). Supports PDF attachment chips and a category badge (Document / Emotional).
| `typing-indicator.tsx` | Animated three-dot bounce indicator shown while the bot is "thinking".


### Backend / Services

| File | Purpose
|-----|-----
| `lib/api.ts` | **Boilerplate backend service.** Contains typed async mock functions (`uploadDocument`, `submitAnswer`, `sendMessage`) with `TODO` comments for wiring to a real API.
| `lib/utils.ts` | Utility helpers -- includes the `cn()` function for conditionally joining Tailwind class names.


### Types

| File | Purpose
|-----|-----
| `types/speech-recognition.d.ts` | TypeScript declarations for the Web Speech API (`SpeechRecognition`, `webkitSpeechRecognition`) so the browser mic features compile without errors.


### Config

| File | Purpose
|-----|-----
| `package.json` | Project dependencies and scripts (Next.js, React, shadcn/ui, Tailwind, Lucide icons, etc.).
| `tsconfig.json` | TypeScript configuration with path aliases (`@/` -> project root).
| `tailwind.config.ts` | Tailwind CSS config extending the default theme with design tokens and font families.
| `next.config.mjs` | Next.js configuration.
| `postcss.config.mjs` | PostCSS config for Tailwind processing.
| `components.json` | shadcn/ui configuration (component paths, style, aliases).


### UI Primitives (`components/ui/`)

These are the **shadcn/ui component library** -- pre-built, styled primitives. The ones actively used by the app include `avatar`, `badge`, `button`, `card`, `progress`, `scroll-area`, `separator`, `textarea`, and `tooltip`. The rest (accordion, dialog, tabs, etc.) are available for future use.

### Hooks

| File | Purpose
|-----|-----
| `hooks/use-mobile.tsx` | Hook that detects mobile viewport width.
| `hooks/use-toast.ts` | Toast notification state management hook.


---

The data flow is: Landing page (`/`) introduces the product and links to `/greenwatch`, where the `GreenwatchContainer` orchestrates three sequential phases -- document upload, guided questions, and free chat -- all backed by mock functions in `lib/api.ts` that are ready to be replaced with real endpoints.