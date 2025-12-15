import { useState } from "react";
import { CreditCard } from "lucide-react";

interface CardData {
  id: number;
  bank: string;
  number: string;
  name: string;
  gradient: string;
}

const cards: CardData[] = [
  {
    id: 1,
    bank: "Bancolombia",
    number: "912 362263 31",
    name: "Juan Manuel Torres",
    gradient: "from-orange-500 to-orange-700"
  },
  {
    id: 2,
    bank: "Banco Popular",
    number: "453 789123 45",
    name: "Juan Manuel Torres", 
    gradient: "from-blue-500 to-blue-700"
  },
  {
    id: 3,
    bank: "Nequi",
    number: "321 654987 12",
    name: "Juan Manuel Torres",
    gradient: "from-pink-500 to-purple-700"
  }
];

export function AccountBanner() {
  const [currentCard, setCurrentCard] = useState(0);
  
  const handleCardChange = (index: number) => {
    setCurrentCard(index);
  };

  const current = cards[currentCard];

  return (
    <div 
      className="relative rounded-2xl px-12 py-8 h-[270px] overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at top right, #139af5ff 0%, rgba(59, 130, 246, 0.3) 30%, transparent 60%),
          radial-gradient(circle at bottom left, #000000ff 0%, rgba(30, 30, 31, 0.3) 30%, transparent 60%),
          radial-gradient(circle at top left, #1a1a1bff 0%, rgba(23, 23, 24, 0.3) 30%, transparent 60%),
          #0f172a
        `
      }}
    >
      {/* Efecto de difuminado superior */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent"></div>
      
      {/* Contenido principal */}
      <div className="relative z-10 h-full flex justify-between items-center">
        
        {/* Tarjeta Bancaria - Lado izquierdo, centrada verticalmente */}
        <div className="relative flex-shrink-0 ml-4">
          {/* Tarjeta de fondo (simulando transparencia de otra tarjeta) */}
          <div className="absolute w-72 h-44 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg transform -rotate-6 translate-x-2 translate-y-2 border border-white/20"></div>
          
          <div 
            className={`relative w-72 h-44 bg-gradient-to-br ${current.gradient} rounded-2xl p-6 text-white shadow-2xl transform -rotate-12 hover:rotate-0 transition-transform duration-500 cursor-pointer border border-white/30`}
            onClick={() => handleCardChange((currentCard + 1) % cards.length)}
          >
            {/* Efecto de brillo en la tarjeta */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl"></div>
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <CreditCard className="h-6 w-6 text-white" />
                <div className="text-lg font-semibold text-right">{current.bank}</div>
              </div>
              <div>
                <div className="text-xl font-bold tracking-wider mb-2">{current.number}</div>
                <div className="text-sm opacity-90 text-right">{current.name}</div>
              </div>
            </div>
            
            {/* Chip de la tarjeta */}
            <div className="absolute top-12 left-5 w-6 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded opacity-80"></div>
          </div>
        </div>

        {/* Información de la cuenta - Lado derecho */}
        <div className="text-white text-right flex-1 flex flex-col justify-center items-end ml-8">
          <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm mb-4 flex items-center gap-2 hover:bg-white/30 transition-colors">
            + Nueva Cuenta
          </button>
          
          <h2 className="text-2xl font-bold mb-3">Cuenta Personal</h2>
          <div className="text-4xl font-bold mb-4">
            $ 200.000 <span className="text-xl opacity-80 font-normal">COP</span>
          </div>
          
          <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 hover:bg-white/30 transition-colors">
            + Nueva Transacción
          </button>
        </div>
      </div>

      {/* Efectos de fondo decorativos */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-white/10 to-transparent opacity-30 -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-white/5 to-transparent opacity-50 translate-y-32 -translate-x-32"></div>
    </div>
  );
}