"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, RefreshCw, Loader2, X, Scissors, FileArchive } from "lucide-react";
import axios from "axios";
import { pdfjs } from 'react-pdf';

if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

export interface PageItem {
    originalPageIndex: number;
    thumbnailUrl: string;
}

export default function SplitPDF() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

    const [isHovering, setIsHovering] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "processing_pages" | "uploading_selected" | "uploading_all" | "success" | "error">("idle");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadName, setDownloadName] = useState<string>("documento.pdf");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(true);
    };

    const handleDragLeave = () => {
        setIsHovering(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (e.dataTransfer.files[0].type === "application/pdf") {
                await processFile(e.dataTransfer.files[0]);
            } else {
                alert("Apenas formatações em PDF!");
            }
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            if (e.target.files[0].type === "application/pdf") {
                await processFile(e.target.files[0]);
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const processFile = async (pdfFile: File) => {
        setFile(pdfFile);
        setStatus("processing_pages");
        setSelectedPages(new Set());
        setPages([]);

        try {
            const fileUrl = URL.createObjectURL(pdfFile);
            const loadingTask = pdfjs.getDocument(fileUrl);
            const pdf = await loadingTask.promise;

            const newPages: PageItem[] = [];

            for (let pIdx = 1; pIdx <= pdf.numPages; pIdx++) {
                const page = await pdf.getPage(pIdx);
                const viewport = page.getViewport({ scale: 0.5 }); 
                
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };
                    await page.render(renderContext).promise;
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                    
                    newPages.push({
                        originalPageIndex: pIdx - 1, 
                        thumbnailUrl: dataUrl,
                    });
                }
            }
            URL.revokeObjectURL(fileUrl);
            setPages(newPages);
            setStatus("idle");
        } catch (error) {
            console.error("Error parsing pdf pages", error);
            setStatus("idle");
            alert("Houve um erro ao ler o PDF enviado.");
        }
    };

    const togglePageSelection = (idx: number) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
            }
            return next;
        });
    };

    const handleSplitSelected = async () => {
        if (!file || selectedPages.size === 0) return;

        setStatus("uploading_selected");
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("selected_pages", JSON.stringify(Array.from(selectedPages)));

        try {
            const response = await axios.post("http://localhost:8000/api/split/selected", formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                },
            });

            const originalName = file.name.replace(".pdf", "");
            const outName = `${originalName}_extraido.pdf`;

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            setDownloadUrl(url);
            setDownloadName(outName);

            triggerDownload(url, outName);
            setStatus("success");
        } catch (error) {
            console.error("Erro extraindo páginas logicas:", error);
            setStatus("error");
        }
    };

    const handleSplitAll = async () => {
        if (!file) return;

        setStatus("uploading_all");
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://localhost:8000/api/split/all", formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                },
            });

            const originalName = file.name.replace(".pdf", "");
            const outName = `${originalName}_dividido.zip`;

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/zip" }));
            setDownloadUrl(url);
            setDownloadName(outName);

            triggerDownload(url, outName);
            setStatus("success");
        } catch (error) {
            console.error("Erro extraindo páginas totais:", error);
            setStatus("error");
        }
    };

    const triggerDownload = (url: string, name: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFile(null);
        setPages([]);
        setSelectedPages(new Set());
        setStatus("idle");
        if (downloadUrl) {
            window.URL.revokeObjectURL(downloadUrl);
            setDownloadUrl(null);
        }
    };

    return (
        <div className="flex flex-col items-center pb-32 pt-16 px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 text-center mb-4 tracking-tight">
                Dividir/Extrair PDF
            </h2>
            <p className="text-[#33333B] dark:text-gray-300 text-lg text-center mb-10 max-w-2xl font-light">
                Extraia páginas específicas de um documento ou desmembre todas as páginas em arquivos individuais.
            </p>

            {/* Empty View */}
            {!file && status === "idle" ? (
                <div
                    className={`w-full max-w-4xl h-[300px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer ${isHovering ? "border-pdfred bg-red-50 dark:bg-red-900/20 shadow-inner" : "border-pdfred/40 bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-pdfred hover:shadow-lg"
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud className={`w-28 h-28 mb-4 ${isHovering ? "text-pdfred" : "text-gray-400 dark:text-gray-500"}`} />
                    <button className="bg-pdfred hover:bg-red-700 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-lg transition-transform transform hover:scale-105">
                        Selecionar arquivo PDF
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" className="hidden" />
                </div>
            ) : status === "processing_pages" ? (
                <div className="w-full max-w-lg bg-white dark:bg-[#1e1e1e] p-10 rounded-3xl shadow-2xl flex flex-col items-center border border-gray-100 dark:border-gray-800 mt-10">
                    <Loader2 className="w-16 h-16 animate-spin text-pdfred mb-6" />
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center leading-tight">Mapeando o documento...</span>
                </div>
            ) : status !== "idle" && !status.startsWith("uploading") ? null : (
                <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-8">

                    {/* Grid de Páginas Visual */}
                    <div className="w-full flex flex-wrap justify-center gap-6 mb-12">
                        {pages.map((page, idx) => {
                            const isSelected = selectedPages.has(idx);
                            
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => togglePageSelection(idx)}
                                    className={`relative w-44 h-64 rounded-xl shadow-md border-2 flex flex-col items-center overflow-hidden p-2 transition-all cursor-pointer hover:-translate-y-1 ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-blue-100 dark:shadow-none" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] hover:border-blue-300 dark:hover:border-blue-600"}`}
                                >
                                    {/* Visual Selection Indicator */}
                                    <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors z-10 ${isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300 dark:border-gray-600 dark:bg-gray-800"}`}>
                                        {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="flex-1 w-full flex items-center justify-center mb-2 overflow-hidden pointer-events-none mt-4 rounded-md">
                                        <img src={page.thumbnailUrl} alt={`Page ${idx + 1}`} className="max-w-full max-h-full object-contain shadow-sm border border-gray-100/50 dark:border-gray-700/50" />
                                    </div>

                                    <div className="w-full text-center">
                                        <p className={`text-sm font-bold truncate ${isSelected ? "text-blue-700 dark:text-blue-400" : "text-gray-800 dark:text-gray-300"}`}>Página {idx + 1}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sticky Footer Menu */}
                    {status === "idle" && (
                        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-5 flex items-center justify-between z-50 animate-in slide-in-from-bottom">
                            <div className="flex flex-col ml-4 sm:ml-10">
                                <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{file?.name}</span>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{selectedPages.size} página(s) selecionada(s) de {pages.length}</span>
                            </div>
                            <div className="flex gap-4 mr-4 sm:mr-10 items-center">
                                <button
                                    onClick={handleReset}
                                    className="hidden sm:block bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold py-4 px-6 rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                >
                                    Cancelar
                                </button>
                                
                                <button
                                    onClick={handleSplitAll}
                                    className="font-bold py-4 px-6 rounded-xl text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center space-x-2"
                                >
                                    <FileArchive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span>Dividir todo o PDF (.zip)</span>
                                </button>

                                <button
                                    onClick={handleSplitSelected}
                                    className={`font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all ${selectedPages.size < 1 ? "bg-red-300 cursor-not-allowed text-white scale-100" : "bg-pdfred hover:bg-red-700 text-white hover:scale-105"
                                        }`}
                                    disabled={selectedPages.size < 1}
                                >
                                    <Scissors className="w-5 h-5" />
                                    <span>Extrair Selecionadas ({selectedPages.size})</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {status.startsWith("uploading") && (
                        <div className="w-full max-w-lg bg-white dark:bg-[#1e1e1e] p-10 rounded-3xl shadow-2xl flex flex-col items-center border border-gray-100 dark:border-gray-800 mt-10">
                            <div className="flex flex-col items-center mb-8">
                                <Loader2 className="w-16 h-16 animate-spin text-pdfred mb-6" />
                                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center leading-tight">
                                    {status === "uploading_all" ? "Fatiando arquivo e gerando Zip..." : "Cortando páginas selecionadas..."}
                                </span>
                            </div>
                            <div className="w-full bg-red-50 rounded-full h-5 overflow-hidden border border-red-100 relative">
                                <div className="bg-pdfred h-full rounded-full transition-all duration-300 ease-in-out flex items-center justify-end" style={{ width: `${uploadProgress}%` }}>
                                    {uploadProgress > 15 && <span className="text-[11px] text-white font-bold mr-3">{uploadProgress}%</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Success and Error States */}
            {status === "success" && (
                <div className="flex flex-col items-center text-green-600 animate-in fade-in zoom-in duration-300 bg-white dark:bg-[#1e1e1e] p-12 sm:p-16 rounded-3xl shadow-2xl border border-green-50 dark:border-green-900/30 w-full max-w-2xl mt-10 z-10">
                    <CheckCircle className="w-28 h-28 mb-8" />
                    <p className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 text-center tracking-tight">Corte concluído!</p>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 text-center text-lg font-medium">Suas opções foram processadas e o download automático foi iniciado.</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
                        {downloadUrl && (
                            <a href={downloadUrl} download={downloadName} className="flex-1 bg-[#1E1E1E] hover:bg-black text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                                Baixar Arquivo Novamente
                            </a>
                        )}
                        <button onClick={handleReset} className="flex-1 bg-pdfred hover:bg-red-700 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center space-x-3 shadow-xl transition-all hover:-translate-y-1">
                            <RefreshCw className="w-6 h-6" />
                            <span>Dividir outro PDF</span>
                        </button>
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center w-full max-w-md bg-white dark:bg-[#1e1e1e] p-10 rounded-3xl border border-red-100 dark:border-red-900/40 shadow-xl mt-10 z-10">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                        <X className="w-10 h-10 text-pdfred" />
                    </div>
                    <p className="font-bold mb-8 text-red-700 dark:text-red-400 text-center text-xl">Oops, algo quebrou no backend!<br /><span className="text-sm font-normal text-gray-600 dark:text-gray-400">Verifique os logs do servidor Python.</span></p>
                    <button onClick={() => setStatus("idle")} className="w-full bg-white dark:bg-transparent border-2 border-red-600 dark:border-red-500 hover:bg-red-600 dark:hover:bg-red-500 hover:text-white dark:text-red-500 text-red-600 font-bold py-4 px-8 rounded-xl transition-colors shadow-sm">
                        Voltar e revisar o envio
                    </button>
                </div>
            )}
        </div>
    );
}
