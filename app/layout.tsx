import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Searching for meaning",
  description: "Image archive search",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="absolute left-1 top-1 z-10 flex flex-col gap-1 text-sm">
          <Link
            href="/"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            /Home
          </Link>
          <Link
            href="/admin/seed"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            /Seed
          </Link>
          <Link
            href="/admin/images"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            /Images
          </Link>
        </nav>
        <header className="mx-auto w-full max-w-3xl px-6 pb-8">
          <Link
            href="/"
            className="block text-5xl font-semibold uppercase tracking-tight text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
            aria-label="Searching for meaning — home"
          >
            Searching for meaning
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
