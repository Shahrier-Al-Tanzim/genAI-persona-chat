"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import PersonaSwitcher from "@/components/PersonaSwitcher"
import { personas, PersonaId } from "@/lib/personas"

export default function Home() {
  const [activePersona, setActivePersona] = useState<PersonaId>("hitesh");
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Sync class name on document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

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
    <main className={`flex h-screen bg-transparent font-sans selection:bg-blue-900 overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-[var(--sidebar-bg)] backdrop-blur-xl border-r border-[var(--sidebar-border)] p-4 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <header className="mb-6 mt-2 px-2">
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">AI Mentor</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Select your mentor</p>
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

        {/* Theme Toggle Button */}
        <div className="mt-auto pt-4 border-t border-[var(--sidebar-border)]">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] hover:opacity-90 transition-all shadow-sm font-semibold text-sm cursor-pointer"
          >
            {theme === 'light' ? (
              <>
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.413 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.46 5.05L5.75 4.343a1 1 0 10-1.414 1.414l.707.707zM5 10a1 1 0 11-2 0 1 1 0 012 0zm.75 4.343a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707z"/>
                </svg>
                Light Theme
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
                Dark Theme
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 chat-container bg-[var(--chat-bg)]">
        
        {/* Mobile Header (Hamburger) */}
        <div className="md:hidden flex items-center p-4 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] backdrop-blur-md shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="text-[var(--text-primary)] hover:opacity-80 p-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="ml-4 font-bold text-[var(--text-primary)] truncate">{personas[activePersona].name}</span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] p-8 rounded-3xl shadow-[0_20px_40px_var(--shadow-color-heavy)] max-w-md animate-bubble">
                  <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Welcome to GenAI Persona</h2>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6 font-medium">
                    Pick your coding mentor from the sidebar, or simply type a request to get started. You can ask them to swap at any time!
                  </p>
                  <div className="text-xs text-[var(--text-muted)] border-t border-[var(--card-border)] pt-4 font-semibold">
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
                    <div className="bg-[var(--bubble-assistant-bg)] backdrop-blur-md text-[var(--text-primary)] border border-[var(--bubble-assistant-border)] px-5 py-3 rounded-2xl rounded-tl-none max-w-[90%] md:max-w-[85%] whitespace-pre-wrap shadow-[0_8px_30px_var(--shadow-color)] animate-bubble font-medium">
                      {/* Render each part (text or tool call) */}
                      {m.parts.map((part, idx) => {
                        if (part.type === 'text') {
                          // Hide hallucinated tool calls from the chat UI
                          if (part.text.includes('switchPersona')) {
                             return (
                               <span key={idx} className="italic text-emerald-600 dark:text-emerald-400 flex items-center gap-2 my-1 bg-emerald-500/10 border border-emerald-500/25 p-2 rounded-lg text-sm shadow-[0_4px_12px_var(--shadow-color)] animate-bubble font-semibold">
                                 <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
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
                               className={`italic flex items-center gap-2 my-1 p-2 rounded-lg text-sm border shadow-[0_4px_12px_var(--shadow-color)] animate-bubble font-semibold ${
                                 isDone 
                                   ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                                   : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-secondary)]'
                               }`}
                             >
                               {isDone ? (
                                 <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                 </svg>
                               ) : (
                                 <svg className="w-4 h-4 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                 <div className="bg-[var(--bubble-assistant-bg)] backdrop-blur-md text-[var(--text-secondary)] border border-[var(--bubble-assistant-border)] px-5 py-3 rounded-2xl rounded-tl-none animate-pulse shadow-[0_8px_30px_var(--shadow-color)] font-semibold">
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
            <form onSubmit={handleSubmit} className="flex gap-3 bg-[var(--input-bg)] backdrop-blur-md border border-[var(--input-border)] p-2 rounded-2xl shadow-[0_12px_30px_var(--shadow-color)] focus-within:ring-2 focus-within:ring-blue-400/40 focus-within:border-blue-400/80 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your mentor a question..."
                className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] px-4 py-3 focus:outline-none font-medium"
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
