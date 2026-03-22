"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle, Loader2, Plus, Download, RefreshCw } from "lucide-react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker configuration safer for react-pdf 7 and Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface TextElement {
    id: string;
    text: string;
    page: number; // 1-indexed
    x: number; // css x local screen
    y: number; // css y local screen
    font_size: number; // in pt
    font_family: string;
    hex_color: string;
}

export default function AddText() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [zoom, setZoom] = useState<number>(1);
    
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    
    const [textElements, setTextElements] = useState<TextElement[]>([]);
    
    // Dimensões da página
    const [pdfDimensions, setPdfDimensions] = useState({ originalWidth: 0, originalHeight: 0, renderedWidth: 0, renderedHeight: 0 });
    const pageContainerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Variáveis locais para Drag-to-Scroll (Pan) - Vanilla JS
    useEffect(() => {
        const slider = scrollContainerRef.current;
        if (!slider) return;

        let isDown = false;
        let startX = 0;
        let startY = 0;
        let scrollLeft = 0;
        let scrollTop = 0;

        const mouseDown = (e: MouseEvent) => {
            // Ignorar se clicou na caixa de texto (react-rnd/draggable) ou botão
            if ((e.target as HTMLElement).closest('.group') || (e.target as HTMLElement).closest('button')) return;
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            startY = e.pageY - slider.offsetTop;
            scrollLeft = slider.scrollLeft;
            scrollTop = slider.scrollTop;
        };

        const mouseLeave = () => {
            isDown = false;
            slider.style.cursor = 'grab';
        };

        const mouseUp = () => {
            isDown = false;
            slider.style.cursor = 'grab';
        };

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

    const handleAddTextElement = () => {
        const renderScaleX = pdfDimensions.originalWidth ? (pdfDimensions.renderedWidth / pdfDimensions.originalWidth) : 1;
        const renderScaleY = pdfDimensions.originalHeight ? (pdfDimensions.renderedHeight / pdfDimensions.originalHeight) : 1;
        
        const newEl: TextElement = {
            id: Date.now().toString(),
            text: "Texto Personalizado",
            page: currentPage,
            x: 50 / renderScaleX,
            y: 50 / renderScaleY,
            font_size: 24,
            font_family: "Helvetica",
            hex_color: "#e5322d" // pdfred by default
        };
        setTextElements([...textElements, newEl]);
    };

    const handleUpdateElement = (id: string, updates: Partial<TextElement>) => {
        setTextElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const handleRemoveElement = (id: string) => {
        setTextElements(prev => prev.filter(el => el.id !== id));
    };

    // Callback de Documento LIDO
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    // Callback de Pagina Renderizada: Essencial para NORMALIZAÇÃO de Coordenadas
    const onPageLoadSuccess = (page: any) => {
        // Obter dimensões originais do PDF (em points, padrao 72 PPI)
        const viewport = page.getViewport({ scale: 1 });
        
        // Atualizar dimensões renderizadas baseado no elemento HTML
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
    
    // Recalcular no redimensionamento da janela pra não quebrar a escala
    useEffect(() => {
        const handleResize = () => {
            if (pageContainerRef.current && pdfDimensions.originalWidth > 0) {
                const rect = pageContainerRef.current.getBoundingClientRect();
                setPdfDimensions(prev => ({
                    ...prev,
                    renderedWidth: rect.width,
                    renderedHeight: rect.height
                }));
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [pdfDimensions]);

    const handleProcess = async () => {
        if (!file) return;

        setStatus("uploading");
        setUploadProgress(0);

        // --- NORMALIZAÇÃO DE COORDENADAS ---
        // Agora os elementos já são armazenados na base original do PDF.
        // Mapeia para o backend ajustando apenas a ancora Y (baseline do PyMuPDF)
        
        const normalizedElements = textElements.map(el => ({
            ...el,
            y: el.y + (el.font_size * 0.75) 
        }));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("text_elements", JSON.stringify(normalizedElements));

        try {
            const response = await axios.post("http://localhost:8000/api/pdf/add-text", formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                },
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            setDownloadUrl(url);
            setStatus("success");
            
        } catch (error) {
            console.error("Erro processando PDF:", error);
            setStatus("error");
        }
    };

    const handleReset = () => {
        setFile(null);
        setFileUrl(null);
        setTextElements([]);
        setStatus("idle");
        setDownloadUrl(null);
        setCurrentPage(1);
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col pt-24 pb-12 px-4 items-center font-sans tracking-tight transition-colors">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 mb-3">Edição Visual de PDF</h1>
            <p className="text-lg text-[#33333B] dark:text-gray-300 font-light mb-10 text-center max-w-2xl text-opacity-80">
                Arraste, solte e edite caixas de texto diretamente sobre o documento. Desenhamos blocos definitivos mantendo o vetor original do seu arquivo.
            </p>

            {!fileUrl ? (
                <div onClick={() => document.getElementById("fileInput")?.click()} 
                    className="w-full max-w-4xl h-[320px] bg-white dark:bg-[#1e1e1e] border-4 border-dashed border-[#2980f2]/30 dark:border-[#2980f2]/50 hover:border-[#2980f2] hover:bg-[#2980f2]/5 dark:hover:bg-[#2980f2]/10 transition-all rounded-[30px] flex flex-col items-center justify-center cursor-pointer relative shadow-sm group">
                    <UploadCloud className="w-24 h-24 text-gray-400 dark:text-gray-500 group-hover:scale-110 group-hover:text-[#2980f2] dark:group-hover:text-red-400 transition-transform mb-6" />
                    <button className="bg-[#2980f2] tracking-wide hover:bg-[#2980f2]/90 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-lg transition-transform transform hover:scale-105 pointer-events-none">
                        Visualizar e Editar PDF
                    </button>
                    <input type="file" id="fileInput" accept="application/pdf" className="hidden" onChange={onFileChange} />
                </div>
            ) : status === "idle" ? (
                <div className="w-full flex flex-col xl:flex-row gap-8 max-w-7xl relative mx-auto items-stretch">
                    
                    {/* MENU LATERAL FERRAMENTAS */}
                    <div className="w-full xl:w-[350px] bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-6 h-fit shrink-0 relative z-10 sticky top-24">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-extrabold text-xl text-[#33333B] dark:text-gray-100">Layer de Textos</h3>
                            <button onClick={handleAddTextElement} className="bg-[#2980f2]/5 dark:bg-[#2980f2]/10 text-[#2980f2] dark:text-[#2980f2] hover:bg-[#2980f2] dark:hover:bg-[#2980f2] hover:text-white dark:hover:text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center transition-colors shadow-sm">
                                <Plus className="w-5 h-5 mr-1" /> Add Texto
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] xl:max-h-[600px] scrollbar-thin rounded">
                            {textElements.length === 0 && (
                                <div className="flex flex-col items-center justify-center text-center py-12 px-4 opacity-50">
                                    <div className="border border-dashed dark:border-gray-700 p-4 rounded-xl mb-3">
                                        <Plus className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Nenhum texto na camada do documento. Adicione um para começar.</p>
                                </div>
                            )}
                            
                            {textElements.map((el, i) => (
                                <div key={el.id} className="bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 group relative overflow-hidden transition hover:shadow-md animate-in slide-in-from-left max-w-full">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#2980f2]"></div>

                                    <div className="flex justify-between items-center ml-2">
                                        <span className="font-bold text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Box #{i+1}</span>
                                        <button onClick={() => handleRemoveElement(el.id)} className="text-red-400 hover:text-[#2980f2] text-xs font-bold px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg opacity-80 group-hover:opacity-100 transition">Excluir</button>
                                    </div>

                                    <div className="ml-2">
                                        <textarea 
                                            value={el.text} 
                                            onChange={(e) => handleUpdateElement(el.id, {text: e.target.value})} 
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            rows={Math.max(1, el.text.split('\n').length)}
                                            className="w-full p-3 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 border-b-2 focus:border-b-blue-500 outline-none text-sm font-bold text-gray-800 dark:text-gray-100 shadow-inner resize-none overflow-hidden" 
                                            placeholder="Digite o texto (Shift+Enter para quebra)" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 ml-2 mt-2">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Fonte</label>
                                            <select value={el.font_family} onChange={(e) => handleUpdateElement(el.id, {font_family: e.target.value})} className="w-full p-2 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 font-medium outline-none shadow-sm cursor-pointer">
                                                <option value="Helvetica">Helvetica</option>
                                                <option value="Arial">Arial</option>
                                                <option value="Courier">Courier</option>
                                                <option value="Times">Times</option>
                                            </select>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Estilo (pt/cor)</label>
                                            <div className="flex h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-[#252525] shadow-sm">
                                                <input type="number" min={8} value={el.font_size} onChange={(e) => handleUpdateElement(el.id, {font_size: Number(e.target.value)})} className="w-12 h-full p-0 text-center text-sm font-bold text-gray-700 dark:text-gray-200 border-none outline-none ring-0 appearance-none bg-transparent" />
                                                <div className="w-px bg-gray-200 dark:bg-gray-700 h-full"></div>
                                                <input type="color" value={el.hex_color} onChange={(e) => handleUpdateElement(el.id, {hex_color: e.target.value})} className="flex-1 h-full cursor-pointer p-0 border-none outline-none appearance-none" style={{ background: "transparent" }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-2 mt-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <span className="text-xs text-gray-500 font-bold w-full">Pg. Alvo:</span>
                                        <input type="number" min={1} max={numPages} value={el.page} onChange={(e) => handleUpdateElement(el.id, {page: Number(e.target.value)})} className="p-1 border border-gray-200 dark:border-gray-600 font-bold bg-gray-50 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 text-sm w-12 rounded-lg text-center shadow-inner outline-none focus:ring-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                            <button onClick={handleProcess} className="w-full flex items-center justify-center gap-2 bg-[#2980f2] hover:bg-[#2980f2]/90 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 mt-2">
                                <CheckCircle className="w-5 h-5"/> Processar e Baixar PDF
                            </button>
                            <button onClick={handleReset} className="w-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-[#33333B] dark:text-gray-200 font-bold py-3 rounded-xl transition border border-gray-200 dark:border-gray-700 shadow-sm">
                                Remover Arquivo
                            </button>
                        </div>
                    </div>

                    {/* CANVAS DE EDICAO VISUAL DO PDF */}
                    <div 
                        className="flex-1 bg-[#F9FAFB] dark:bg-[#0a0a0a] rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 lg:p-6 block overflow-auto relative w-full lg:min-w-[700px] cursor-grab"
                        ref={scrollContainerRef}
                    >
                        
                        {/* Controles de Paginas e Zoom */}
                        <div className="flex justify-between items-center w-full max-w-3xl mb-6 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-3 rounded-2xl shadow-sm mx-auto sticky left-0 top-0 z-50">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage <= 1} className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700">
                                    Anterior
                                </button>
                                <span className="font-extrabold text-[#33333B] dark:text-gray-100 px-2">{currentPage} / {numPages}</span>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))} disabled={currentPage >= numPages} className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700">
                                    Próxima
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="w-8 h-8 flex items-center justify-center font-bold text-lg text-gray-700 dark:text-gray-300 hover:text-[#2980f2] transition hover:bg-[#2980f2]/5 dark:hover:bg-[#2980f2]/10 rounded-lg">-</button>
                                <span className="font-extrabold text-[#33333B] dark:text-gray-100 w-14 text-center text-sm">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(z => Math.min(z + 0.25, 4))} className="w-8 h-8 flex items-center justify-center font-bold text-lg text-gray-700 dark:text-gray-300 hover:text-[#2980f2] transition hover:bg-[#2980f2]/5 dark:hover:bg-[#2980f2]/10 rounded-lg">+</button>
                            </div>
                        </div>

                        {/* Rendering Dinamico */}
                        <div className="relative shadow-2xl rounded-sm transition-all duration-300 mx-auto w-max" ref={pageContainerRef}>
                            {fileUrl && (
                                <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="p-32 flex flex-col items-center"><Loader2 className="animate-spin w-12 h-12 text-[#2980f2] mb-4" /><span className="text-gray-500 font-bold">Processando vetores do PDF...</span></div>}>
                                    <Page 
                                        pageNumber={currentPage} 
                                        onLoadSuccess={onPageLoadSuccess}
                                        onRenderSuccess={onRenderSuccess}
                                        renderTextLayer={false} 
                                        renderAnnotationLayer={false}
                                        className="h-auto border border-gray-300 bg-white"
                                        scale={zoom}
                                    />
                                </Document>
                            )}
                            
                            {/* Overlay de Textos p/ a página atual */}
                            {pdfDimensions.renderedWidth > 0 && typeof window !== 'undefined' && (() => {
                                const renderScaleX = pdfDimensions.renderedWidth / pdfDimensions.originalWidth;
                                const renderScaleY = pdfDimensions.renderedHeight / pdfDimensions.originalHeight;
                                
                                return (
                                <div style={{width: pdfDimensions.renderedWidth, height: pdfDimensions.renderedHeight}} className="absolute top-0 left-0 overflow-hidden pointer-events-none z-20">
                                    {textElements.filter(el => el.page === currentPage).map(el => (
                                        <Rnd
                                            key={el.id}
                                            bounds="parent"
                                            size={{ width: "auto", height: "auto" }}
                                            position={{ x: el.x * renderScaleX, y: el.y * renderScaleY }}
                                            onDragStop={(e, d) => {
                                                // Salva a posicao arrastada de volta normalizada para a base do PDF
                                                handleUpdateElement(el.id, { x: d.x / renderScaleX, y: d.y / renderScaleY });
                                            }}
                                            enableResizing={false}
                                            className="pointer-events-auto border-2 border-dashed border-[#2980f2]/50 bg-[#2980f2]/5/20 backdrop-blur-[1px] cursor-move hover:border-blue-600 transition p-1 hover:shadow-lg rounded-sm group"
                                        >
                                            <div 
                                                style={{ 
                                                    fontFamily: el.font_family, 
                                                    fontSize: `${Math.max(10, el.font_size * renderScaleX)}px`, 
                                                    color: el.hex_color,
                                                    lineHeight: 1.2,
                                                    whiteSpace: 'pre',
                                                    userSelect: 'none',
                                                    fontWeight: 500,
                                                    textAlign: 'left'
                                                }}
                                            >
                                                {el.text}
                                            </div>
                                            <div className="absolute -top-3 -right-3 bg-[#2980f2]/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg" onClick={() => handleRemoveElement(el.id)}>
                                                &times;
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
                <div className="flex flex-col items-center mt-32 w-full max-w-xl animate-in zoom-in slide-in-from-bottom-5">
                    <Loader2 className="w-24 h-24 animate-spin text-[#2980f2] mb-8" />
                    <span className="text-4xl font-extrabold text-[#33333B] dark:text-gray-100 tracking-tight text-center">Injetando elementos vetoriais...</span>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 mb-8 text-center">Não feche esta página, processamento em andamento.</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-5 overflow-hidden shadow-inner border border-gray-300 dark:border-gray-700 p-1">
                        <div className="bg-[#2980f2] h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center mt-20 p-16 bg-white dark:bg-[#1e1e1e] rounded-[40px] shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 animate-in flip-in-y">
                    <CheckCircle className="w-32 h-32 text-[#2980f2] mb-8 drop-shadow-lg" />
                    <h2 className="text-5xl font-extrabold text-[#33333B] dark:text-gray-100 mb-6 text-center tracking-tight">Perfeito!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-12 text-center text-xl max-w-sm">
                        O texto foi mesclado ao documento nas coordenadas visuais exatas.
                    </p>
                    <button onClick={() => {
                        const link = document.createElement("a");
                        link.href = downloadUrl!;
                        link.setAttribute("download", "Documento_Editado_iLovePDF.pdf");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }} className="w-full max-w-sm bg-[#2980f2] text-white text-center font-bold py-6 rounded-2xl text-2xl hover:bg-[#2980f2]/90 transition shadow-lg flex items-center justify-center transform hover:-translate-y-1 mb-6">
                        <Download className="w-6 h-6 mr-3" /> Baixar PDF
                    </button>
                    <button onClick={handleReset} className="w-full max-w-sm text-gray-500 dark:text-gray-400 font-bold hover:text-gray-800 dark:hover:text-gray-200 transition py-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 mt-2 text-lg">
                        Começar de novo
                    </button>
                </div>
            )}
        </div>
    );
}
