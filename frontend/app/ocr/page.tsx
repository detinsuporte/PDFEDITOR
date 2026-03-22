"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, ScanText, CheckCircle, Loader2, Globe } from "lucide-react";
import axios from "axios";

const LOADING_MESSAGES = [
    "Inicializando AI Vision EasyOCR (PyTorch)...",
    "Rasterizando documento para matriz de pixels...",
    "Executando Tensor Neural nas áreas de texto...",
    "Extraindo caracteres do array e reconstruindo strings...",
    "Aguarde o Processador Neural finalizar os blocos...",
    "Copiando as detecções para Arquivo DOCX local..."
];

export default function OCR() {
    const [file, setFile] = useState<File | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [lang, setLang] = useState("por");
    const [loadingPhase, setLoadingPhase] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "uploading") {
            setLoadingPhase(0);
            interval = setInterval(() => {
                setLoadingPhase(prev => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsHovering(true); };
    const handleDragLeave = () => setIsHovering(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf" || droppedFile.type.startsWith("image/")) {
                setFile(droppedFile);
            }
        }
    };
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
    };

    const handleExtract = async () => {
        if (!file) return;
        setStatus("uploading");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("lang", lang);

        try {
            const response = await axios.post("http://localhost:8000/api/ocr", formData, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
            setDownloadUrl(url);

            const link = document.createElement("a");
            link.href = url;
            const filename = file.name.split('.')[0] || "arquivo";
            link.setAttribute("download", `Texto_Extraido_OCR_${filename}.docx`);
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
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 text-center mb-4 tracking-tight">Extrair Texto (OCR Avançado)</h2>
            <p className="text-[#33333B] dark:text-gray-300 text-lg text-center mb-10 max-w-2xl font-light">Tecnologia corporativa superior. Converta documentos não selecionáveis e imagens escaneadas em texto nativo DOCX usando Inteligência Artificial EasyOCR.</p>

            {!file ? (
                <div className="flex flex-col items-center w-full">
                    <div onClick={() => document.getElementById("fileInput")?.click()} className="w-full max-w-4xl h-[320px] bg-white dark:bg-[#1e1e1e] border-4 border-dashed border-purple-200 dark:border-purple-900/40 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all rounded-[30px] flex flex-col items-center justify-center cursor-pointer shadow-sm group">
                        <UploadCloud className="w-24 h-24 text-purple-300 dark:text-gray-500 group-hover:scale-110 group-hover:text-purple-500 transition-transform mb-6" />
                        <button className="bg-purple-600 tracking-wide hover:bg-purple-700 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-[0_4px_14px_0_rgba(147,51,234,0.39)] transition-transform transform hover:scale-105 pointer-events-none">
                            Selecione Imagem ou PDF Escaneado
                        </button>
                        <input type="file" id="fileInput" accept="image/*, application/pdf" className="hidden" onChange={onFileChange} />
                    </div>
                    <PrivacyBadge />
                </div>
            ) : status === 'idle' || status === 'error' ? (
                <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center transition-all">
                    {status === "idle" && (
                        <>
                            <ScanText className="text-purple-600 w-16 h-16 mb-4" />
                            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate max-w-full">{file!.name}</p>
                            
                            <div className="w-full mt-6 flex flex-col items-start bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><Globe className="w-4 h-4"/> Idioma do Documento Base:</label>
                                <select 
                                    value={lang} 
                                    onChange={(e) => setLang(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                                >
                                    <option value="por">Português (por)</option>
                                    <option value="eng">Inglês (eng)</option>
                                    <option value="spa">Espanhol (spa)</option>
                                    <option value="por+eng">Bilingue (Português/Inglês)</option>
                                </select>
                            </div>

                            <div className="mt-8 flex flex-col gap-4 w-full">
                                <button onClick={handleExtract} className="bg-purple-600 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 hover:bg-purple-700 w-full shadow-md transition-colors"><ScanText className="w-5 h-5" /> Extração Neural de Texto</button>
                                
                                <button onClick={handleReset} className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 px-8 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700">Descartar Documento</button>
                            </div>
                        </>
                    )}
                    {status === "uploading" && (
                        <div className="flex flex-col items-center w-full py-6">
                            <div className="relative mb-8 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 p-6 flex items-center justify-center">
                                <ScanText className="w-20 h-20 text-purple-600 animate-pulse" />
                            </div>
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
                            <span className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center">{LOADING_MESSAGES[loadingPhase]}</span>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full mt-6 overflow-hidden">
                                <div className="h-full bg-purple-500 transition-all duration-500" style={{width: `${(loadingPhase / (LOADING_MESSAGES.length - 1)) * 100}%`}}></div>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">Ações Tesseract costumam demandar pico de processador do servidor. Fatores de página e densidade implicam em atraso.</p>
                        </div>
                    )}
                </div>
            ) : null}
            
            {status === "success" && (
                <div className="flex flex-col items-center w-full max-w-2xl bg-white dark:bg-[#1e1e1e] p-12 rounded-3xl shadow-2xl border border-green-50 dark:border-green-900/30 mt-10">
                    <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                    <p className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 tracking-tight text-center">Transcrição Ótica Concluída!</p>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-center text-lg font-medium">Os pixels e manuscritos foram fielmente convertidos para edição nativa no DOCX.</p>
                    
                    <div className="flex flex-col md:flex-row gap-4 w-full px-4">
                        {downloadUrl && (
                            <a href={downloadUrl} download={`Texto_Extraido_OCR_${file?.name?.split('.')[0] || 'arquivo'}.docx`} className="flex-1 bg-[#1E1E1E] dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                                Baixar Arquivo Editável
                            </a>
                        )}
                        <button onClick={handleReset} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:-translate-y-1">
                            Carregar Outro
                        </button>
                    </div>
                </div>
            )}
            
            {status === "error" && (
                <div className="flex flex-col items-center bg-white dark:bg-[#1e1e1e] p-10 rounded-3xl shadow-xl mt-10 border border-gray-100 dark:border-gray-800">
                    <div className="text-red-500 font-bold mb-4 text-xl text-center">Fila Congestionada ou Erro Neural</div>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">Os modelos de Inteligência Artificial falharam em ler o seu documento. Ele pode estar muito grande ou o servidor PyTorch está efetuando download na primeira vez. Verifique o console do backend.</p>
                    <button onClick={handleReset} className="border-2 border-red-500 text-red-500 font-bold py-3 px-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20">Tentar Outra Vez</button>
                </div>
            )}
        </div>
    );
}
