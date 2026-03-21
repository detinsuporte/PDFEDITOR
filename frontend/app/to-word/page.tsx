"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle, Loader2, FileEdit } from "lucide-react";
import axios from "axios";

export default function ConvertToWord() {
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (e.dataTransfer.files[0].type === "application/pdf") setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            if (e.target.files[0].type === "application/pdf") setFile(e.target.files[0]);
        }
    };

    const handleConvert = async () => {
        if (!file) return;
        setStatus("uploading");
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://localhost:8000/api/to-word", formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                },
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
            setDownloadUrl(url);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Convertido_Word_iLovePDF.docx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setStatus("success");
        } catch (error) {
            setStatus("error");
        }
    };

    const handleReset = () => { setFile(null); setStatus("idle"); setDownloadUrl(null); };

    return (
        <div className="flex flex-col items-center pb-32 pt-16 px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 text-center mb-4 tracking-tight">PDF para Word</h2>
            <p className="text-[#33333B] dark:text-gray-300 text-lg text-center mb-10 max-w-2xl font-light">Converta facilmente seus arquivos PDF para DOCX editáveis via Extração Nativa Python.</p>

            {!file && status === "idle" ? (
                <div className={`w-full max-w-4xl h-[300px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer ${isHovering ? "border-pdfred bg-red-50 dark:bg-red-900/20 shadow-inner" : "border-pdfred/40 bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-pdfred hover:shadow-lg"}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className={`w-28 h-28 mb-4 ${isHovering ? "text-pdfred" : "text-gray-400 dark:text-gray-500"}`} />
                    <button className="bg-pdfred hover:bg-red-700 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-lg hover:scale-105 transition-all">Selecionar PDF</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" className="hidden" />
                </div>
            ) : status !== "idle" && status !== "uploading" ? null : (
                <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center">
                    {status === "idle" && (
                        <>
                            <FileText className="text-pdfred w-16 h-16 mb-4" />
                            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate max-w-full">{file!.name}</p>
                            <div className="mt-8 flex flex-col gap-4 w-full">
                                <button onClick={handleConvert} className="bg-pdfred text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 w-full shadow-md"><FileEdit /> Converter para WORD</button>
                                
                                <button onClick={handleReset} className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 px-8 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700">Cancelar</button>
                            </div>
                        </>
                    )}
                    {status === "uploading" && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-16 h-16 animate-spin text-pdfred mb-6" />
                            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">Convertendo texto e layout via AI...</span>
                        </div>
                    )}
                </div>
            )}
            
            {status === "success" && (
                <div className="flex flex-col items-center w-full max-w-2xl bg-white dark:bg-[#1e1e1e] p-12 rounded-3xl shadow-2xl border border-green-50 dark:border-green-900/30 animate-in zoom-in mt-10">
                    <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                    <p className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 tracking-tight text-center">Word Gerado com Sucesso!</p>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-center text-lg font-medium">Seu arquivo DOCX está pronto para edição.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
                        {downloadUrl && (
                            <a href={downloadUrl} download="Convertido_Word_iLovePDF.docx" className="flex-1 bg-[#1E1E1E] hover:bg-black text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                                Baixar Arquivo DOCX
                            </a>
                        )}
                        <button onClick={handleReset} className="flex-1 bg-pdfred hover:bg-red-700 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                            Converter Outro PDF
                        </button>
                    </div>
                </div>
            )}
            
            {status === "error" && (
                <div className="flex flex-col items-center bg-white dark:bg-[#1e1e1e] p-10 rounded-3xl shadow-xl mt-10 border border-gray-100 dark:border-gray-800">
                    <div className="text-red-500 font-bold mb-4 text-xl">Falha ou arquivo incompatível com o Motor de Word.</div>
                    <button onClick={handleReset} className="mt-4 border-2 border-red-500 text-red-500 font-bold py-3 px-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20">Tentar Novamente</button>
                </div>
            )}
        </div>
    );
}
