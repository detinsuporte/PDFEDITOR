"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle, Loader2, Download, Stamp } from "lucide-react";
import axios from "axios";
import PrivacyBadge from "../components/PrivacyBadge";

export default function WatermarkPDF() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState("CONFIDENCIAL");
    const [color, setColor] = useState("#FF0000");
    const [opacity, setOpacity] = useState(30);
    const [fontSize, setFontSize] = useState(80);
    
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus("idle");
        }
    };

    const handleProcess = async () => {
        if (!file || !text) return;
        setStatus("uploading");
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("text", text);
        formData.append("color", color);
        formData.append("opacity", (opacity / 100).toString());
        formData.append("fontSize", fontSize.toString());

        try {
            const response = await axios.post("http://localhost:8000/api/pdf/watermark", formData, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            setDownloadUrl(url);
            setStatus("success");
        } catch (error) {
            setStatus("error");
        }
    };

    const handleReset = () => {
        setFile(null); setStatus("idle"); setDownloadUrl(null);
    };

    return (
        <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#121212] flex flex-col pt-24 pb-12 px-4 items-center font-sans tracking-tight transition-colors">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 mb-3 flex items-center gap-3">
                <Stamp className="w-10 h-10 text-orange-500" /> Marca D'Água Global
            </h1>
            <p className="text-lg text-[#33333B] dark:text-gray-300 font-light mb-10 text-center max-w-2xl text-opacity-80">
                Aplica um carimbo transversal em todas as páginas do documento.
            </p>

            {!file ? (
                <div className="flex flex-col items-center w-full">
                    <div onClick={() => document.getElementById("fileInput")?.click()} className="w-full max-w-4xl h-[320px] bg-white dark:bg-[#1e1e1e] border-4 border-dashed border-orange-200 dark:border-orange-900/40 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all rounded-[30px] flex flex-col items-center justify-center cursor-pointer shadow-sm group">
                        <UploadCloud className="w-24 h-24 text-orange-300 dark:text-gray-500 group-hover:scale-110 group-hover:text-orange-500 transition-transform mb-6" />
                        <button className="bg-orange-600 tracking-wide hover:bg-orange-700 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-transform transform hover:scale-105 pointer-events-none">
                            Selecione o PDF
                        </button>
                        <input type="file" id="fileInput" accept="application/pdf" className="hidden" onChange={onFileChange} />
                    </div>
                    <PrivacyBadge />
                </div>
            ) : status === "idle" || status === "error" ? (
                <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl items-start justify-center animate-in fade-in zoom-in-95">
                    {/* Painel de Controle Lateral */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-[30px] shadow-2xl border border-gray-100 dark:border-gray-800 w-full lg:w-1/3 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                            <Stamp className="w-6 h-6 text-orange-500" /> Configurar Carimbo
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Texto da Marca</label>
                                <input 
                                    type="text" 
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Ex: CONFIDENCIAL"
                                    className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121212] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cor da Tinta</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-12 h-12 rounded cursor-pointer border-0 bg-transparent"
                                    />
                                    <span className="text-gray-600 dark:text-gray-400 font-mono text-sm">{color.toUpperCase()}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                                    <span>Opacidade</span>
                                    <span>{opacity}%</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="5" max="100" 
                                    value={opacity}
                                    onChange={(e) => setOpacity(Number(e.target.value))}
                                    className="w-full accent-orange-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">Garante que o fundo continue legível.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                                    <span>Tamanho da Fonte</span>
                                    <span>{fontSize}pt</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="20" max="150" 
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full accent-orange-500"
                                />
                            </div>
                        </div>

                        <button onClick={handleProcess} className="w-full mt-8 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-transform transform hover:-translate-y-1">
                            Aplicar Marca de Água
                        </button>
                        <button onClick={handleReset} className="w-full py-3 mt-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-bold transition">
                            Cancelar
                        </button>
                    </div>

                    {/* Visor de Resumo */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-10 rounded-[30px] shadow-2xl border border-gray-100 dark:border-gray-800 w-full lg:w-2/3 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
                            <Stamp className="w-10 h-10 text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 truncate max-w-full" title={file.name}>{file.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm uppercase tracking-widest font-bold">Resumo do Arquivo</p>
                        
                        {status === "error" && (
                            <div className="text-red-500 w-full p-4 bg-red-50 dark:bg-red-900/20 rounded-xl font-medium">Houve um erro no servidor ao processar o Documento.</div>
                        )}
                    </div>
                </div>
            ) : status === "uploading" ? (
                <div className="flex flex-col items-center mt-20 animate-in zoom-in">
                    <Loader2 className="w-20 h-20 animate-spin text-orange-500 mb-8" />
                    <span className="text-3xl font-extrabold text-[#33333B] dark:text-white">Aplicando Marca Automática...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center mt-10 p-12 bg-white dark:bg-[#1e1e1e] rounded-[40px] shadow-2xl border animate-in slide-in-from-bottom-5">
                    <CheckCircle className="w-24 h-24 text-green-500 mb-6 drop-shadow-md" />
                    <h2 className="text-3xl font-extrabold text-[#33333B] dark:text-white mb-4">Marca D'água Aplicada!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md text-center">
                        O texto foi estampado transversalmente. Todas as páginas foram protegidas visualmente.
                    </p>
                    <a href={downloadUrl!} download={`Carimbado_${file.name}`} className="w-full bg-orange-600 text-white text-center font-bold py-5 rounded-2xl text-xl hover:bg-orange-700 shadow-xl flex items-center justify-center mb-4 transition-transform hover:-translate-y-1">
                        <Download className="w-6 h-6 mr-3" /> Baixar PDF Final
                    </a>
                    <button onClick={handleReset} className="w-full py-4 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-gray-200 transition">
                        Processar Próximo Arquivo
                    </button>
                </div>
            )}
        </div>
    );
}
