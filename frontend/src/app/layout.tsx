import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import MouseGlowTracker from "@/components/MouseGlowTracker";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-heading",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "JobPilot AI — AI-powered Job Search & Application Tailoring",
  description: "The ultimate AI career assistant for fresh graduates and early-career developers in India. Tailor resumes, generate cover letters, analyze match fit, and track applications powered by Gemini API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('theme') || 'light';
                if (savedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })()
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased text-text-primary min-h-screen relative overflow-x-hidden selection:bg-accent-primary/20 selection:text-text-primary">
        {/* Layer 1 & 2: Soft mesh gradient + slow moving blobs */}
        <div className="liquid-mesh">
          <div className="blob blob-purple"></div>
          <div className="blob blob-blue"></div>
          <div className="blob blob-indigo"></div>
        </div>
        {/* Layer 3: Subtle Noise Overlay */}
        <div className="noise-overlay"></div>

        {/* Mouse tracking glow script */}
        <MouseGlowTracker />

        {/* Content Layer */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

