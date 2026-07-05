# GenAI Persona Chat 🚀

**GenAI Persona Chat** is an interactive, generative AI chat interface that simulates real-world coding mentorship. Powered by **Next.js**, **Vercel AI SDK v7**, and **Groq's LLaMA-3.1-8b-instant** model, the application allows users to experience two very distinct teaching styles: **Hitesh Choudhary** (calm, concept-first, Hinglish, chai-themed explanations) and **Piyush Garg** (high-energy, production-grade, fast-paced, witty).

The system supports **dynamic, seamless persona switching** both manually via a ChatGPT-style sidebar and dynamically through natural chat prompts (e.g., *"Can I talk to Piyush instead?"*).

---

## 🛠️ Tech Stack & Key Features

* **Framework:** Next.js 16 (App Router & React Server Actions).
* **AI Integration:** Vercel AI SDK (v7) & `@ai-sdk/groq` for ultra-fast, streamed response generation.
* **Model:** LLaMA-3.1-8b-instant (via Groq API).
* **Styling:** Vanilla CSS & TailwindCSS with custom themes per persona.
* **Layout:** ChatGPT-style layout with a fixed sidebar on desktop, responsive drawer on mobile, and full-screen chat view.
* **State Synchronization:** Automatic scroll-to-bottom on streaming chunks, green tick marks on successful persona transitions, and instant selector updates.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed.

### 2. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```
*(Get your free API key at [console.groq.com](https://console.groq.com/))*

### 3. Installation
Install the project dependencies:
```bash
npm install
```

### 4. Run Locally
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start chatting.

### 5. Build for Production
To test TypeScript typing and optimize the build:
```bash
npm run build
npm start
```

---

## 🧠 System Design & Technical Implementation

### 1. Persona Data & Design

The persona styles are stored inside [personas.ts](file:///c:/CHAI%20CODE/genAI-persona-chat/src/lib/personas.ts):

* **Hitesh Choudhary:** 
  * *Style:* Warm, experienced, patient.
  * *Key Behaviors:* Always begins responses with *"Haanji"*. Explains concepts using Hinglish (*"samjha?"*, *"clear hai na?"*) and teaches coding fundamentals using **chai/tea brewing analogies**. Strongly discouraging being a "tutorial developer".
* **Piyush Garg:**
  * *Style:* Energetic, blunt, practical, witty.
  * *Key Behaviors:* Casually professional, sprinkles emojis (🚀 🔥), details "production-grade shortcuts" and system designs, writes code immediately, and makes minor spelling mistakes by choice to appear highly natural.

---

### 2. Prompt Engineering Strategy

To maintain high character fidelity on the relatively small **LLaMA-3.1-8b-instant** model, a multi-tier prompt engineering approach was used:

1. **System Prompt Locking:** Detailed system instructions are supplied to govern character behavior, teaching methods, and vocabularies.
2. **Context Guard Rails:** In [route.ts](file:///c:/CHAI%20CODE/genAI-persona-chat/src/app/api/chat/route.ts), we append a `CRITICAL INSTRUCTION` directly to the system prompt dynamically on every request:
   > *"You are currently active as {personaName}. You MUST adopt this persona entirely. If there are previous messages in the history where you acted as a different mentor, IGNORE THEM."*
   This prevents the LLM from getting stuck or sliding back into the previous mentor's style when scanning history.
3. **Tool Instruction Tuning:** The model is equipped with a `switchPersona` tool. To prevent the 8B model from hallucinating and typing out code strings, we tuned the tool descriptions strictly to focus on intent detection.

---

### 3. Context Management & Tool Calling Flow

The application manages state through a unified server-side tool calling and client-side listener flow:

```
[User clicks sidebar card / Types "Switch to Hitesh"]
                    │
                    ▼
[Sends message to backend under current active persona context]
                    │
                    ▼
[Backend LLM matches intent and calls "switchPersona" tool]
                    │
                    ▼
[Client detects tool call event -> Instantly snaps sidebar to new selector]
                    │
                    ▼
[Backend executes tool & passes results to model in loop (maxSteps: 5 / stopWhen)]
                    │
                    ▼
[New Persona takes over context -> streams greeting message to client]
```

* **Vercel AI SDK 7.x Loop (`stopWhen`):** Because we execute the tool on the server side, we use the `stopWhen: isStepCount(5)` parameter on `streamText`. This allows the SDK to execute the `switchPersona` tool and then immediately trigger a second round of generation to let the *new* persona introduce themselves in the **exact same stream** rather than failing or ending prematurely.
* **Transition Rendering:** 
  * During the switch, the client displays a loader and says `Switching persona...`.
  * Once the tool execution succeeds (`output-available` state), the UI dynamically swaps the loader for a green tick (`✓`) and displays `Switched persona` to visually confirm a clean state handoff.
* **Hallucination Fallback Interception:** LLaMA-3-8B occasionally leaks raw JSON strings (like `switchPersona("personaId": "piyush")`) directly as text instead of API tool calls. The frontend in `page.tsx` parses incoming text for these string signatures, quietly intercepts them, updates the selector, and replaces the raw JSON in the UI with the clean `Switched persona` checkmark bubble.

---

## 💬 Sample Conversations

### Hitesh Choudhary (Active)
> **User:** "How do APIs work?"
> **Hitesh:** *"Haanji, let's look at this. Think of an API like making chai. You are the customer, the kitchen is the server, and the waiter is the API. You tell the waiter what tea you want, they take the request to the kitchen, and bring back the hot cup of tea. Code represents the kitchen ingredients, samjha? Let's build a simple Fetch API request together, clear hai na?"*

### Piyush Garg (Active)
> **User:** "What is Docker?"
> **Piyush:** *"Docker? Bro, it's basically shipping containers but for code 📦. No more 'it works on my machine' excuses. We write a Dockerfile, package the code + node version + envs, and ship it. Let's make one right now and deploy to AWS ECS in production. Move fast, ship today! 🚀🔥"*

---

## ⚠️ Groq Free Tier Limitations & Workarounds

This project runs on Groq's free tier, which imposes specific constraints:

1. **Rate Limits (RPM/TPM/RPD):**
   * *Limitation:* The free tier allows limited Requests Per Minute (RPM) and Tokens Per Minute (TPM). Rapid clicks on the persona selector or spamming questions will throw `429 Too Many Requests` or rate limit warnings.
   * *Mitigation:* Ensure queries are meaningful. The input box disabled states during streaming help prevent double-submissions.
2. **Context Window & Memory:**
   * *Limitation:* Free tier models have smaller sliding context windows.
   * *Mitigation:* If rate limits are approached, refresh the page to clear the local React state and reset the conversation history.
3. **Small Model Function Calling Quirks:**
   * *Limitation:* The `llama-3.1-8b-instant` model does not always natively output valid JSON tool call blocks and often prints tool syntax as raw text.
   * *Mitigation:* We implemented regex/substring checking on the client side (`page.tsx`) to catch text leaks, hide the code, and trigger the state changes under the hood.
