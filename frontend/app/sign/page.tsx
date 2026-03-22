"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle, Loader2, PenTool, Download } from "lucide-react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import dynamic from "next/dynamic";

const SignatureModal = dynamic(() => import("../components/SignatureModal"), { ssr: false });

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface SignatureElement {
    id: string;
    page: number; // 1-indexed
    x: number; // css x original (pt)
    y: number; // css y original (pt)
    width: number; // css width original (pt)
    height: number; // css height original (pt)
    base64Url: string;
}

export default function SignPDF() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [zoom, setZoom] = useState<number>(1);
    
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    
    const [signatures, setSignatures] = useState<SignatureElement[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [pdfDimensions, setPdfDimensions] = useState({ originalWidth: 0, originalHeight: 0, renderedWidth: 0, renderedHeight: 0 });
    const pageContainerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Local Drag to pan canvas
    useEffect(() => {
        const slider = scrollContainerRef.current;
        if (!slider) return;

        let isDown = false;
        let startX = 0; let startY = 0;
        let scrollLeft = 0; let scrollTop = 0;

        const mouseDown = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest('.rnd-signature') || (e.target as HTMLElement).closest('button')) return;
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            startY = e.pageY - slider.offsetTop;
            scrollLeft = slider.scrollLeft;
            scrollTop = slider.scrollTop;
        };

        const mouseLeave = () => { isDown = false; slider.style.cursor = 'grab'; };
        const mouseUp = () => { isDown = false; slider.style.cursor = 'grab'; };

        const mouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const y = e.pageY - slider.offsetTop;
            const walkX = (x - startX) * 1.5;
            const walkY = (y - startY) * 1.5;
            slider.scrollLeft = scrollLeft - walkX;
            slider.scrollTop = scrollTop - walkY;
        };

        slider.addEventListener('mousedown', mouseDown);
        slider.addEventListener('mouseleave', mouseLeave);
        slider.addEventListener('mouseup', mouseUp);
        slider.addEventListener('mousemove', mouseMove);

        return () => {
            slider.removeEventListener('mousedown', mouseDown);
            slider.removeEventListener('mouseleave', mouseLeave);
            slider.removeEventListener('mouseup', mouseUp);
            slider.removeEventListener('mousemove', mouseMove);
        };
    }, [fileUrl, status]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFileUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleSaveSignature = (base64Url: string) => {
        const renderScaleX = pdfDimensions.originalWidth ? (pdfDimensions.renderedWidth / pdfDimensions.originalWidth) : 1;
        const renderScaleY = pdfDimensions.originalHeight ? (pdfDimensions.renderedHeight / pdfDimensions.originalHeight) : 1;
        
        // Tamanho padrão de assinatura no PDF (ex: 200pt largura, 100pt altura)
        const defaultWidth = 150;
        const defaultHeight = 75;

        const newSig: SignatureElement = {
            id: Date.now().toString(),
            page: currentPage,
            base64Url,
            x: 50 / renderScaleX,
            y: 50 / renderScaleY,
            width: defaultWidth,
            height: defaultHeight
        };
        setSignatures([...signatures, newSig]);
    };

    const handleUpdateSignature = (id: string, updates: Partial<SignatureElement>) => {
        setSignatures(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const handleRemoveSignature = (id: string) => {
        setSignatures(prev => prev.filter(el => el.id !== id));
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);

    const onPageLoadSuccess = (page: any) => {
        const viewport = page.getViewport({ scale: 1 });
        if (pageContainerRef.current) {
            const rect = pageContainerRef.current.getBoundingClientRect();
            setPdfDimensions({
                originalWidth: viewport.width,
                originalHeight: viewport.height,
                renderedWidth: rect.width,
                renderedHeight: rect.height
            });
        }
    };

    const onRenderSuccess = () => {
        if (pageContainerRef.current && pdfDimensions.originalWidth > 0) {
            const rect = pageContainerRef.current.getBoundingClientRect();
            setPdfDimensions(prev => ({
                ...prev,
                renderedWidth: rect.width,
                renderedHeight: rect.height
            }));
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setStatus("uploading");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("signatures", JSON.stringify(signatures));

        try {
            const response = await axios.post("http://localhost:8000/api/pdf/add-signature", formData, {
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
        setFile(null); setFileUrl(null); setSignatures([]); setStatus("idle"); setDownloadUrl(null); setCurrentPage(1);
    };

    if (!isMounted) return null;

    return (
        <div className="flex flex-col pt-24 pb-12 px-4 items-center font-sans tracking-tight transition-colors">
            <h1 className="text-4xl md:text-5xl font-sans font-extrabold text-slate-900 dark:text-white text-center tracking-wide drop-shadow-sm font-light mb-3">Assinatura Digital (E-Sign)</h1>
            <p className="text-[#3a3a40] dark:text-[#a0a0ab] text-lg lg:text-xl text-center mb-10 max-w-2xl font-light tracking-wide">
                Aponte e assine documentos desenhando seu próprio rubro virtual ou escaneando uma imagem. Autenticação empresarial.
            </p>

            {!fileUrl ? (
                <div onClick={() => document.getElementById("fileInput")?.click()} className="w-full max-w-4xl h-[350px] bg-white dark:bg-[#1e1e1e] border-4 border-dashed border-[#2980f2]/30 hover:border-[#2980f2]/70 hover:bg-[#2980f2]/5 dark:hover:bg-[#2980f2]/10 transition-all rounded-[30px] flex flex-col items-center justify-center cursor-pointer shadow-sm group">
                    <UploadCloud className="w-24 h-24 text-gray-400 dark:text-gray-500 group-hover:scale-110 group-hover:text-[#2980f2] transition-transform mb-6" />
                    <button className="bg-[#2980f2] hover:opacity-90 tracking-wide text-white font-semibold py-4 px-10 rounded-2xl text-xl shadow-lg transition-transform transform hover:scale-105 pointer-events-none">
                        Carregar PDF para Assinatura
                    </button>
                    <input type="file" id="fileInput" accept="application/pdf" className="hidden" onChange={onFileChange} />
                </div>
            ) : status === "idle" ? (
                <div className="w-full flex flex-col xl:flex-row gap-8 max-w-7xl relative mx-auto items-stretch">
                    
                    {/* MENU LATERAL */}
                    <div className="w-full xl:w-[350px] bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-6 h-fit shrink-0 relative z-10 sticky top-24">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-extrabold text-xl text-[#33333B] dark:text-gray-100">Camadas do Rubro</h3>
                            <button onClick={() => setIsModalOpen(true)} className="bg-[#2980f2]/10 text-[#2980f2] hover:bg-[#2980f2] hover:text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center transition-colors shadow-sm">
                                <PenTool className="w-4 h-4 mr-2" /> Assinar
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] xl:max-h-[600px] scrollbar-thin">
                            {signatures.length === 0 && (
                                <div className="flex flex-col items-center justify-center text-center py-12 px-4 opacity-50">
                                    <PenTool className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Nenhuma assinatura presente no visualizador.</p>
                                </div>
                            )}
                            
                            {signatures.map((el, i) => (
                                <div key={el.id} className="bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 group relative transition hover:shadow-md animate-in slide-in-from-left">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#2980f2] rounded-l-2xl"></div>
                                    <div className="flex justify-between items-center pl-2">
                                        <span className="font-bold text-xs uppercase tracking-wider text-gray-400">Assinatura #{i+1}</span>
                                        <button onClick={() => handleRemoveSignature(el.id)} className="text-red-400 hover:text-[#2980f2] text-xs font-bold px-2 py-1 bg-white dark:bg-gray-800 border shadow-sm rounded-lg transition">Excluir</button>
                                    </div>
                                    <div className="w-full h-20 bg-white dark:bg-[#121212] overflow-hidden rounded-xl border border-[#2980f2]/20 flex items-center justify-center ml-2 p-1">
                                        <img src={el.base64Url} alt="E-Sign Preview" className="max-h-full max-w-full object-contain" />
                                    </div>
                                    <div className="flex items-center gap-2 ml-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <span className="text-xs text-gray-500 font-bold w-full">Pg. Alvo:</span>
                                        <input type="number" min={1} max={numPages} value={el.page} onChange={(e) => handleUpdateSignature(el.id, {page: Number(e.target.value)})} className="p-1 border bg-gray-50 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 font-bold text-sm w-12 rounded-lg text-center outline-none" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-auto pt-6 border-t flex flex-col gap-3">
                            <button onClick={handleProcess} className="w-full flex items-center justify-center gap-2 bg-[#2980f2] hover:opacity-90 text-white font-semibold py-4 rounded-xl shadow-lg transition">
                                <CheckCircle className="w-5 h-5"/> Carimbar Documentos
                            </button>
                        </div>
                    </div>

                    {/* CANVAS DE VISUALIZACAO */}
                    <div className="flex-1 bg-[#F9FAFB] dark:bg-[#0a0a0a] rounded-3xl shadow-xl border p-2 lg:p-6 block overflow-auto relative cursor-grab" ref={scrollContainerRef}>
                        <div className="flex justify-between items-center max-w-3xl mb-6 bg-gray-50 dark:bg-gray-900 border px-4 py-3 rounded-2xl mx-auto sticky left-0 top-0 z-50">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage <= 1} className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Anterior</button>
                                <span className="font-extrabold px-2 text-[#33333B] dark:text-white">{currentPage} / {numPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(p + 1, numPages))} disabled={currentPage >= numPages} className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Próxima</button>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-xl">
                                <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="w-8 h-8 font-bold text-lg hover:text-[#2980f2] rounded-lg">-</button>
                                <span className="font-extrabold w-14 text-center text-[#33333B] dark:text-white text-sm">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(z => Math.min(z + 0.25, 4))} className="w-8 h-8 font-bold text-lg hover:text-[#2980f2] rounded-lg">+</button>
                            </div>
                        </div>

                        <div className="relative shadow-2xl mx-auto w-max" ref={pageContainerRef}>
                            {fileUrl && (
                                <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="p-32 flex flex-col items-center"><Loader2 className="animate-spin w-12 h-12 text-[#2980f2] mb-4" /></div>}>
                                    <Page pageNumber={currentPage} onLoadSuccess={onPageLoadSuccess} onRenderSuccess={onRenderSuccess} renderTextLayer={false} renderAnnotationLayer={false} className="border bg-white" scale={zoom} />
                                </Document>
                            )}
                            
                            {pdfDimensions.renderedWidth > 0 && (() => {
                                const renderScaleX = pdfDimensions.renderedWidth / pdfDimensions.originalWidth;
                                const renderScaleY = pdfDimensions.renderedHeight / pdfDimensions.originalHeight;
                                
                                return (
                                <div style={{width: pdfDimensions.renderedWidth, height: pdfDimensions.renderedHeight}} className="absolute top-0 left-0 pointer-events-none z-20">
                                    {signatures.filter(s => s.page === currentPage).map(el => (
                                        <Rnd
                                            key={el.id}
                                            bounds="parent"
                                            size={{ width: el.width * renderScaleX, height: el.height * renderScaleY }}
                                            position={{ x: el.x * renderScaleX, y: el.y * renderScaleY }}
                                            onDragStop={(e, d) => handleUpdateSignature(el.id, { x: d.x / renderScaleX, y: d.y / renderScaleY })}
                                            onResizeStop={(e, dir, ref, delta, position) => {
                                                handleUpdateSignature(el.id, {
                                                    width: parseInt(ref.style.width, 10) / renderScaleX,
                                                    height: parseInt(ref.style.height, 10) / renderScaleY,
                                                    x: position.x / renderScaleX,
                                                    y: position.y / renderScaleY
                                                });
                                            }}
                                            className="pointer-events-auto border-2 border-dashed border-[#2980f2]/50 hover:border-[#2980f2] rnd-signature cursor-move bg-black/5"
                                        >
                                            <div className="w-full h-full relative group flex items-center justify-center">
                                                <img src={el.base64Url} alt="Sign" className="w-full h-full object-fill pointer-events-none" />
                                                <div className="absolute -top-3 -right-3 bg-[#2980f2]/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg" onClick={() => handleRemoveSignature(el.id)}>&times;</div>
                                            </div>
                                        </Rnd>
                                    ))}
                                </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            ) : status === "uploading" ? (
                <div className="flex flex-col items-center mt-32 animate-in zoom-in">
                    <Loader2 className="w-24 h-24 animate-spin text-[#2980f2] mb-8" />
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">Carimbando Documentos...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center mt-20 p-16 bg-[#1e1e1e] rounded-[40px] shadow-2xl border animate-in flip-in-y">
                    <CheckCircle className="w-32 h-32 text-[#2980f2] mb-8 drop-shadow-lg" />
                    <h2 className="text-5xl font-sans font-extrabold text-white mb-6">Assinado com Sucesso!</h2>
                    <a href={downloadUrl!} download="Documento_Assinado.pdf" className="w-full min-w-[300px] bg-[#2980f2] text-white text-center font-semibold py-6 rounded-2xl text-2xl hover:opacity-90 shadow-xl flex items-center justify-center mb-6">
                        <Download className="w-7 h-7 mr-3" /> Baixar Documento
                    </a>
                </div>
            )}
            
            <SignatureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSignature} />
        </div>
    );
}
