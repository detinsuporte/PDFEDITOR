import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyBadge() {
    return (
        <div className="w-full flex justify-center pt-8 pb-4 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-start gap-4 max-w-2xl bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="bg-gray-200 dark:bg-[#252525] p-2 rounded-xl shrink-0 mt-0.5">
                    <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed tracking-wide">
                    <strong className="text-gray-900 dark:text-gray-200 uppercase tracking-widest text-[11px] block mb-0.5">Selo de Privacidade: Segurança de Nível Bancário</strong>
                    Seus documentos são criptografados na transmissão e auto-destruídos de nossos servidores em até 30 minutos.
                </p>
            </div>
        </div>
    );
}
