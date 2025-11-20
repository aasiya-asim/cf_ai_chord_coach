# 🎹 Chord Coach (cf_ai_chord_coach)

An AI-powered music learning app built on Cloudflare Workers AI. This is inspired from an iOS app that I developed in high school to help teach my fellow Music students. This time, I am building something similar on a Cloudflare hosted web app, except that this uses an LLM to come up with a new challenge for students to learn and practice. This is a bare bones version. 
In the future I hope to just like my first app, make learning this easier from first principles rather than just a Q&A format. I also hope to make this personalized based not just on the last lesson that was presented to you, but to then taper the lessons in order of difficulty similar to the way Khan Academy structures an SAT prep test.

## 🌩 Overview
Chord Coach helps users learn and practice chord spelling interactively.
Each session:
1. Generates a new chord challenge using **Llama 3.3 70B Instruct** on Workers AI.
2. Stores your last challenge in **Cloudflare KV** to maintain memory.
3. Streams real-time chord explanations with **Server-Sent Events**.
4. Serves a simple web interface built with **Cloudflare Pages**.

## ⚙️ Cloudflare components used
- **Workers AI:** Llama 3.3 70B for generating and explaining chords.
- **Workers:** For workflow orchestration (`/api/challenge`, `/api/submit`, `/api/challenge-stream`).
- **Pages (static assets):** For the front-end interface.
- **KV:** To persist user memory (last practiced chord).

The app itself is available on 

https://cf_ai_chord_coach.puffadolphin.workers.dev/