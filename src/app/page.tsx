"use client"

import { useState } from "react"
import PersonaSwitcher from "@/components/PersonaSwitcher"
import { PersonaId } from "@/lib/personas"

export default function Home() {

  const [activePersona, setActivePersona] = useState<PersonaId>("hitesh");

  return (
    <main className="min-h-screen bg-slate-950 p-6 font-sans selection:bg-blue-900">
      <div className="max-w-4xl mx-auto pt-10">
        {/*Header*/}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight mb-4">
            AI Mentor Chat
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Experience coding mentorship simulated by AI. Choose your mentor below and start learning.
          </p>
        </header>

        {/*Persona Switcher */}
        <PersonaSwitcher
          activePersona={activePersona}
          onSwitch={setActivePersona}
        />

        {/* Chat Placeholder (We will build this in Module 5!) */}
        <div className="w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8 min-h-[500px] flex items-center justify-center">
          <p className="text-slate-500 font-medium">
            Chat Interface loading in Module 5...
          </p>
        </div>

      </div>
    </main>
  )
}