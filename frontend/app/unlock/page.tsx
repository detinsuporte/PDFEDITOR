"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle, Loader2, Unlock, Eye, EyeOff, Download, AlertTriangle } from "lucide-react";
import axios from "axios";
import PrivacyBadge from "../components/PrivacyBadge";

export default function UnlockPDF() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus("idle");
            setErrorMsg("");
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        if (!password) { setErrorMsg("Forneça a senha para destravar o arquivo."); return; }
        
        setErrorMsg("");
        setStatus("uploading");
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("password", password);

        try {
            const response = await axios.post("http://localhost:8000/api/pdf/decrypt", formData, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            setDownloadUrl(url);
            setStatus("success");
            setPassword("");
            
        } catch (error: any) {
            setStatus("error");
            if (error.response?.status === 401) {
                setErrorMsg("Senha Inválida! Acesso Negado pelo Motor de Autenticação.");
            } else {
                setErrorMsg("Houve um problema de servidor ao decodificar. (Um arquivo pode não estar protegido, ou está corrompido).");
            }
            setPassword("");
        }
    };

    const handleReset = () => {
        setFile(null); setPassword(""); setStatus("idle"); setDownloadUrl(null); setErrorMsg("");
    };

    return (
        <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#121212] flex flex-col pt-24 pb-12 px-4 items-center font-sans tracking-tight transition-colors">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 mb-3 flex items-center gap-3">
                <Unlock className="w-10 h-10 text-green-500" /> Desbloquear PDF
            </h1>
            <p className="text-lg text-[#33333B] dark:text-gray-300 font-light mb-10 text-center max-w-2xl text-opacity-80">
                Remova senhas e restrições de segurança padrão de PDFs de forma rápida e segura na nuvem.
            </p>

            {!file ? (
                <div className="flex flex-col items-center w-full">
                    <div onClick={() => document.getElementById("fileInput")?.click()} className="w-full max-w-4xl h-[320px] bg-white dark:bg-[#1e1e1e] border-4 border-dashed border-green-200 dark:border-green-900/40 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all rounded-[30px] flex flex-col items-center justify-center cursor-pointer shadow-sm group">
                        <UploadCloud className="w-24 h-24 text-green-300 dark:text-gray-500 group-hover:scale-110 group-hover:text-green-500 transition-transform mb-6" />
                        <button className="bg-green-600 tracking-wide hover:bg-green-700 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] transition-transform transform hover:scale-105 pointer-events-none">
                            Selecione o Arquivo Bloqueado
                        </button>
                        <input type="file" id="fileInput" accept="application/pdf" className="hidden" onChange={onFileChange} />
                    </div>
                    <PrivacyBadge />
                </div>
            ) : status === "idle" || status === "error" ? (
                <div className="bg-white dark:bg-[#1e1e1e] p-10 rounded-[30px] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center w-full max-w-xl animate-in fade-in zoom-in-95">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <Unlock className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 truncate max-w-full" title={file.name}>{file.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm uppercase tracking-widest font-bold">Arquivo Travado</p>

                    {errorMsg && (
                        <div className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 border border-red-200 dark:border-red-800 rounded-xl mb-6 flex flex-col items-center gap-2 font-medium">
                            <AlertTriangle className="w-6 h-6" />
                            <span className="text-center">{errorMsg}</span>
                        </div>
                    )}

                    <div className="w-full space-y-5">
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1">Senha de Autorização</label>
                            <div className="relative">
                                <input 
                                    type={showPw ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Digite a senha original do arquivo..."
                                    className="w-full py-4 px-5 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121212] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                                    {showPw ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                                </button>
                            </div>
                        </div>

                        <button onClick={handleProcess} className="w-full min-w-[300px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] transition-transform transform hover:-translate-y-1 mt-6">
                            <Unlock className="w-5 h-5"/> Autorizar e Destrancar
                        </button>
                        
                        <button onClick={handleReset} className="w-full py-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-bold transition">
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : status === "uploading" ? (
                <div className="flex flex-col items-center mt-20 animate-in zoom-in">
                    <Loader2 className="w-20 h-20 animate-spin text-green-500 mb-8" />
                    <span className="text-3xl font-extrabold text-[#33333B] dark:text-white">Autenticando Permissões...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center mt-10 p-12 bg-white dark:bg-[#1e1e1e] rounded-[40px] shadow-2xl border animate-in slide-in-from-bottom-5">
                    <CheckCircle className="w-24 h-24 text-green-500 mb-6 drop-shadow-md" />
                    <h2 className="text-3xl font-extrabold text-[#33333B] dark:text-white mb-4">Desbloqueado com Sucesso!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md text-center">
                        Senhas embutidas foram completamente expurgadas da árvore binária. O PDF agora está livre e limpo.
                    </p>
                    <a href={downloadUrl!} download={`Desbloqueado_${file.name}`} className="w-full bg-green-600 text-white text-center font-bold py-5 rounded-2xl text-xl hover:bg-green-700 shadow-xl flex items-center justify-center mb-4 transition-transform hover:-translate-y-1">
                        <Download className="w-6 h-6 mr-3" /> Baixar PDF Livre
                    </a>
                    <button onClick={handleReset} className="w-full py-4 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-gray-200 transition">
                        Destrancar Novo Arquivo
                    </button>
                </div>
            )}
        </div>
    );
}
