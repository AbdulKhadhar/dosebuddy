---
title: I built a lazy medicine helper for Amma: paste the prescription once, never think about it again
published: false
tags: devchallenge, hf26challenge, python, opensource
---

*This is my submission for the Hacktoberfest Open-Source AI Challenge: Week 3 (Slow and Steady).*

## What I Built

My Amma takes multiple medicines daily for blood pressure, thyroid, and calcium supplements. Managing different timings and remembering whether morning pills were taken before or after breakfast was a constant source of stress and confusion.

DoseBuddy is a local app with one job: **make the person who manages the medicines do the least possible work.** You paste what the doctor said. Everything else is automatic:

- A big-print card with morning, afternoon and night compartments
- Warnings when timings clash (for example thyroid tablets with calcium)
- Spoken reminders in English, Hindi, and Malayalam
- A tap-to-tick checklist that shows what is left today
- A printable fridge card and a WhatsApp-ready summary

**The lazy payoff:** About 15 minutes of squinting at strips, reading tiny labels, and double-checking timings became a single paste into DoseBuddy that builds the complete schedule in under 3 seconds.

## Demo

*(Paste prescription text, instant compartment schedule, red warning clash indicators, audio reminder playback, and printable fridge summary)*

## Code

{% github AbdulKhadhar/dosebuddy %}

## How I Built It

The key decision: **the AI never makes a safety decision.**

1. **Reading:** a small open-weight model through Ollama turns messy notes into JSON. If Ollama is not running, a rule-based parser does the job, so the app always works.
2. **Safety:** a plain Python rule engine checks for clashes, duplicates and missing information. It has tests, and anyone can read it.
3. **Review:** the person sees the extracted list and can fix it before a plan is made, because a wrong extraction is the biggest real risk.
4. **Everything else** is the standard library: `http.server`, `sqlite3` and one HTML file. There is nothing to install, so a non-technical user can double-click a launcher.

The medicine groups live in a JSON file, so adding a drug does not need any code.

During initial tests with local SLMs, LLMs often hallucinated slight dosage timings or assumed empty fields. Switching to pure rule validation for all contraindication logic ensured 100% deterministic safety warnings regardless of model variations.

## Why Open Innovation Matters

- **Health data stays home.** Prescriptions and diagnoses never go to a server the family does not control.
- **It works offline** and keeps working if the internet or power is unreliable.
- **It costs nothing to run.** No subscription for someone who just needs to take the right tablet at the right time.
- **Swappable models.** I can change the model with one environment variable (`qwen2.5:1.5b-instruct`, `gemma2:2b`, etc.).
- **Auditable safety.** Because the safety rules are open code and not model output, a pharmacist or any contributor can read and improve them.

**Where closed would have been worse:** Sending sensitive family medical prescriptions to a paid proprietary cloud API introduces recurring billing, API quota failures, privacy leak risks, and breaks completely when the home Wi-Fi drops.

## What Amma said

"I don't have to keep opening the pouch to check if I missed the white tablet — the big green boxes and the Malayalam voice reminder make it so simple."

## Limits (honest)

DoseBuddy is not a doctor. Its interaction list is small and hand-written, the Hindi and Malayalam sentences are drafts, and reminders only speak while the page is open.

## Prize Categories

Best Use of Open Source AI, Slow and Steady (Local First & Privacy)

*Team: just me, @AbdulKhadhar.*
