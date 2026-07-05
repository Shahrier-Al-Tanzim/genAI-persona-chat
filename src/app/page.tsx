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
    <main className="flex h-screen bg-slate-950 font-sans selection:bg-blue-900 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-950 border-r border-slate-900 p-4 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <header className="mb-6 mt-2 px-2">
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">AI Mentor</h1>
          <p className="text-sm text-slate-500 mt-1">Select your mentor</p>
        </header>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <PersonaSwitcher
            activePersona={activePersona}
            onSwitch={(id) => {
              setActivePersona(id);
              setIsSidebarOpen(false); // Close sidebar on mobile after selection
            }}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-slate-900">
        
        {/* Mobile Header (Hamburger) */}
        <div className="md:hidden flex items-center p-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="ml-4 font-bold text-white truncate">{personas[activePersona].name}</span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.length === 0 ? (
              <div className="h-[60vh] flex items-center justify-center text-slate-500">
                Start a conversation...
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {m.role === 'user' ? (
                     <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[75%] shadow-sm">
                       {m.parts.map((p, i) => p.type === 'text' ? <span key={i}>{p.text}</span> : null)}
                     </div>
                  ) : (
                    <div className="bg-slate-800 text-slate-200 px-5 py-3 rounded-2xl rounded-tl-sm max-w-[90%] md:max-w-[85%] whitespace-pre-wrap shadow-sm">
                      {/* Render each part (text or tool call) */}
                      {m.parts.map((part, idx) => {
                        if (part.type === 'text') {
                          return <span key={idx}>{part.text}</span>;
                        }
                        if (part.type.startsWith('tool-')) {
                           return (
                             <span key={idx} className="italic text-slate-400 flex items-center gap-2 my-1 bg-slate-900/50 p-2 rounded-lg text-sm border border-slate-700">
                               <svg className="w-4 h-4 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                               </svg>
                               Switching persona...
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
                 <div className="bg-slate-800 text-slate-400 px-5 py-3 rounded-2xl rounded-tl-sm animate-pulse shadow-sm">
                   Typing...
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your mentor a question..."
                className="flex-1 bg-slate-800 text-slate-100 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm"
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
