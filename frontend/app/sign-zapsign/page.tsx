"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  CheckCircle,
  Loader2,
  PenSquare,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import axios from "axios";

type Status = "idle" | "uploading" | "waiting" | "success" | "error";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SignZapSignPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [signUrl, setSignUrl] = useState<string | null>(null);
  const [docToken, setDocToken] = useState<string | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pollStatus = useCallback(
    (token: string) => {
      intervalRef.current = setInterval(async () => {
        try {
          const { data } = await axios.get(
            `${API_BASE}/api/pdf/zapsign/status/${token}`
          );

          if (data.status === "signed" || data.status === "completed") {
            stopPolling();
            setStatus("success");
            setSignedPdfUrl(data.signed_url || null);
          } else if (data.status === "refused" || data.status === "rejected") {
            stopPolling();
            setStatus("error");
            setError("A assinatura foi recusada pelo signatário.");
          }
        } catch {
          // sem erro fatal aqui — a ZapSign pode demorar para atualizar
        }
      }, 5000); // verifica a cada 5 segundos
    },
    []
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.type === "application/pdf") setFile(dropped);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    setSignUrl(null);
    setSignedPdfUrl(null);
    stopPolling();

    try {
      const form = new FormData();
      form.append("pdf", file);

      const { data } = await axios.post(
        `${API_BASE}/api/pdf/zapsign/create`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (data.error) {
        setStatus("error");
        setError(data.error);
        return;
      }

      setSignUrl(data.sign_url);
      setDocToken(data.doc_token);
      setStatus("waiting");
      pollStatus(data.doc_token);
    } catch (err: unknown) {
      setStatus("error");
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Erro ao criar o documento. Tente novamente.";
      setError(msg);
    }
  };

  const handleReset = () => {
    stopPolling();
    setFile(null);
    setStatus("idle");
    setSignUrl(null);
    setDocToken(null);
    setSignedPdfUrl(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col items-center justify-center p-6">
      {/* Cabeçalho */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </span>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Assinar com Gov.br
          </h1>
        </div>
        <p className="text-slate-400 max-w-md">
          Envie seu PDF e assine digitalmente via plataforma ZapSign com
          certificação Gov.br — juridicamente válida.
        </p>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-xl bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-3xl p-8 shadow-2xl">

        {/* ── ESTADO IDLE / ARQUIVO SELECIONADO ── */}
        {(status === "idle" || (status !== "uploading" && !signUrl && status !== "success")) && (
          <>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById("pdf-input-zapsign")?.click()}
              className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-600 hover:border-emerald-500 rounded-2xl p-10 cursor-pointer transition-all duration-200 group bg-slate-900/30 hover:bg-slate-900/60"
            >
              <UploadCloud className="w-12 h-12 text-slate-500 group-hover:text-emerald-400 transition-colors mb-3" />
              <p className="text-slate-300 font-medium text-center">
                {file ? (
                  <span className="text-emerald-400">{file.name}</span>
                ) : (
                  <>
                    Arraste o PDF aqui ou{" "}
                    <span className="text-emerald-400 underline">clique para selecionar</span>
                  </>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">Somente arquivos .pdf</p>
              <input
                id="pdf-input-zapsign"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onFileChange}
              />
            </div>

            {/* Botão enviar */}
            <button
              onClick={handleSubmit}
              disabled={!file}
              className="mt-6 w-full py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-900/40"
            >
              <span className="flex items-center justify-center gap-2">
                <PenSquare className="w-5 h-5" />
                Iniciar Assinatura Gov.br
              </span>
            </button>
          </>
        )}

        {/* ── ESTADO UPLOADING ── */}
        {status === "uploading" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-slate-300 font-medium">Enviando e criando documento…</p>
          </div>
        )}

        {/* ── ESTADO WAITING ── */}
        {status === "waiting" && signUrl && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 text-amber-400">
              <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
              <p className="text-sm">Aguardando a assinatura ser concluída…</p>
            </div>

            <div className="bg-slate-900/70 rounded-2xl overflow-hidden border border-slate-700">
              <iframe
                src={signUrl}
                title="Portal de Assinatura ZapSign"
                className="w-full h-[540px]"
                allow="camera; microphone"
              />
            </div>

            <a
              href={signUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir portal em nova aba
            </a>

            {docToken && (
              <p className="text-xs text-slate-600 text-center">
                Token do documento: <code className="text-slate-500">{docToken}</code>
              </p>
            )}
          </div>
        )}

        {/* ── ESTADO SUCCESS ── */}
        {status === "success" && (
          <div className="flex flex-col items-center py-8 gap-5">
            <CheckCircle className="w-14 h-14 text-emerald-400" />
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Documento Assinado!</p>
              <p className="text-slate-400 text-sm mt-1">
                A assinatura Gov.br foi validada com sucesso.
              </p>
            </div>

            {signedPdfUrl ? (
              <a
                href={signedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Baixar PDF Assinado
              </a>
            ) : (
              <p className="text-slate-500 text-sm">
                O PDF assinado estará disponível no painel ZapSign.
              </p>
            )}

            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Assinar outro documento
            </button>
          </div>
        )}

        {/* ── ESTADO ERROR ── */}
        {status === "error" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-300 text-center font-medium">
              {error || "Ocorreu um erro inesperado."}
            </p>
            <button
              onClick={handleReset}
              className="mt-2 px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-all"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Rodapé informativo */}
      <p className="mt-8 text-xs text-slate-600 text-center max-w-md">
        A assinatura utiliza a plataforma{" "}
        <span className="text-slate-500">ZapSign</span> com autenticação
        Gov.br (ICP-Brasil). Juridicamente equivalente à assinatura manuscrita.
      </p>
    </div>
  );
}
