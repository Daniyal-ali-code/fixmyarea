import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { PageEnter } from "@/components/Motion";
import { Footer } from "@/components/ui";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata = {
  title: "FixMyArea — Report Local Issues",
  description: "Report and track community issues in your area.",
};

// viewportFit cover so the safe-area insets apply; theme-color matches
// the amber/stone chrome around the bottom nav.
export const viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffbeb" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
};

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var theme = stored || system;
      if (theme === 'dark') document.documentElement.classList.add('dark');
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${lora.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            {/* Bottom padding is 4.5rem + safe area: the nav bar is
                ~56px, so the footer clears it without the old 7rem
                dead band. The padding lives on the footer itself
                (ui.js) — it used to sit on this wrapper, which put a
                blank band *below* the footer on every page. */}
            <PageEnter>{children}</PageEnter>
            <Footer />
            <BottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
