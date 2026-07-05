import { personas, PersonaId } from "@/lib/personas";
import Image from "next/image";

interface Props {
  activePersona: PersonaId;
  onSwitch: (id: PersonaId) => void;
}

export default function PersonaSwitcher({ activePersona, onSwitch }: Props) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {Object.values(personas).map((persona) => {
        const isActive = activePersona === persona.id;
        
        const hiteshTheme = "from-amber-100/90 to-orange-100/90 border-orange-300 text-orange-950 shadow-md shadow-orange-500/5";
        const piyushTheme = "from-blue-600/95 to-indigo-600/95 border-blue-400 text-white shadow-md shadow-indigo-500/15";
        const inactiveTheme = "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-primary)] hover:opacity-90";

        let activeStyle = "";
        if (isActive) {
          activeStyle = persona.id === "hitesh" ? hiteshTheme : piyushTheme;
        } else {
          activeStyle = inactiveTheme;
        }

        return (
          <button
            key={persona.id}
            onClick={() => onSwitch(persona.id)}
            className={`relative overflow-hidden w-full p-4 rounded-xl border-2 transition-all duration-300 ease-out flex items-center gap-4 text-left ${isActive ? 'bg-gradient-to-br shadow-lg scale-[1.02] ' + activeStyle : activeStyle}`}
          >
            {/* Avatar Profile Picture or Placeholder */}
            <div className={`relative w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl font-bold shadow-inner overflow-hidden ${isActive ? 'bg-white/20 text-current' : 'bg-[var(--avatar-bg)] text-[var(--avatar-text)]'}`}>
              {persona.avatarUrl ? (
                 <Image 
                   src={persona.avatarUrl} 
                   alt={persona.name} 
                   fill
                   className="object-cover"
                 />
              ) : (
                persona.name.charAt(0)
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-bold truncate ${isActive && persona.id === 'piyush' ? 'text-white' : ''}`}>
                {persona.name}
              </h3>
              <p className={`text-xs truncate ${isActive && persona.id === 'piyush' ? 'text-blue-200' : (isActive ? 'text-orange-700' : 'text-slate-500')}`}>
                {persona.id === 'hitesh' ? 'Calm & Experienced' : 'Fast & Action-Oriented'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}