"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FileCheck2, Upload, Loader2, CheckCircle2, ChevronLeft, Shield, Archive } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ToPdfAPage() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleConvert() {
    if (!pdf) return;
    setConverting(true);
    setDone(false);

    const formData = new FormData();
    formData.append("file", pdf);

    const promise = axios.post(`${API}/api/pdf/to-pdfa`, formData, {
      responseType: "blob",
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.promise(promise, {
      loading: "Embutindo fontes e sanitizando documento (Padrão PDF/A)...",
      success: (res) => {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pdf.name.replace(/\.pdf$/i, "")}_pdfa.pdf`;
        a.click();
        setDownloadUrl(url);
        setDone(true);
        setConverting(false);
        return "PDF/A gerado com sucesso! Download iniciado.";
      },
      error: (err) => {
        setConverting(false);
        const msg = axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : "Erro ao converter para PDF/A.";
        return msg;
      },
    });
  }

  function reset() {
    setPdf(null);
    setDone(false);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 bg-transparent">
      {/* Back */}
      <div className="w-full max-w-2xl mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#2980f2] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar às Ferramentas
        </Link>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="bg-[#2980f2]/10 dark:bg-[#2980f2]/20 rounded-full p-4 mb-4">
          <FileCheck2 className="w-10 h-10 text-[#2980f2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Converter para PDF/A
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm max-w-sm">
          Torne seus documentos compatíveis com o{" "}
          <strong>PJe e arquivamento de longo prazo</strong> (ISO 19005 — PDF/A-2b).
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-8 space-y-6">

        {!done ? (
          <>
            {/* Dropzone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Arquivo PDF para converter
              </label>
              <label className="flex flex-col items-center justify-center gap-3 cursor-pointer border-2 border-dashed border-[#2980f2]/50 rounded-xl px-6 py-10 hover:border-[#2980f2] hover:bg-[#2980f2]/5 transition-all">
                <Upload className="w-8 h-8 text-[#2980f2]/70" />
                <span className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  {pdf ? (
                    <span className="text-[#2980f2] font-semibold">{pdf.name}</span>
                  ) : (
                    <>
                      <span className="font-semibold text-[#2980f2]">Clique para selecionar</span>{" "}
                      ou arraste um PDF aqui
                    </>
                  )}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    setPdf(e.target.files?.[0] ?? null);
                    setDone(false);
                  }}
                />
              </label>
            </div>

            {/* Badges de conformidade */}
            <div className="flex flex-wrap gap-2">
              {["ISO 19005-2", "PDF/A-2b", "PJe Tribunal", "Arquivamento 100 anos"].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-[#2980f2]/10 text-[#2980f2] dark:bg-[#2980f2]/20"
                >
                  <Shield className="w-3 h-3" />
                  {b}
                </span>
              ))}
            </div>

            {/* Botão */}
            <button
              onClick={handleConvert}
              disabled={!pdf || converting}
              className="w-full flex items-center justify-center gap-2 bg-[#2980f2] hover:bg-[#2162c0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
            >
              {converting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Convertendo para PDF/A…
                </>
              ) : (
                <>
                  <FileCheck2 className="w-5 h-5" />
                  Converter para PDF/A
                </>
              )}
            </button>
          </>
        ) : (
          /* Tela de sucesso */
          <div className="flex flex-col items-center gap-5 py-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                PDF/A gerado com sucesso!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                Documento compatível com ISO 19005-2 (PDF/A-2b) — aceito pelo PJe e órgãos oficiais.
              </p>
            </div>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`${pdf?.name?.replace(/\.pdf$/i, "") ?? "documento"}_pdfa.pdf`}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
              >
                <Archive className="w-5 h-5" />
                Baixar PDF/A
              </a>
            )}
            <button onClick={reset} className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
              Converter outro documento
            </button>
          </div>
        )}

        {/* Footer de segurança */}
        <p className="text-center text-xs text-slate-400 pt-2">
          Conversão realizada localmente no servidor — sem envio para terceiros.
        </p>
      </div>
    </div>
  );
}
