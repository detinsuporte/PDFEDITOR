"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ImageDown, Upload, Loader2, CheckCircle2, ChevronLeft, FileImage } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Format = "png" | "jpg";

export default function PdfToImagePage() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [format, setFormat] = useState<Format>("png");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("imagens.zip");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleConvert() {
    if (!pdf) return;
    setLoading(true);
    setDone(false);

    const formData = new FormData();
    formData.append("pdf", pdf);
    formData.append("format", format);

    const promise = axios.post(`${API}/api/pdf/to-image`, formData, {
      responseType: "blob",
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.promise(promise, {
      loading: "Renderizando páginas em alta resolução...",
      success: (res) => {
        const contentType: string = res.headers["content-type"] ?? "";
        const isZip = contentType.includes("zip");
        const base = pdf.name.replace(/\.pdf$/i, "");
        const fileName = isZip ? `${base}_imagens.zip` : `${base}.${format}`;

        const blob = new Blob([res.data], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();

        setDownloadUrl(url);
        setDownloadName(fileName);
        setDone(true);
        setLoading(false);
        return isZip
          ? `ZIP com todas as páginas gerado! (${fileName})`
          : `Imagem ${format.toUpperCase()} gerada com sucesso!`;
      },
      error: () => {
        setLoading(false);
        return "Erro ao converter o PDF para imagem.";
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
          <ImageDown className="w-10 h-10 text-[#2980f2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          PDF para Imagem
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm max-w-sm">
          Converta cada página do PDF em{" "}
          <strong>PNG de alta qualidade</strong> ou <strong>JPG compacto</strong>.
          Múltiplas páginas serão empacotadas em ZIP.
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
                <FileImage className="w-8 h-8 text-[#2980f2]/70" />
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
                  onChange={(e) => { setPdf(e.target.files?.[0] ?? null); setDone(false); }}
                />
              </label>
            </div>

            {/* Seletor de Formato */}
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Formato de saída
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["png", "jpg"] as Format[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex flex-col items-center gap-2 py-4 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                      format === f
                        ? "border-[#2980f2] bg-[#2980f2]/10 text-[#2980f2] dark:bg-[#2980f2]/20"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-[#2980f2]/50"
                    }`}
                  >
                    <ImageDown className="w-6 h-6" />
                    {f === "png" ? (
                      <>
                        <span>.PNG</span>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Alta qualidade · Transparência</span>
                      </>
                    ) : (
                      <>
                        <span>.JPG</span>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Menor tamanho · Fundo branco</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão */}
            <button
              onClick={handleConvert}
              disabled={!pdf || loading}
              className="w-full flex items-center justify-center gap-2 bg-[#2980f2] hover:bg-[#2162c0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Renderizando páginas…
                </>
              ) : (
                <>
                  <ImageDown className="w-5 h-5" />
                  Converter PDF para Imagem
                </>
              )}
            </button>
          </>
        ) : (
          /* Sucesso */
          <div className="flex flex-col items-center gap-5 py-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                Imagens geradas com sucesso!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                Renderizado em 300 DPI — qualidade profissional.
              </p>
            </div>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadName}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
              >
                <Upload className="w-5 h-5 rotate-180" />
                Baixar {downloadName}
              </a>
            )}
            <button onClick={reset} className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
              Converter outro PDF
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Renderização local — sem envio para terceiros.
        </p>
      </div>
    </div>
  );
}
