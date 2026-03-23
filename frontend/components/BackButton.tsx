"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <div className="w-full px-6 mb-2">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#2980f2] hover:bg-[#1a6fd4] active:scale-95 shadow-lg shadow-blue-500/30 transition-all duration-200 group"
        aria-label="Voltar às Ferramentas"
      >
        <ChevronLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
        Voltar às Ferramentas
      </button>
    </div>
  );
}
