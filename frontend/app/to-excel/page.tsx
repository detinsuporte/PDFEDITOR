"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle, Loader2, Table } from "lucide-react";
import axios from "axios";

export default function ConvertToExcel() {
    const [file, setFile] = useState<File | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [processingTime, setProcessingTime] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

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
        setStatus("processing");
        setUploadProgress(0);
        setProcessingTime(0);

        const formData = new FormData();
        formData.append("file", file);
        
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Inicia o timer de processamento simulado (backend demorando)
        const timer = setInterval(() => {
            setProcessingTime(prev => prev + 1);
        }, 1000);

        try {
            const response = await axios.post("http://localhost:8000/api/to-excel", formData, {
                responseType: 'blob',
                signal: controller.signal,
            });

            clearInterval(timer);

            // MIME type for Excel
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
            setDownloadUrl(url);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Convertido_Excel_iLovePDF.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setStatus("success");
        } catch (error) {
            clearInterval(timer);
            if (axios.isCancel(error)) {
                setStatus("idle");
            } else {
                setStatus("error");
            }
        }
    };

    const handleCancelTransfer = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setFile(null);
        setStatus("idle");
        setProcessingTime(0);
    };

    const handleReset = () => { setFile(null); setStatus("idle"); setDownloadUrl(null); setProcessingTime(0); };

    return (
        <div className="flex flex-col items-center pb-32 pt-16 px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 text-center mb-4 tracking-tight">PDF para Excel</h2>
            <p className="text-[#33333B] dark:text-gray-300 text-lg text-center mb-10 max-w-2xl font-light">Extraia tabelas e grades de dados de seus PDFs em segundos para planilhas EXCEL editáveis.</p>

            {!file && status === "idle" ? (
                <div className={`w-full max-w-4xl h-[300px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer ${isHovering ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-inner" : "border-green-500/40 bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-green-500 hover:shadow-lg"}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className={`w-28 h-28 mb-4 ${isHovering ? "text-green-500" : "text-gray-400 dark:text-gray-500"}`} />
                    <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-lg hover:scale-105 transition-all">Selecionar PDF</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" className="hidden" />
                </div>
            ) : status !== "idle" && status !== "uploading" && status !== "processing" ? null : (
                <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center transition-all">
                    {status === "idle" && (
                        <>
                            <FileSpreadsheet className="text-green-600 w-16 h-16 mb-4" />
                            <p className="text-xl font-bold text-gray-800 dark:text-gray-200 truncate max-w-full">{file!.name}</p>
                            <div className="mt-8 flex flex-col gap-4 w-full">
                                <button onClick={handleConvert} className="bg-green-600 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 w-full shadow-md"><Table /> Extrair para EXCEL</button>
                                
                                <button onClick={handleReset} className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 px-8 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                            </div>
                        </>
                    )}
                    {(status === "uploading" || status === "processing") && (
                        <div className="flex flex-col items-center w-full">
                            <Loader2 className="w-16 h-16 animate-spin text-green-600 mb-6" />
                            <span className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                Lendo grids via pdfplumber...
                            </span>
                            
                            {/* Barra de Progresso Falsa para mostrar que nao travou */}
                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full mt-4 overflow-hidden relative">
                                <div 
                                    className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(95, 10 + processingTime * 2)}%` }}
                                ></div>
                            </div>
                            
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 h-6">
                                <>Tempo decorrido: <b className="text-gray-700 dark:text-gray-300">{processingTime}s</b> (Arquivos grandes demoram muito neste processo)</>
                            </p>

                            <button onClick={handleCancelTransfer} className="mt-8 border-2 border-red-500 text-red-500 font-bold py-3 px-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition w-full">
                                Cancelar Extração
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {status === "success" && (
                <div className="flex flex-col items-center w-full max-w-2xl bg-white dark:bg-[#1e1e1e] p-12 rounded-3xl shadow-2xl border border-green-50 dark:border-green-900/30 animate-in zoom-in mt-10">
                    <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                    <p className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 tracking-tight text-center">Planilha Gerada com Sucesso!</p>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-center text-lg font-medium">Suas tabelas foram extraídas para um arquivo XLSX.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
                        {downloadUrl && (
                            <a href={downloadUrl} download="Convertido_Excel_iLovePDF.xlsx" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                                Baixar Arquivo EXCEL
                            </a>
                        )}
                        <button onClick={handleReset} className="flex-1 bg-gray-800 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                            Converter Outro PDF
                        </button>
                    </div>
                </div>
            )}
            
            {status === "error" && (
                <div className="flex flex-col items-center bg-white dark:bg-[#1e1e1e] p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 mt-10">
                    <div className="text-red-500 font-bold mb-4 text-xl">Falha na extração ou PDF sem tabelas estruturadas.</div>
                    <button onClick={handleReset} className="mt-4 border-2 border-red-500 text-red-500 font-bold py-3 px-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">Tentar Novamente</button>
                </div>
            )}
        </div>
    );
}
