import React from 'react';
import { useAppStore } from '../store/useStore';

export default function SupabaseBadge() {
  const { isDbConnected } = useAppStore();

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
        isDbConnected
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
      }`}
      title={isDbConnected ? 'Conectado ao Supabase' : 'Modo offline — dados locais'}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'
        }`}
      />
      {isDbConnected ? 'Supabase' : 'Local'}
    </div>
  );
}
