"use client"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import PersonaSwitcher from "@/components/PersonaSwitcher"
import { PersonaId } from "@/lib/personas"

export default function Home() {
  const [activePersona, setActivePersona] = useState<PersonaId>("hitesh");

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      personaId: activePersona
    },
    // Intercept tool calls from the AI
    onToolCall({ toolCall }) {
      if (toolCall.toolName === 'switchPersona') {
        const newPersona = toolCall.args.personaId as PersonaId;
        setActivePersona(newPersona);
        // We return a simulated result so the AI knows the tool succeeded
        return "Successfully switched persona!";
      }
    }
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 font-sans selection:bg-blue-900">
      <div className="max-w-4xl mx-auto pt-10 flex flex-col h-[90vh]">
        
        {/* Header */}
        <header className="text-center mb-8 shrink-0">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight mb-4">
            AI Mentor Chat
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Experience coding mentorship simulated by AI. Choose your mentor below or just ask!
          </p>
        </header>

        {/* Persona Switcher */}
        <div className="shrink-0">
          <PersonaSwitcher
            activePersona={activePersona}
            onSwitch={setActivePersona}
          />
        </div>

        {/* Chat Interface */}
        <div className="flex-1 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                Start a conversation...
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {m.role === 'user' ? (
                     <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                       {m.content}
                     </div>
                  ) : (
                    <div className="bg-slate-800 text-slate-200 px-6 py-3 rounded-2xl rounded-tl-sm max-w-[80%] whitespace-pre-wrap">
                      {/* If it's a tool call, show a system message instead of blank text */}
                      {m.toolInvocations ? (
                        <span className="italic text-slate-400 flex items-center gap-2">
                          🔄 Switching persona...
                        </span>
                      ) : (
                        m.content
                      )}
                    </div>
                  )}
                </div>
              ))
            )}


            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-slate-800 text-slate-400 px-6 py-3 rounded-2xl rounded-tl-sm animate-pulse">
                   Typing...
                 </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-800/50 border-t border-slate-800 shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask your mentor a question or say 'Switch to Piyush'..."
                className="flex-1 bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition-colors"
              >
                Send
              </button>
            </form>
          </div>

        </div>
      </div>
    </main>
  )
}
