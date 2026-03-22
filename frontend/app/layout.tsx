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
            <body className={`${inter.className} bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-200`}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <header className="w-full h-20 bg-[#F8FAFC]/90 dark:bg-[#0B1120]/90 border-b border-gray-200 dark:border-gray-800/50 backdrop-blur-md flex items-center justify-between px-8 fixed top-0 z-50 transition-colors duration-500">
                        <Link href="/" className="flex items-center text-2xl font-sans font-extrabold tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition-opacity">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9 mr-3 text-slate-900 dark:text-white">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 2 L12 12 L20.66 17" />
                                <path d="M3.34 17 L12 12" />
                            </svg>
                            Miriam <span className="text-[#2980f2] ml-2 font-bold">Editor-PDF</span>
                        </Link>
                        
                        <div>
                            <ThemeToggle />
                        </div>
                    </header>
                    <main className="pt-24 min-h-[calc(100vh-80px)] transition-colors duration-200 block">
                    {children}
                </main>
                <footer className="w-full bg-[#F8FAFC] dark:bg-[#0B1120] pt-4 pb-8 transition-colors duration-200">
                    <PrivacyBadge />
                </footer>
                </ThemeProvider>
            </body>
        </html>
    );
}
