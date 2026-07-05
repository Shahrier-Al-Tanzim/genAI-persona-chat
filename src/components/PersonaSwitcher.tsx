import { personas, PersonaId } from "@/lib/personas";

interface Props {
  activePersona: PersonaId;
  onSwitch: (id: PersonaId) => void;
}

export default function PersonaSwitcher({ activePersona, onSwitch }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-3xl mx-auto mb-8">
      {Object.values(personas).map((persona) => {
        const isActive = activePersona === persona.id;
        
        // Define distinct premium themes for each persona
        const hiteshTheme = "from-amber-100 to-orange-100 border-orange-300 text-orange-900";
        const piyushTheme = "from-slate-800 to-slate-900 border-blue-500 text-blue-400";
        const inactiveTheme = "bg-white/50 border-gray-200 hover:border-gray-300 text-gray-500";

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
            className={`relative overflow-hidden flex-1 p-6 rounded-2xl border-2 transition-all duration-300 ease-out shadow-sm ${isActive ? 'scale-105 shadow-xl bg-gradient-to-br ring-4 ring-opacity-20 ' + activeStyle : 'scale-100 hover:scale-[1.02] ' + activeStyle}`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              {/* Avatar Placeholder */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                {persona.name.charAt(0)}
              </div>
              
              <h3 className={`text-lg font-bold ${isActive && persona.id === 'piyush' ? 'text-white' : ''}`}>
                {persona.name}
              </h3>
              <p className={`text-sm ${isActive && persona.id === 'piyush' ? 'text-gray-300' : 'text-gray-600'}`}>
                {persona.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}