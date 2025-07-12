/**
 * Root Layout Component
 * 
 * The main layout wrapper for the entire application. This component
 * defines the HTML structure and loads global fonts and styles.
 * 
 * Features:
 * - Google Fonts integration (Geist Sans and Geist Mono)
 * - Global CSS imports
 * - Font variable CSS custom properties
 * - Metadata configuration
 */

// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Configure Geist Sans font with CSS variable
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Configure Geist Mono font with CSS variable
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Application metadata for SEO and browser display
export const metadata: Metadata = {
  title: "Carrier Catalog",
  description: "Cere-AI assignment",
};

/**
 * Root layout component that wraps all pages
 * 
 * @param children - Page content to be rendered
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
