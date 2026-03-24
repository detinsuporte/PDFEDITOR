import Link from 'next/link';
import { Type, Split, FileArchive, RefreshCw, FileText, FileSpreadsheet, ScanText, Lock, Unlock, Stamp, Crown, ShieldCheck, FileCheck2 } from 'lucide-react';

export default function Dashboard() {
    const tools = [
        { name: "Juntar PDF", desc: "Mescle e junte PDFs na ordem que desejar.", icon: <RefreshCw className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/merge", premium: false },

        { name: "Assinatura Digital A1", desc: "Assine PDFs com certificado ICP-Brasil A1 (.pfx / .p12) — validade jurídica completa.", icon: <ShieldCheck className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/sign-a1", premium: true },
        { name: "Converter para PDF/A", desc: "Converta para PDF/A-2b (ISO 19005) — padrão exigido pelo PJe e arquivamento jurídico de longo prazo.", icon: <FileCheck2 className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/to-pdf-a", premium: false },
        { name: "Adicionar Texto", desc: "Adicione texto, números ou carimbos ao seu PDF.", icon: <Type className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/add-text", premium: false },
        { name: "Dividir PDF", desc: "Extraia páginas do seu PDF ou divida-o em vários arquivos.", icon: <Split className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/split", premium: false },
        { name: "Comprimir PDF", desc: "Reduza o tamanho do seu PDF preservando qualidade.", icon: <FileArchive className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/compress", premium: false },
        { name: "PDF para Word", desc: "Converta texto, tabelas e imagens para Word editável.", icon: <FileText className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/to-word", premium: false },
        { name: "PDF para Excel", desc: "Extraia tabelas e dados diretamente para planilhas do Excel.", icon: <FileSpreadsheet className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/to-excel", premium: false },
        { name: "Extrair Texto (OCR)", desc: "Transforme imagens em texto Word nativo via IA.", icon: <ScanText className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/ocr", premium: true },
        { name: "Marca D'Água Global", desc: "Aplica texto diagonal translúcido em todas as páginas.", icon: <Stamp className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/watermark", premium: true },
        { name: "Proteger PDF", desc: "Adicione criptografia AES-256 de Nível Militar.", icon: <Lock className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/protect", premium: true },
        { name: "Desbloquear PDF", desc: "Remova a segurança de arquivos PDF.", icon: <Unlock className="w-8 h-8 text-gray-400 group-hover:text-[#2980f2] transition-colors duration-500" />, href: "/unlock", premium: true }
    ];

    return (
        <div className="relative flex flex-col items-center pt-24 pb-20 px-4 min-h-screen bg-transparent dark:bg-transparent overflow-hidden">
            {/* Header Text */}
            <h2 className="text-4xl md:text-5xl lg:text-5xl font-sans font-extrabold text-slate-900 dark:text-white text-center mb-6 tracking-tight drop-shadow-sm z-10 transition-colors">
                Todas as ferramentas para PDF num só lugar
            </h2>
            <p className="text-slate-600 dark:text-gray-400 text-lg lg:text-xl text-center mb-20 max-w-3xl font-medium z-10 transition-colors">
                O seu incrível <strong className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#2980f2] via-[#60a5fa] to-[#2980f2] animate-gradient">Miriam Editor-PDF</strong>. Edite, converta e manipule documentos offline com foco e velocidade.
            </p>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1200px] w-full px-2 z-10">
                {tools.map((tool, idx) => (
                    <Link href={tool.href} key={idx} className="group relative overflow-hidden bg-white dark:bg-[#111827] p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 hover:border-[#2980f2]/50 dark:hover:border-[#2980f2]/50 transition-all duration-500 flex flex-col items-start hover:-translate-y-1">
                        
                        {/* Metallic Hover Shine Reflection */}
                        <div className="absolute top-0 -inset-full h-full w-[200%] z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent via-[#2980f2]/5 dark:via-[#2980f2]/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shine_1.5s_ease-in-out] pointer-events-none" />

                        <div className="relative z-10 flex w-full justify-between items-start mb-6">
                            {/* Icon container */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:bg-[#2980f2]/10 dark:group-hover:bg-[#2980f2]/20">
                                {tool.icon}
                            </div>

                            {/* Premium Badge */}
                            {tool.premium && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2980f2]/10 dark:bg-[#2980f2]/20">
                                    <Crown className="w-3.5 h-3.5 text-[#2980f2]" />
                                    <span className="text-[10px] font-bold tracking-widest text-[#2980f2] uppercase">Premium</span>
                                </div>
                            )}
                        </div>

                        <h3 className="relative z-10 text-xl font-sans font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#2980f2] dark:group-hover:text-[#60a5fa] transition-colors duration-500">
                            {tool.name}
                        </h3>
                        <p className="relative z-10 text-slate-500 dark:text-gray-400 text-sm font-medium leading-relaxed group-hover:text-slate-600 dark:group-hover:text-gray-300 transition-colors duration-500">
                            {tool.desc}
                        </p>
                    </Link>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shine {
                    100% { left: 125%; }
                }
                .animate-shine {
                    animation: shine 1.2s cubic-bezier(0.4, 0, 0.2, 1);
                    left: -125%;
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient {
                    background-size: 200% auto;
                    animation: gradient-x 3s linear infinite;
                }
            `}} />
        </div>
    );
}
