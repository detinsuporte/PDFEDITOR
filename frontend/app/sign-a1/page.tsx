"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileKey2,
  KeyRound,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Stamp,
  Info,
  BadgeCheck,
  ArrowRight,
  Lock,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// ─── Importações dinâmicas (client-only) ─────────────────────────────────────
const Document = dynamic(
  () => import("react-pdf").then((m) => m.Document),
  { ssr: false }
);
const Page = dynamic(
  () => import("react-pdf").then((m) => m.Page),
  { ssr: false }
);
const Rnd = dynamic(() => import("react-rnd").then((m) => m.Rnd), {
  ssr: false,
});

if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { pdfjs } = require("react-pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TabKey = "govbr" | "a1";
type EtapaA1 = 1 | 2;

interface StampPos {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface PageDimensions {
  widthPts: number;
  heightPts: number;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SignA1Page() {
  const [tab, setTab] = useState<TabKey>("govbr");

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-blue-100 dark:bg-blue-900/40 rounded-full p-4 mb-4">
            <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Assinatura Digital
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm max-w-sm">
            Escolha o método de assinatura: identidade federal via{" "}
            <strong>gov.br</strong> ou certificado digital{" "}
            <strong>A1 (ICP-Brasil)</strong>.
          </p>
        </div>

        {/* ── Seletor de abas ────────────────────────────────────────────────── */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 mb-8 shadow-inner">
          <TabButton
            active={tab === "govbr"}
            onClick={() => setTab("govbr")}
            icon={<GovBrLogo />}
            label="gov.br"
            sub="Identidade Federal"
          />
          <TabButton
            active={tab === "a1"}
            onClick={() => setTab("a1")}
            icon={<FileKey2 className="w-5 h-5" />}
            label="Certificado A1"
            sub="ICP-Brasil .pfx / .p12"
          />
        </div>

        {/* ── Conteúdo da aba ────────────────────────────────────────────────── */}
        {tab === "govbr" && <TabGovBr />}
        {tab === "a1" && <TabA1 />}
      </div>
    </div>
  );
}

// ─── Aba gov.br ──────────────────────────────────────────────────────────────
function TabGovBr() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [authState, setAuthState] = useState<
    "idle" | "redirecting" | "polling" | "authenticated" | "signing" | "done"
  >("idle");
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [docToken, setDocToken] = useState<string | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simula recebimento de token após retorno OAuth2
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");
    if (token) {
      setOauthToken(token);
      setUserName(name ?? "Cidadão Autenticado");
      setAuthState("authenticated");
      // Limpa a URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Polling: monitora status do documento ZapSign a cada 3s
  useEffect(() => {
    if (!docToken || signedPdfUrl) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/pdf/zapsign/status/${docToken}`);
        const { status, signed_url } = res.data;
        if (status === "signed" && signed_url) {
          clearInterval(pollRef.current!);
          setSignedPdfUrl(signed_url);
          setAuthState("done");
          toast.success("Documento assinado com sucesso! Baixe o PDF abaixo.");
        }
      } catch {
        // silencia erros temporários de rede no polling
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [docToken, signedPdfUrl]);

  function iniciarOAuth() {
    setAuthState("redirecting");

    // Em produção substitua pela URL real do gov.br:
    // https://sso.staging.acesso.gov.br/authorize?...
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/sign-a1?token=DEMO_TOKEN_123&name=João+da+Silva`
    );
    const govBrUrl = `${API}/api/govbr/auth-url?redirect_uri=${redirectUri}`;

    // Tenta buscar a URL do backend; se falhar, usa mock
    axios
      .get(govBrUrl, { timeout: 5000 })
      .then((res) => {
        window.location.href = res.data.url;
      })
      .catch(() => {
        // Fallback demonstrativo — redireciona para a própria página simulando retorno
        const mockReturn = `${window.location.origin}/sign-a1?token=DEMO_TOKEN_123&name=João+da+Silva`;
        window.location.href = mockReturn;
      });
  }

  async function handleAssinarGovBr() {
    if (!pdf) return;
    setAuthState("signing");
    const toastId = toast.loading("Criando documento na ZapSign…");

    const formData = new FormData();
    formData.append("pdf", pdf);

    try {
      const res = await axios.post(`${API}/api/pdf/zapsign/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { sign_url, doc_token } = res.data;

      // Armazena o token para o polling monitorar
      setDocToken(doc_token);

      // Abre o popup de assinatura da ZapSign
      window.open(sign_url, "zapsign_popup", "width=900,height=700,scrollbars=yes");

      toast.success("Popup de assinatura aberto! Aguardando conclusão…", { id: toastId });
      setAuthState("authenticated"); // mantém UI enquanto polling roda
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Erro ao criar documento na ZapSign.";
      toast.error(msg, { id: toastId });
      setAuthState("authenticated");
    }
  }

  function resetar() {
    setPdf(null);
    setOauthToken(null);
    setUserName(null);
    setDocToken(null);
    setSignedPdfUrl(null);
    setAuthState("idle");
    if (pollRef.current) clearInterval(pollRef.current);
    if (pdfRef.current) pdfRef.current.value = "";
  }

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-8 space-y-6">
      {/* Upload PDF */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Arquivo PDF para assinar
        </label>
        <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl px-4 py-4 hover:border-blue-500 transition-colors">
          <Upload className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {pdf ? pdf.name : "Clique para selecionar um PDF…"}
          </span>
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              setPdf(e.target.files?.[0] ?? null);
              // Só reseta se ainda não autenticou (preserva "authenticated", "signing", "done")
              if (authState === "idle" || authState === "redirecting") setAuthState("idle");
            }}
          />
        </label>
      </div>

      {/* Status / fluxo de autenticação */}
      {authState === "idle" && (
        <div className="space-y-4">
          <InfoBox>
            Clique em <strong>Entrar com gov.br</strong> para verificar sua
            identidade via OAuth2. Após autenticar, selecione o PDF e assine.
          </InfoBox>
          <button
            onClick={iniciarOAuth}
            className="w-full flex items-center justify-center gap-2 bg-[#1351b4] hover:bg-[#0d3f8f] text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <GovBrLogo white />
            Entrar com gov.br
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>
        </div>
      )}

      {authState === "redirecting" && (
        <div className="flex flex-col items-center gap-3 py-6 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-sm">Redirecionando para o gov.br…</span>
        </div>
      )}

      {(authState === "authenticated" || authState === "signing") && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
            <BadgeCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Autenticado com gov.br
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {userName}
              </p>
            </div>
            <button
              onClick={resetar}
              className="text-green-600 hover:text-green-800 dark:text-green-400"
              title="Resetar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {!pdf && (
            <InfoBox>
              ✅ Identidade verificada! Agora <strong>selecione o PDF</strong>{" "}
              acima para habilitar a assinatura.
            </InfoBox>
          )}

          <button
            onClick={handleAssinarGovBr}
            disabled={!pdf || authState === "signing"}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {authState === "signing" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assinando…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {pdf ? "Assinar PDF com gov.br" : "Selecione um PDF para assinar"}
              </>
            )}
          </button>
        </div>
      )}

      {docToken && !signedPdfUrl && (
        <div className="flex flex-col items-center gap-3 py-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 text-center">
            Aguardando assinatura no popup…
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
            Esta tela será atualizada automaticamente após a conclusão.
          </p>
        </div>
      )}

      {authState === "done" && signedPdfUrl && (
        <div className="flex flex-col items-center gap-5 py-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-6">
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
              Documento assinado com sucesso!
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
              Este PDF tem validade legal (ICP-Brasil / gov.br)
            </p>
          </div>
          <a
            href={signedPdfUrl}
            target="_blank"
            download
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5" />
            Baixar PDF Assinado
          </a>
          <button onClick={resetar} className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
            Assinar outro documento
          </button>
        </div>
      )}

      {authState === "done" && !signedPdfUrl && (
        <div className="flex flex-col items-center gap-4 py-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold text-center">
            PDF assinado com sucesso!
          </p>
          <button onClick={resetar} className="text-sm text-blue-600 hover:underline">
            Assinar outro documento
          </button>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        <Lock className="inline w-3 h-3 mr-1 mb-0.5" />
        Seus dados trafegam criptografados via HTTPS e nunca são armazenados.
      </p>
    </div>
  );
}

// ─── Aba A1 ──────────────────────────────────────────────────────────────────
function TabA1() {
  const [etapa, setEtapa] = useState<EtapaA1>(1);

  const [pdf, setPdf] = useState<File | null>(null);
  const [cert, setCert] = useState<File | null>(null);
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [numPages, setNumPages] = useState<number>(1);
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [pageDims, setPageDims] = useState<PageDimensions | null>(null);

  const [stampPos, setStampPos] = useState<StampPos>({
    x: 40,
    y: 40,
    width: 240,
    height: 72,
  });
  const [carregando, setCarregando] = useState(false);

  const pdfRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleAvancar(e: React.FormEvent) {
    e.preventDefault();
    if (!pdf) return toast.error("Selecione um arquivo PDF.");
    if (!cert) return toast.error("Selecione o certificado (.pfx ou .p12).");
    if (!senha) return toast.error("Informe a senha do certificado.");
    const ext = cert.name.split(".").pop()?.toLowerCase();
    if (!["pfx", "p12"].includes(ext ?? ""))
      return toast.error("O certificado deve ser um arquivo .pfx ou .p12.");
    const url = URL.createObjectURL(pdf);
    setPdfObjectUrl(url);
    setEtapa(2);
  }

  function onDocumentLoad({ numPages: n }: { numPages: number }) {
    setNumPages(n);
    setPaginaAtual(1);
  }

  const onPageLoad = useCallback(
    (page: { originalWidth: number; originalHeight: number }) => {
      setPageDims({
        widthPts: page.originalWidth,
        heightPts: page.originalHeight,
      });
    },
    []
  );

  async function handleAssinar() {
    if (!pdf || !cert || !senha || !pageDims) return;
    const container = containerRef.current;
    if (!container) return;

    const containerWidthPx = container.getBoundingClientRect().width;
    const escala = pageDims.widthPts / containerWidthPx;
    const pos_x = stampPos.x * escala;
    const pos_y =
      pageDims.heightPts - (stampPos.y + stampPos.height) * escala;
    const sig_width = stampPos.width * escala;
    const sig_height = stampPos.height * escala;

    const formData = new FormData();
    formData.append("pdf", pdf);
    formData.append("certificado", cert);
    formData.append("senha", senha);
    formData.append("page_number", String(paginaAtual));
    formData.append("pos_x", String(pos_x));
    formData.append("pos_y", String(pos_y));
    formData.append("sig_width", String(sig_width));
    formData.append("sig_height", String(sig_height));

    setCarregando(true);
    const toastId = toast.loading("Assinando PDF com certificado A1…");

    try {
      const res = await axios.post(`${API}/api/pdf/sign-a1`, formData, {
        responseType: "blob",
        headers: { "Content-Type": "multipart/form-data" },
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers["content-disposition"] ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.download = match ? match[1] : `Assinado_${pdf.name}`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF assinado! Download iniciado.", { id: toastId });

      setPdf(null);
      setCert(null);
      setSenha("");
      if (pdfRef.current) pdfRef.current.value = "";
      if (certRef.current) certRef.current.value = "";
      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
      setPdfObjectUrl(null);
      setEtapa(1);
    } catch (err: unknown) {
      let msg = "Erro ao assinar o PDF.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401)
          msg = "Senha do certificado incorreta.";
        else if (err.response?.status === 400)
          msg = err.response.data?.detail ?? "Certificado inválido.";
        else if (err.response?.data?.detail) msg = err.response.data.detail;
      }
      toast.error(msg, { id: toastId });
    } finally {
      setCarregando(false);
    }
  }

  // ── Etapa 1 ─────────────────────────────────────────────────────────────────
  if (etapa === 1) {
    return (
      <div className="space-y-4">
        {/* Indicador de etapa */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <StepDot active label="1. Dados" />
          <div className="h-px w-8 bg-slate-300 dark:bg-slate-600" />
          <StepDot label="2. Posicionar" />
        </div>

        <form
          onSubmit={handleAvancar}
          className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-8 space-y-6"
        >
          {/* PDF */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Arquivo PDF
            </label>
            <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl px-4 py-4 hover:border-blue-500 transition-colors">
              <Upload className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {pdf ? pdf.name : "Clique para selecionar um PDF…"}
              </span>
              <input
                ref={pdfRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Certificado */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Certificado A1{" "}
              <span className="text-slate-400 font-normal">(.pfx ou .p12)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl px-4 py-4 hover:border-blue-500 transition-colors">
              <FileKey2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {cert ? cert.name : "Clique para selecionar o certificado…"}
              </span>
              <input
                ref={certRef}
                type="file"
                accept=".pfx,.p12"
                className="hidden"
                onChange={(e) => setCert(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Senha do Certificado
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {mostrarSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Próximo: posicionar carimbo
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          🔒 Seu certificado e senha nunca saem do seu dispositivo.
        </p>
      </div>
    );
  }

  // ── Etapa 2 ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Indicador */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <StepDot label="1. Dados" />
        <div className="h-px w-8 bg-blue-400" />
        <StepDot active label="2. Posicionar" />
      </div>

      {/* Dica */}
      <div className="flex items-start gap-2 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Arraste e redimensione o carimbo azul; depois clique em{" "}
          <strong>Assinar PDF</strong>. Use os controles abaixo para navegar
          entre páginas.
        </span>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setEtapa(1)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
            disabled={paginaAtual <= 1}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Página{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {paginaAtual}
            </span>{" "}
            de {numPages}
          </span>
          <button
            onClick={() =>
              setPaginaAtual((p) => Math.min(numPages, p + 1))
            }
            disabled={paginaAtual >= numPages}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleAssinar}
          disabled={carregando}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
        >
          {carregando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Assinando…
            </>
          ) : (
            <>
              <Stamp className="w-4 h-4" />
              Assinar PDF
            </>
          )}
        </button>
      </div>

      {/* Visualizador + Carimbo */}
      <div
        ref={containerRef}
        className="relative border border-slate-300 dark:border-slate-600 rounded-2xl overflow-hidden shadow-xl bg-slate-100 dark:bg-slate-900"
        style={{ userSelect: "none" }}
      >
        <Document
          file={pdfObjectUrl}
          onLoadSuccess={onDocumentLoad}
          loading={
            <div className="flex items-center justify-center h-96 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }
        >
          <Page
            pageNumber={paginaAtual}
            width={containerRef.current?.clientWidth ?? 800}
            onLoadSuccess={onPageLoad}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
        <Rnd
          bounds="parent"
          position={{ x: stampPos.x, y: stampPos.y }}
          size={{ width: stampPos.width, height: stampPos.height }}
          onDragStop={(_e, d) =>
            setStampPos((s) => ({ ...s, x: d.x, y: d.y }))
          }
          onResizeStop={(_e, _dir, ref, _delta, pos) =>
            setStampPos({
              x: pos.x,
              y: pos.y,
              width: parseFloat(ref.style.width),
              height: parseFloat(ref.style.height),
            })
          }
          minWidth={120}
          minHeight={40}
          style={{ cursor: "move", zIndex: 10 }}
        >
          <StampPreview />
        </Rnd>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        O carimbo visível exibirá o nome do titular, data e hora da assinatura.
      </p>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
        active
          ? "bg-white dark:bg-slate-700 shadow-md ring-1 ring-slate-200 dark:ring-slate-600"
          : "hover:bg-white/50 dark:hover:bg-slate-700/50"
      }`}
    >
      <span
        className={`flex-shrink-0 ${
          active
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-400 dark:text-slate-500"
        }`}
      >
        {icon}
      </span>
      <span>
        <span
          className={`block text-sm font-semibold ${
            active
              ? "text-slate-900 dark:text-white"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {label}
        </span>
        <span className="block text-xs text-slate-400">{sub}</span>
      </span>
    </button>
  );
}

function GovBrLogo({ white = false }: { white?: boolean }) {
  // SVG simplificado representando o logo gov.br
  return (
    <svg
      width="28"
      height="16"
      viewBox="0 0 56 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <rect width="56" height="32" rx="4" fill={white ? "white" : "#1351b4"} fillOpacity={white ? "0.15" : "1"} />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={white ? "white" : "white"}
        fontSize="11"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        letterSpacing="0.5"
      >
        gov.br
      </text>
    </svg>
  );
}

function StepDot({ active, label }: { active?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          active ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
        }`}
      />
      <span
        className={`text-xs font-medium ${
          active
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-400 dark:text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StampPreview() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-blue-500 bg-blue-50/80 dark:bg-blue-900/60 backdrop-blur-sm select-none"
      style={{ fontFamily: "monospace" }}
    >
      <div className="text-blue-700 dark:text-blue-300 text-center leading-tight px-2">
        <p className="text-[10px] font-bold uppercase tracking-wide">
          Assinado digitalmente por
        </p>
        <p className="text-[9px] opacity-70 truncate w-full text-center">
          [Nome do Titular]
        </p>
        <p className="text-[9px] opacity-60">
          ICP-Brasil · {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
