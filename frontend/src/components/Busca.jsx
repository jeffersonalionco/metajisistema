import { useState } from 'react';

export function Busca({ onBuscar, placeholder = 'Pesquisar...' }) {
  const [valor, setValor] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onBuscar(valor);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-2">
      <input
        type="text"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-4 py-3 sm:py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-base"
      />
      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-5 py-3 sm:py-2.5 font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-h-[48px] sm:min-h-0 touch-manipulation"
      >
        Pesquisar
      </button>
    </form>
  );
}
