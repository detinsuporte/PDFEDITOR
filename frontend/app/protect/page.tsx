"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle, Loader2, Lock, Eye, EyeOff, Download } from "lucide-react";
import axios from "axios";
import PrivacyBadge from "../components/PrivacyBadge";

export default function ProtectPDF() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
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
        if (!password) { setErrorMsg("A senha não pode estar vazia."); return; }
        if (password !== confirm) { setErrorMsg("As senhas não coincidem. Verifique a digitação."); return; }
        
        setErrorMsg("");
        setStatus("uploading");
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("password", password);

        try {
            const response = await axios.post("http://localhost:8000/api/pdf/encrypt", formData, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            setDownloadUrl(url);
            setStatus("success");
            setPassword(""); setConfirm("");
            
        } catch (error: any) {
            setStatus("error");
            setErrorMsg("Houve um problema de servidor ao aplicar a Criptografia AES.");
            setPassword(""); setConfirm("");
        }
    };

    const handleReset = () => {
        setFile(null); setPassword(""); setConfirm(""); setStatus("idle"); setDownloadUrl(null); setErrorMsg("");
    };

    return (
        <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#121212] flex flex-col pt-24 pb-12 px-4 items-center font-sans tracking-tight transition-colors">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#33333B] dark:text-gray-100 mb-3 flex items-center gap-3">
                <Lock className="w-10 h-10 text-red-500" /> Proteger PDF
            </h1>
            <p className="text-lg text-[#33333B] dark:text-gray-300 font-light mb-10 text-center max-w-2xl text-opacity-80">
                Proteja seus documentos sensíveis com Criptografia de Nível Militar (AES-256). Prevenção visual e confidencial.
            </p>

            {!file ? (
                <div className="flex flex-col items-center w-full">
                    <div onClick={() => document.getElementById("fileInput")?.click()} className="w-full max-w-4xl h-[320px] bg-white dark:bg-[#1e1e1e] border-4 border-dashed border-red-200 dark:border-red-900/40 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all rounded-[30px] flex flex-col items-center justify-center cursor-pointer shadow-sm group">
                        <UploadCloud className="w-24 h-24 text-red-300 dark:text-gray-500 group-hover:scale-110 group-hover:text-red-500 transition-transform mb-6" />
                        <button className="bg-red-600 tracking-wide hover:bg-red-700 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] transition-transform transform hover:scale-105 pointer-events-none">
                            Selecione o PDF para Trancar
                        </button>
                        <input type="file" id="fileInput" accept="application/pdf" className="hidden" onChange={onFileChange} />
                    </div>
                    <PrivacyBadge />
                </div>
            ) : status === "idle" || status === "error" ? (
                <div className="bg-white dark:bg-[#1e1e1e] p-10 rounded-[30px] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center w-full max-w-xl animate-in fade-in zoom-in-95">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 truncate max-w-full" title={file.name}>{file.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm uppercase tracking-widest font-bold">Arquivo Pronto para Ser Trancado</p>

                    {errorMsg && (
                        <div className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 border border-red-200 dark:border-red-800 rounded-xl mb-6 text-center font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <div className="w-full space-y-5">
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1">Senha de Proteção</label>
                            <div className="relative">
                                <input 
                                    type={showPw ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Digite a senha desejada..."
                                    className="w-full py-4 px-5 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121212] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                                    {showPw ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1">Confirmar Senha</label>
                            <input 
                                type={showPw ? "text" : "password"} 
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Repita a senha..."
                                className="w-full py-4 px-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121212] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                            />
                        </div>

                        <button onClick={handleProcess} className="w-full min-w-[300px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] transition-transform transform hover:-translate-y-1 mt-6">
                            <Lock className="w-5 h-5"/> Encriptar Documento (AES)
                        </button>
                        
                        <button onClick={handleReset} className="w-full py-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-bold transition">
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : status === "uploading" ? (
                <div className="flex flex-col items-center mt-20 animate-in zoom-in">
                    <Loader2 className="w-20 h-20 animate-spin text-red-500 mb-8" />
                    <span className="text-3xl font-extrabold text-[#33333B] dark:text-white">Aplicando Blindagem AES-256...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center mt-10 p-12 bg-white dark:bg-[#1e1e1e] rounded-[40px] shadow-2xl border animate-in slide-in-from-bottom-5">
                    <CheckCircle className="w-24 h-24 text-green-500 mb-6 drop-shadow-md" />
                    <h2 className="text-3xl font-extrabold text-[#33333B] dark:text-white mb-4">Arquivo Trancado com Sucesso!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md text-center">
                        Seu PDF agora está ilegível para qualquer pessoa que não possua a senha estipulada.
                    </p>
                    <a href={downloadUrl!} download={`Protegido_${file.name}`} className="w-full bg-red-600 text-white text-center font-bold py-5 rounded-2xl text-xl hover:bg-red-700 shadow-xl flex items-center justify-center mb-4 transition-transform hover:-translate-y-1">
                        <Download className="w-6 h-6 mr-3" /> Baixar PDF Bloqueado
                    </a>
                    <button onClick={handleReset} className="w-full py-4 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-gray-200 transition">
                        Proteger Novo Arquivo
                    </button>
                </div>
            )}
        </div>
    );
}
