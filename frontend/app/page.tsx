import Link from 'next/link';
import { Type, Split, FileArchive, Settings, RefreshCw, FileText } from 'lucide-react';

export default function Dashboard() {
    const tools = [
        { name: "Juntar PDF", desc: "Mescle e junte PDFs e coloque-os na ordem que desejar.", icon: <RefreshCw className="w-10 h-10 text-pdfred" />, href: "/merge" },
        { name: "Adicionar Texto", desc: "Adicione texto, números ou carimbos ao seu PDF.", icon: <Type className="w-10 h-10 text-pdfred" />, href: "/add-text" },
        { name: "Dividir PDF", desc: "Extraia páginas do seu PDF ou divida-o em vários arquivos.", icon: <Split className="w-10 h-10 text-pdfred" />, href: "/split" },
        { name: "Comprimir PDF", desc: "Reduza o tamanho do seu PDF preservando qualidade.", icon: <FileArchive className="w-10 h-10 text-pdfred" />, href: "/compress" },
        { name: "PDF para Word", desc: "Converta texto, tabelas e imagens para Word editável.", icon: <FileText className="w-10 h-10 text-pdfred" />, href: "/to-word" },
    ];

    return (
        <div className="flex flex-col items-center pt-24 pb-16 px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 text-center mb-6 tracking-tight">
                Todas as ferramentas para PDF num só lugar
            </h2>
            <p className="text-[#33333B] dark:text-gray-300 text-lg lg:text-xl text-center mb-16 max-w-2xl font-light">
                O seu incrível <strong className="font-bold text-pdfred dark:text-red-500">Miriam Editor-PDF</strong>. Edite, converta e manipule documentos offline de forma segura e elegante.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full px-4">
                {tools.map((tool, idx) => (
                    <Link href={tool.href} key={idx} className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:border-red-900 transition-all group flex flex-col items-start hover:-translate-y-1">
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">{tool.icon}</div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 group-hover:text-pdfred dark:group-hover:text-red-400 transition-colors">{tool.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{tool.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
