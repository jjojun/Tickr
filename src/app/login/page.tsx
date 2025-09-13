'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addToast('로그인 처리 중...', 'info');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast(data.message || '로그인 성공!', 'success');
        localStorage.setItem('loggedInUser', JSON.stringify(data.user));
        // Dispatch our custom event to tell the context to update
        window.dispatchEvent(new Event('user-changed'));
        // Use Next.js router for client-side navigation
        if (data.redirectUrl) {
          router.push(data.redirectUrl);
        }
      } else {
        addToast(data.message || '로그인 실패.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      addToast('네트워크 오류 또는 서버 문제.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-xl border border-gray-200 w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-8">로그인</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="username" className="block text-gray-700 text-base font-medium mb-2">
              아이디
            </label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
              placeholder="아이디를 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-base font-medium mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
            >
              로그인
            </button>
          </div>
          <p className="text-center text-gray-600 text-base mt-6">
            계정이 없으신가요? <a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">회원가입</a>
          </p>
          <div className="text-center text-gray-600 text-base mt-4">
            <a href="/find-id" className="text-blue-600 hover:text-blue-800 font-medium">아이디 찾기</a>
            <span className="mx-2">|</span>
            <a href="/find-password" className="text-blue-600 hover:text-blue-800 font-medium">비밀번호 찾기</a>
          </div>
        </form>
      </div>
    </div>
  );
}
