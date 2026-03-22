import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";
import { ThemeProvider } from "./providers";
import PrivacyBadge from "./components/PrivacyBadge";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Miriam Editor-PDF - Ferramentas de manipulação",
    description: "Editor focado em extração e edição avançada de PDFs.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className={`${inter.className} bg-[#F3F0EC] dark:bg-[#121212] transition-colors duration-200`}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <header className="w-full h-16 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between px-6 fixed top-0 z-50 transition-colors duration-200">
                        <div className="flex items-center">
                        <Link href="/" className="flex items-center text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100 hover:opacity-80 transition-opacity">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mr-2 text-gray-800 dark:text-gray-100">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 2 L12 12 L20.66 17" />
                                <path d="M3.34 17 L12 12" />
                            </svg>
                            Miriam <span className="text-pdfred ml-1">Editor-PDF</span>
                        </Link>
                        <nav className="ml-10 hidden lg:flex space-x-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <Link href="/merge" className="hover:text-pdfred dark:hover:text-red-400 transition-colors">Juntar PDF</Link>
                            <Link href="/add-text" className="hover:text-pdfred dark:hover:text-red-400 transition-colors">Adicionar Texto</Link>
                            <Link href="/split" className="hover:text-pdfred dark:hover:text-red-400 transition-colors">Dividir PDF</Link>
                            <Link href="/compress" className="hover:text-pdfred dark:hover:text-red-400 transition-colors">Comprimir PDF</Link>
                            <Link href="/to-word" className="hover:text-pdfred dark:hover:text-red-400 transition-colors">PDF para Word</Link>
                            <Link href="/to-excel" className="hover:text-pdfred dark:hover:text-red-400 transition-colors">PDF para Excel</Link>
                        </nav>
                    </div>
                    <div>
                        <ThemeToggle />
                    </div>
                </header>
                <main className="pt-16 min-h-[calc(100vh-80px)] transition-colors duration-200 block">
                    {children}
                </main>
                <footer className="w-full bg-[#F3F0EC] dark:bg-[#121212] pt-4 pb-8 transition-colors duration-200">
                    <PrivacyBadge />
                </footer>
                </ThemeProvider>
            </body>
        </html>
    );
}
