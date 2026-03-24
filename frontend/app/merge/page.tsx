"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle, RefreshCw, Loader2, X, Plus } from "lucide-react";
import axios from "axios";
import { pdfjs } from 'react-pdf';

// Configura o worker do PDF.js para os recursos em client-side
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

export interface PageItem {
    id: string; // unique ID
    fileIndex: number; // reference to originalFiles array
    originalPageIndex: number; // 0-based index of the page inside the PDF
    thumbnailUrl: string; // Base64 data string
    fileName: string; // display name
}

export default function Home() {
    const [originalFiles, setOriginalFiles] = useState<File[]>([]);
    const [pages, setPages] = useState<PageItem[]>([]);

    const [isHovering, setIsHovering] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "processing_pages" | "uploading" | "success" | "error">("idle");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // DND Refs
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleSort = () => {
        const dragIdx = dragItem.current;
        const overIdx = dragOverItem.current;

        if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
            setPages((prev) => {
                const newPages = [...prev];
                const draggedContent = newPages[dragIdx];
                newPages.splice(dragIdx, 1);
                newPages.splice(overIdx, 0, draggedContent);
                return newPages;
            });
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(true);
    };

    const handleDragLeave = () => {
        setIsHovering(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const processFiles = async (newFiles: File[]) => {
        const pdfFiles = newFiles.filter(file => file.type === "application/pdf");
        if (pdfFiles.length !== newFiles.length) {
            alert("Oops! Notei um intruso. Mande apenas arquivos .pdf!");
        }

        if (pdfFiles.length === 0) return;

        setStatus("processing_pages");

        try {
            // Index offset for the newly uploaded files based on existing ones
            const startFileIdx = originalFiles.length;
            const newPages: PageItem[] = [];

            for (let fIdx = 0; fIdx < pdfFiles.length; fIdx++) {
                const file = pdfFiles[fIdx];
                const fileIndex = startFileIdx + fIdx;
                const fileUrl = URL.createObjectURL(file);

                const loadingTask = pdfjs.getDocument(fileUrl);
                const pdf = await loadingTask.promise;

                for (let pIdx = 1; pIdx <= pdf.numPages; pIdx++) {
                    const page = await pdf.getPage(pIdx);
                    // Usar escala menor para gerar miniatura leve
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
                            id: `${file.name}-${fileIndex}-${pIdx}-${Date.now()}`,
                            fileIndex: fileIndex,
                            originalPageIndex: pIdx - 1, // 0-based for Backend PyMuPDF
                            thumbnailUrl: dataUrl,
                            fileName: file.name
                        });
                    }
                }
                URL.revokeObjectURL(fileUrl);
            }

            setOriginalFiles(prev => [...prev, ...pdfFiles]);
            setPages(prev => [...prev, ...newPages]);
            setStatus("idle");
        } catch (error) {
            console.error("Error parsing pdf pages", error);
            setStatus("idle");
            alert("Houve um erro ao ler algumas páginas de um dos PDFs enviados.");
        }
    };

    const removePage = (index: number) => {
        setPages(prev => prev.filter((_, i) => i !== index));
    };

    const handleMerge = async () => {
        if (pages.length < 1) {
            alert("Para juntar você necessita de ao menos 1 página na tela!");
            return;
        }

        setStatus("uploading");
        setUploadProgress(0);

        const formData = new FormData();
        originalFiles.forEach((file) => {
            formData.append("files", file); 
        });

        const orderMapping = pages.map(p => ({
            fileIndex: p.fileIndex,
            pageIndex: p.originalPageIndex
        }));
        formData.append("order_mapping", JSON.stringify(orderMapping));

        try {
            const response = await axios.post("http://localhost:8000/api/merge", formData, {
                responseType: 'blob', 
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            setDownloadUrl(url);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "Documento_Junto_MiriamPDF.pdf");
            document.body.appendChild(link);
            link.click();

            setStatus("success");
        } catch (error) {
            console.error("Erro na fusão do Merge API:", error);
            setStatus("error");
        }
    };

    const handleReset = () => {
        setOriginalFiles([]);
        setPages([]);
        setStatus("idle");
        if (downloadUrl) {
            window.URL.revokeObjectURL(downloadUrl);
            setDownloadUrl(null);
        }
    };

    // ── Gov.br → ZapSign ────────────────────────────────────────────────────
    const handleLoginGovBr = async () => {
        const selectedFile = originalFiles[0];
        if (!selectedFile) {
            alert("Selecione ao menos um PDF antes de assinar com Gov.br.");
            return;
        }
        const formData = new FormData();
        formData.append("pdf", selectedFile);
        try {
            const res = await axios.post(
                "http://localhost:8000/api/pdf/zapsign/create",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            if (res.data?.sign_url) {
                window.open(res.data.sign_url, "zapsign_popup", "width=860,height=820");
            } else {
                alert("ZapSign não retornou um link de assinatura.");
            }
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err)
                ? (err.response?.data?.error ?? err.response?.data?.detail ?? err.message)
                : "Erro ao criar documento na ZapSign.";
            alert(`Erro Gov.br: ${msg}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center pt-24 pb-32 px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white text-center mb-6 tracking-tight drop-shadow-sm">
                Juntar arquivos PDF
            </h2>
            <p className="text-slate-600 dark:text-gray-400 text-lg lg:text-xl text-center mb-10 max-w-2xl font-medium tracking-wide">
                Mescle e junte PDFs e coloque-os na ordem que desejar. É tudo extremamente rápido e seguro.
            </p>

            {/* View Inicial vazia */}
            {pages.length === 0 && status === "idle" ? (
                <div
                    className={`w-full max-w-4xl h-[350px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer ${isHovering ? "border-[#2980f2] bg-[#2980f2]/5 dark:bg-[#2980f2]/10 shadow-inner" : "border-[#2980f2]/50 bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-[#2980f2] hover:shadow-lg"
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud className={`w-28 h-28 mb-4 transition-colors ${isHovering ? "text-[#2980f2]" : "text-gray-400 dark:text-gray-500"}`} />
                    <button className="bg-[#2980f2] text-white hover:bg-[#2980f2]/90 font-semibold py-5 px-10 rounded-2xl text-2xl shadow-lg transition-transform transform hover:scale-105 pointer-events-none">
                        Selecionar arquivos PDF
                    </button>
                    <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm font-medium">ou arraste e solte os PDFs aqui</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" multiple className="hidden" />
                </div>
            ) : status === "processing_pages" ? (
                <div className="w-full max-w-lg bg-white dark:bg-[#1e1e1e] p-10 rounded-3xl shadow-2xl flex flex-col items-center border border-gray-100 dark:border-gray-800 mt-10">
                    <Loader2 className="w-16 h-16 animate-spin text-[#2980f2] mb-6" />
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center leading-tight">Escaneando páginas enviadas...</span>
                </div>
            ) : status !== "idle" && status !== "uploading" ? null : (
                <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-8">
                    {/* Grid de Páginas Mapeadas UI */}
                    <div className="w-full flex flex-wrap justify-center gap-6 mb-12" onDragOver={(e) => e.preventDefault()}>
                        {pages.map((page, idx) => (
                            <div 
                                key={page.id} 
                                draggable
                                onDragStart={() => dragItem.current = idx}
                                onDragEnter={() => dragOverItem.current = idx}
                                onDragEnd={handleSort}
                                onDragOver={(e) => e.preventDefault()}
                                className="relative w-44 h-64 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center overflow-hidden p-2 hover:shadow-xl transition-all group cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:border-[#2980f2]"
                            >
                                <button
                                    onClick={() => removePage(idx)}
                                    className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl hover:bg-[#2980f2]/10 dark:hover:bg-[#2980f2]/20 text-gray-500 dark:text-gray-400 hover:text-[#2980f2] rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Thumbnail Container */}
                                <div className="flex-1 w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg mb-2 overflow-hidden pointer-events-none">
                                    <img src={page.thumbnailUrl} alt={`Page ${page.originalPageIndex + 1} of ${page.fileName}`} className="w-full h-full object-contain" />
                                </div>

                                <div className="w-full text-center tracking-tight">
                                    <p className="text-xs text-gray-800 dark:text-gray-200 font-bold truncate">Pág {page.originalPageIndex + 1}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[120px]">{page.fileName}</p>
                                    <span className="absolute bottom-1 right-2 text-[10px] font-bold text-gray-300 dark:text-gray-600 group-hover:text-[#2980f2] transition-colors">#{idx + 1}</span>
                                </div>
                            </div>
                        ))}

                        {status === "idle" && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-44 h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e1e1e] hover:border-[#2980f2] group transition-colors shadow-sm"
                            >
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 group-hover:bg-[#2980f2]/10 text-gray-400 dark:text-gray-500 group-hover:text-[#2980f2] rounded-full flex items-center justify-center mb-3 transition-colors">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-[#2980f2]">Adicionar mais</span>
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" multiple className="hidden" />
                            </div>
                        )}
                    </div>

                    {/* Sticky Footer Bar no estilo iLovePDF */}
                    {status === "idle" && (
                        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-5 flex items-center justify-between z-50 animate-in slide-in-from-bottom">
                            <div className="flex flex-col ml-4 sm:ml-10">
                                <span className="text-xl font-bold text-gray-800 dark:text-gray-100">Pronto para criar a mágica?</span>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{pages.length} página(s) carregada(s) prontas para o merge.</span>
                            </div>
                            <div className="flex gap-3 mr-4 sm:mr-10 flex-wrap justify-end">
                                <button
                                    onClick={handleReset}
                                    className="hidden sm:block bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold py-4 px-8 rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                >
                                    Descartar seleção
                                </button>
                                <button
                                    onClick={handleMerge}
                                    className={`font-semibold py-4 px-10 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all ${pages.length < 1 ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 scale-100" : "bg-[#2980f2] hover:bg-[#2980f2]/90 text-white hover:scale-105"
                                        }`}
                                    disabled={pages.length < 1}
                                >
                                    <span className="text-xl">Unir Páginas 👉</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {status === "uploading" && (
                        <div className="w-full max-w-lg bg-white dark:bg-[#1e1e1e] p-10 rounded-3xl shadow-2xl flex flex-col items-center border border-gray-100 dark:border-gray-800 mt-10">
                            <div className="flex flex-col items-center mb-8">
                                <Loader2 className="w-16 h-16 animate-spin text-[#2980f2] mb-6" />
                                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center leading-tight">Juntando engrenagens...<br />Aguarde.</span>
                            </div>
                            <div className="w-full bg-[#2980f2]/20 rounded-full h-5 overflow-hidden relative">
                                <div className="bg-[#2980f2] h-full rounded-full transition-all duration-300 ease-in-out relative flex items-center justify-end" style={{ width: `${uploadProgress}%` }}>
                                    {uploadProgress > 15 && <span className="text-[11px] text-white font-bold mr-3">{uploadProgress}%</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Success and Error States that replace the Grid dynamically to avoid visual bugs */}
            {status === "success" && (
                <div className="flex flex-col items-center text-[#2980f2] animate-in fade-in zoom-in duration-300 bg-white dark:bg-[#1e1e1e] p-12 sm:p-16 rounded-3xl shadow-2xl border border-green-50 dark:border-[#2980f2]/50 w-full max-w-2xl mt-10 z-10">
                    <CheckCircle className="w-28 h-28 mb-8" />
                    <p className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 text-center tracking-tight">Fusão concluída!</p>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 text-center text-lg font-medium">Seus PDFs foram unidos página por página e o download iniciou magicamente.</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
                        {downloadUrl && (
                            <a href={downloadUrl} download="Documento_Merge_Completo.pdf" className="flex-1 bg-[#1E1E1E] hover:bg-black text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                                Baixar Novamente
                            </a>
                        )}
                        <button onClick={handleReset} className="flex-1 bg-[#2980f2] hover:bg-[#2980f2]/90 text-white font-semibold py-5 px-6 rounded-2xl flex items-center justify-center space-x-3 shadow-xl transition-all hover:-translate-y-1">
                            <RefreshCw className="w-6 h-6" />
                            <span>Misturar mais</span>
                        </button>
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center w-full max-w-md bg-white dark:bg-[#1e1e1e] p-10 rounded-3xl border border-red-100 dark:border-[#2980f2]/50 shadow-xl mt-10 z-10">
                    <div className="w-20 h-20 bg-[#2980f2]/5 dark:bg-[#2980f2]/10 rounded-full flex items-center justify-center mb-6">
                        <X className="w-10 h-10 text-[#2980f2]" />
                    </div>
                    <p className="font-bold mb-8 text-red-700 dark:text-gray-500 text-center text-xl">Oops, algo quebrou no backend!<br /><span className="text-sm font-normal text-gray-600 dark:text-gray-400">Verifique se o servidor está online.</span></p>
                    <button onClick={() => setStatus("idle")} className="w-full bg-white dark:bg-transparent border-2 border-red-600 dark:border-[#2980f2]/50 hover:bg-[#2980f2] dark:hover:bg-[#2980f2]/50 hover:text-white dark:text-[#2980f2] text-[#2980f2] font-bold py-4 px-8 rounded-xl transition-colors shadow-sm">
                        Voltar e revisar o envio
                    </button>
                </div>
            )}
        </div>
    );
}
