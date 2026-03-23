"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileArchive, CheckCircle, Loader2 } from "lucide-react";
import axios from "axios";

export default function CompressPDF() {
    const [file, setFile] = useState<File | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsHovering(true); };
    const handleDragLeave = () => setIsHovering(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0].type === "application/pdf") setFile(e.dataTransfer.files[0]);
    };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0].type === "application/pdf") setFile(e.target.files[0]);
    };

    const handleCompress = async () => {
        if (!file) return;
        setStatus("uploading");
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://localhost:8000/api/compress", formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                },
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            setDownloadUrl(url);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Comprimido_MiriamPDF.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setStatus("success");
        } catch (error) { setStatus("error"); }
    };

    return (
        <div className="flex flex-col items-center pb-32 pt-16 px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 text-center mb-4 tracking-tight">Comprimir PDF</h2>
            <p className="text-[#33333B] dark:text-gray-300 text-lg text-center mb-10 max-w-2xl font-light">Otimize e reduza o tamanho do seu documento mantendo boa resolução visual.</p>

            {!file && status === "idle" ? (
                <div className={`w-full max-w-4xl h-[300px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer ${isHovering ? "border-[#2980f2] bg-[#2980f2]/5 dark:bg-[#2980f2]/10 shadow-inner" : "border-[#2980f2]/40 bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-[#2980f2] hover:shadow-lg"}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className={`w-28 h-28 mb-4 ${isHovering ? "text-[#2980f2]" : "text-gray-400 dark:text-gray-500"}`} />
                    <button className="bg-[#2980f2] text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-lg hover:scale-105 transition-transform">Selecionar PDF</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" className="hidden" />
                </div>
            ) : status !== "idle" && status !== "uploading" ? null : (
                <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center">
                    {status === "idle" && (
                        <>
                            <FileArchive className="text-[#2980f2] w-16 h-16 mb-4" />
                            <p className="text-xl font-bold text-gray-800 dark:text-gray-200 truncate w-full">{file!.name}</p>
                            <div className="mt-8 flex flex-col gap-4 w-full">
                                <button onClick={handleCompress} className="bg-[#2980f2] text-white font-bold py-4 px-8 rounded-xl hover:bg-[#2980f2]/90 w-full shadow-md transition-colors">Comprimir Arquivo</button>
                                <button onClick={() => setFile(null)} className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 px-8 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                            </div>
                        </>
                    )}
                    {status === "uploading" && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-16 h-16 animate-spin text-[#2980f2] mb-6" />
                            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">Otimizando streams de bytes do PDF...</span>
                        </div>
                    )}
                </div>
            )}
            
            {status === "success" && (
                <div className="flex flex-col items-center animate-in zoom-in bg-white dark:bg-[#1e1e1e] p-12 rounded-3xl shadow-2xl border border-green-50 dark:border-[#2980f2]/50 w-full max-w-2xl mt-10">
                    <CheckCircle className="w-20 h-20 text-[#2980f2] mb-6" />
                    <p className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 tracking-tight text-center">Otimizado e Enxuto!</p>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 text-center text-lg font-medium">Seu PDF emagreceu consideravelmente.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full px-4 mt-6">
                        {downloadUrl && (
                            <a href={downloadUrl} download="Comprimido_MiriamPDF.pdf" className="flex-1 bg-[#1E1E1E] dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                                Baixar Pela 2ª Vez
                            </a>
                        )}
                        <button onClick={() => { setFile(null); setStatus("idle"); setDownloadUrl(null); }} className="flex-1 bg-[#2980f2] hover:bg-[#2980f2]/90 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                            Comprimir Outro
                        </button>
                    </div>
                </div>
            )}
            {status === "error" && (
                <div className="flex flex-col items-center bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 p-10 rounded-3xl shadow-xl mt-10">
                    <div className="text-[#2980f2] font-bold mb-4 text-xl">Erro na compressão.</div>
                    <button onClick={() => setStatus("idle")} className="mt-4 border-2 border-[#2980f2]/50 text-[#2980f2] font-bold py-3 px-8 rounded-xl hover:bg-[#2980f2]/5 dark:hover:bg-[#2980f2]/10 transition-colors">Tentar Novamente</button>
                </div>
            )}
        </div>
    );
}
