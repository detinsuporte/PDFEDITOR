"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function NavBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Só exibe em páginas internas (não na home "/")
  if (pathname === "/") return null;

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm text-white bg-[#2980f2] hover:bg-[#1a6fd4] active:scale-95 shadow-md shadow-blue-500/30 transition-all duration-200 group ml-6"
      aria-label="Voltar às Ferramentas"
    >
      <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
      Voltar às Ferramentas
    </button>
  );
}
