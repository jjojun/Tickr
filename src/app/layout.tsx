'use client';

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Roboto } from "next/font/google";
import "./globals.css";
import { StudyProvider } from "./contexts/StudyContext";
import { ToastProvider } from "./contexts/ToastContext";
import Image from 'next/image';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: ['400', '700'], // 사용할 폰트 굵기 지정
  subsets: ['latin'],
  variable: '--font-roboto',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUserId(String(user.id));
    } else {
      setCurrentUserId(null);
    }

    // Listen for changes in localStorage (e.g., from other tabs or after login/logout)
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('loggedInUser');
      if (updatedUser) {
        const user = JSON.parse(updatedUser);
        setCurrentUserId(String(user.id));
      } else {
        setCurrentUserId(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
                <title>Tickr</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body
        className={`${geistMono.variable} antialiased`}
      >
        <div className="fixed top-4 left-4 z-50 logo-container flex items-center space-x-2">
          <Image src="/logo.svg" alt="Logo" width={50} height={50} />
          <span className={`text-3xl font-bold text-gray-800 ${roboto.className}`}>Tickr</span>
        </div>
        <ToastProvider>
          {/* Pass currentUserId as key to force re-mount on user change */}
          <StudyProvider key={currentUserId}>{children}</StudyProvider>
        </ToastProvider>
        <footer className="text-center py-4 text-gray-500 text-sm">
          © 2025. jjojun All rights reserved.
        </footer>
      </body>
    </html>
  );
}
