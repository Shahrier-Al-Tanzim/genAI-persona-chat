"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import PersonaSwitcher from "@/components/PersonaSwitcher"
import { personas, PersonaId } from "@/lib/personas"

export default function Home() {
  const [activePersona, setActivePersona] = useState<PersonaId>("hitesh");
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { messages, sendMessage, status } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync the active persona from any switchPersona tool calls or text hallucinations
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.role === 'assistant') {
      latestMessage.parts.forEach((part) => {
        // Native tool call parsing
        if (part.type === 'tool-switchPersona') {
          const inputArgs = (part as any).input;
          if (inputArgs?.personaId) {
            setActivePersona(inputArgs.personaId.toLowerCase() as PersonaId);
          }
        }
        
        // Fallback: Llama 3 8B sometimes hallucinates the tool call as raw text
        if (part.type === 'text') {
           const lowerText = part.text.toLowerCase();
           if (lowerText.includes('switchpersona') && lowerText.includes('piyush')) {
               setActivePersona("piyush");
           } else if (lowerText.includes('switchpersona') && lowerText.includes('hitesh')) {
               setActivePersona("hitesh");
           }
        }
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input }, { body: { personaId: activePersona } });
    setInput("");
  };

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <main className="flex h-screen bg-transparent font-sans selection:bg-blue-900 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-50/80 backdrop-blur-xl border-r border-slate-200 p-4 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <header className="mb-6 mt-2 px-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Mentor</h1>
          <p className="text-sm text-slate-600 mt-1">Select your mentor</p>
        </header>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <PersonaSwitcher
            activePersona={activePersona}
            onSwitch={(id) => {
              if (id !== activePersona) {
                // Send the message under the OLD persona's context so they trigger the switch tool call
                sendMessage(
                  { text: `Switch to ${personas[id].name}` }, 
                  { body: { personaId: activePersona } }
                );
                setActivePersona(id);
              }
              setIsSidebarOpen(false); // Close sidebar on mobile after selection
            }}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-white/10 backdrop-blur-sm">
        
        {/* Mobile Header (Hamburger) */}
        <div className="md:hidden flex items-center p-4 border-b border-slate-200 bg-white/40 backdrop-blur-md shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="text-slate-800 hover:text-slate-900 p-1.5 rounded-lg bg-white/50 border border-white/30 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="ml-4 font-bold text-slate-900 truncate">{personas[activePersona].name}</span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="bg-white/70 backdrop-blur-md border border-slate-200 p-8 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] max-w-md animate-bubble">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome to GenAI Persona</h2>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                    Pick your coding mentor from the sidebar, or simply type a request to get started. You can ask them to swap at any time!
                  </p>
                  <div className="text-xs text-slate-500 border-t border-slate-200/50 pt-4 font-semibold">
                    Powered by Groq LLaMA-3 & Vercel AI SDK
                  </div>
                </div>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {m.role === 'user' ? (
                     <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-none max-w-[85%] md:max-w-[75%] shadow-[0_8px_20px_rgba(37,99,235,0.2)] animate-bubble font-medium">
                       {m.parts.map((p, i) => p.type === 'text' ? <span key={i}>{p.text}</span> : null)}
                     </div>
                  ) : (
                    <div className="bg-white/80 backdrop-blur-md text-slate-900 border border-slate-200/80 px-5 py-3 rounded-2xl rounded-tl-none max-w-[90%] md:max-w-[85%] whitespace-pre-wrap shadow-[0_8px_30px_rgba(0,0,0,0.06)] animate-bubble font-medium">
                      {/* Render each part (text or tool call) */}
                      {m.parts.map((part, idx) => {
                        if (part.type === 'text') {
                          // Hide hallucinated tool calls from the chat UI
                          if (part.text.includes('switchPersona')) {
                             return (
                               <span key={idx} className="italic text-emerald-800 flex items-center gap-2 my-1 bg-emerald-50 border border-emerald-200/50 p-2 rounded-lg text-sm shadow-[0_4px_12px_rgba(16,185,129,0.08)] animate-bubble font-semibold">
                                 <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                 </svg>
                                 Switched persona
                               </span>
                             );
                          }
                          return <span key={idx}>{part.text}</span>;
                        }
                        if (part.type.startsWith('tool-')) {
                           const isDone = (part as any).state === 'output-available';
                           return (
                             <span 
                               key={idx} 
                               className={`italic flex items-center gap-2 my-1 p-2 rounded-lg text-sm border shadow-[0_4px_12px_rgba(0,0,0,0.03)] animate-bubble font-semibold ${
                                 isDone 
                                   ? 'bg-emerald-50 border-emerald-200/50 text-emerald-800' 
                                   : 'bg-white/80 border-white/60 text-slate-600'
                               }`}
                             >
                               {isDone ? (
                                 <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                 </svg>
                               ) : (
                                 <svg className="w-4 h-4 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                 </svg>
                               )}
                               {isDone ? 'Switched persona' : 'Switching persona...'}
                             </span>
                           );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white/80 backdrop-blur-md text-slate-700 border border-slate-200 px-5 py-3 rounded-2xl rounded-tl-none animate-pulse shadow-[0_8px_30px_rgba(0,0,0,0.05)] font-semibold">
                   Typing...
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-transparent shrink-0">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-3 bg-white/80 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus-within:ring-2 focus-within:ring-blue-400/40 focus-within:border-blue-400/80 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your mentor a question..."
                className="flex-1 bg-transparent text-slate-900 placeholder-slate-500 px-4 py-3 focus:outline-none font-medium"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-tr from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-blue-500/10"
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
