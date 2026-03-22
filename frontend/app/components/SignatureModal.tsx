"use client";
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, UploadCloud, Eraser, Check } from 'lucide-react';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (base64Url: string) => void;
}

export default function SignatureModal({ isOpen, onClose, onSave }: SignatureModalProps) {
    const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
    const [penColor, setPenColor] = useState<string>('#1e3a8a');
    const sigCanvas = useRef<SignatureCanvas>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleClear = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
    };

    const handleSaveDraw = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            let dataUrl = "";
            try {
                dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            } catch (e) {
                console.error("Trim failed, using raw canvas:", e);
                dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
            }
            onSave(dataUrl);
            onClose();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (eve) => {
                if (eve.target?.result) {
                    onSave(eve.target.result.toString());
                    onClose();
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Assinar Documento</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex w-full bg-gray-50 dark:bg-[#121212] p-2">
                    <button 
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'draw' ? 'bg-white dark:bg-[#252525] shadow-sm text-[#2980f2] dark:text-[#2980f2]' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        onClick={() => setActiveTab('draw')}
                    >
                        Criar Desenho
                    </button>
                    <button 
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'upload' ? 'bg-white dark:bg-[#252525] shadow-sm text-[#2980f2] dark:text-[#2980f2]' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        Upload de Imagem
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'draw' ? (
                        <div className="flex flex-col items-center">
                            <div className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl relative cursor-crosshair overflow-hidden">
                                <SignatureCanvas 
                                    ref={sigCanvas}
                                    penColor={penColor}
                                    canvasProps={{ className: 'w-full h-full absolute top-0 left-0' }}
                                    velocityFilterWeight={0.7}
                                    minWidth={1.5}
                                    maxWidth={3}
                                />
                                <div className="absolute bottom-3 left-3 text-xs text-gray-400 font-medium pointer-events-none select-none">Assine suavemente no quadro...</div>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full mt-4 bg-gray-50 dark:bg-[#121212] p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 pl-2">Cor da Tinta:</span>
                                <div className="flex gap-2">
                                    {['#000000', '#1e3a8a', '#dc2626', '#16a34a'].map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => setPenColor(c)}
                                            className={`w-7 h-7 rounded-full border-2 transition-all shadow-sm ${penColor === c ? 'scale-110 border-gray-400 dark:border-gray-500 shadow-md ring-2 ring-gray-200 dark:ring-gray-700' : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'}`}
                                            style={{ backgroundColor: c }}
                                            title={`Escolher cor ${c}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between w-full mt-5">
                                <button onClick={handleClear} className="flex items-center gap-2 text-gray-500 hover:text-[#2980f2] font-bold px-4 py-2 rounded-xl hover:bg-[#2980f2]/5 dark:hover:bg-[#2980f2]/10 transition-colors">
                                    <Eraser className="w-4 h-4" /> Recomeçar
                                </button>
                                <button onClick={handleSaveDraw} className="flex items-center gap-2 bg-[#2980f2] hover:bg-[#2980f2]/90 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform">
                                    <Check className="w-4 h-4" /> Aplicar Assinatura
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-48 border-2 border-dashed border-[#2980f2]/50 hover:border-[#2980f2]/50 bg-[#2980f2]/5 hover:bg-blue-100 dark:bg-[#2980f2]/10 dark:border-blue-700 dark:hover:bg-[#2980f2]/10 rounded-2xl transition-colors cursor-pointer flex flex-col items-center justify-center group"
                            >
                                <UploadCloud className="w-12 h-12 text-blue-400 group-hover:text-[#2980f2] mb-3 transition-colors" />
                                <span className="text-gray-600 dark:text-gray-300 font-medium group-hover:text-gray-800 dark:group-hover:text-gray-100">Upload Imagem PNG (Fundo Transparente)</span>
                                <input type="file" accept="image/png" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
