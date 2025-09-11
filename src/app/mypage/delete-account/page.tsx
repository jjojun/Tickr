'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../contexts/ToastContext';

interface User {
  id: string;
  username: string;
  email: string;
}

export default function DeleteAccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      addToast('로그인 정보가 없습니다.', 'error');
      router.push('/login');
      return;
    }

    if (password !== confirmPassword) {
      addToast('비밀번호가 일치하지 않습니다.', 'error');
      return;
    }

    if (!password) {
      addToast('비밀번호를 입력해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, password }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast(data.message || '회원 탈퇴가 성공적으로 처리되었습니다.', 'success');
        localStorage.removeItem('loggedInUser'); // Clear user session
        localStorage.removeItem(`studyTimerState_${user.id}`); // Clear user-specific timer state
        router.push('/login');
      } else {
        addToast(data.message || '회원 탈퇴에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      addToast('네트워크 오류 또는 서버 문제.', 'error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700">로그인 정보 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">회원 탈퇴</h1>
        <p className="text-gray-600 mb-6 text-center">회원 탈퇴를 위해 현재 비밀번호를 입력해주세요.</p>
        <form onSubmit={handleDeleteAccount} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            회원 탈퇴
          </button>
        </form>
      </div>
    </div>
  );
}
