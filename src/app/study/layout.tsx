'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  weight: ['700'], // 굵은 폰트 사용
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: '메인', path: '/study/main' },
    { name: '과목', path: '/study/subjects' },
    { name: '타이머', path: '/study/timer' },
    { name: '랭킹', path: '/study/ranking' },
    { name: '그룹', path: '/study/groups' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-xl border border-gray-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-3xl font-extrabold text-gray-800 ${montserrat.className}`}>Tickr</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/mypage')}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
              aria-label="마이페이지"
            >
              <i className="fas fa-user-circle text-white text-xl"></i>
            </button>
          </div>
        </div>
        <div className="mb-8">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => router.push(tab.path)}
                className={`px-4 py-2 text-lg font-medium ${
                  pathname === tab.path
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
