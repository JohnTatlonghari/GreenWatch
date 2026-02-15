# GreenWatch

AI-Powered Fatigue Risk Detection Intelligence

---

## Elevator Pitch

GreenWatch is an AI fatigue detection co-pilot that reduces human-error incidents in critical industries through real-time voice analysis.

---

## Problem

Fatigue is the most common safety risk in critical operations.

- Human error contributes to up to 80 – 90% of major industrial accidents  
- Shift workers in critical sectors average 50–80+ hours per week  
- 80% of maritime accidents involve human error  

Current systems rely on self-reporting and static hour logs.

---

## Solution

GreenWatch replaces reactive reporting with proactive AI detection.

Operators record a short end-of-day voice reflection.

Our system:

1. Converts speech to text using Faster-Whisper  
2. Extracts stress signals using a transformer-based emotion model (Wav2Vec2)  
3. Generates a dynamic burnout risk score  
4. Triggers alerts if predefined risk thresholds are exceeded  
5. Automatically formats structured work logs  

The system runs locally using PyTorch and ExecuTorch for privacy-first inference.

---

## Tech Stack

### AI / ML
- PyTorch  
- Hugging Face Transformers  
- Wav2Vec2 Speech Emotion Recognition  
- Faster-Whisper  
- ExecuTorch  

### Frontend
- Streamlit  

### Backend Logic
- Risk scoring engine  
- Alert workflow automation  

---

## GenAI Tools Used

- Hugging Face (pre-trained transformer models)  
- ChatGPT (technical debugging & architecture refinement)  
- Gemini (research & prompt experimentation)  
- Anthropic (prompt validation testing)  

Yes, we implemented a pre-trained transformer-based speech emotion recognition model and integrated it into a real-time inference pipeline.

---

## Target Industries

- Maritime
- Energy & Utilities
- Aviation
- Industrial Operations
- Healthcare

To make human sustainability the foundation of environmental sustainability.

---

## Team

- Giovanna Gomez — Strategy, Research & Presentation Lead
- Arman Daghbashyan — ML Implementation  
- Kataliya Sungkamee — Backend & Risk Logic  
- John Tatlonghari — UI & Integration  

---

## Demo

we need to insert a demo link !!!

---

## Domain 

greenwatch-ai.tech
