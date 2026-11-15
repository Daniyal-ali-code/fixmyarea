import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

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
            <div className="pb-[calc(7rem+env(safe-area-inset-bottom))]">
              {children}
            </div>
            <BottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
