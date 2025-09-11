'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailChangePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [message, setMessage] = useState('이메일 변경 인증 중...');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setMessage('유효하지 않은 인증 링크입니다.');
        return;
      }

      try {
        const response = await fetch('/api/verify-email-change', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(data.message || '이메일이 성공적으로 변경되었습니다!');
        } else {
          setMessage(data.message || '이메일 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setMessage('네트워크 오류 또는 서버 문제.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="bg-white p-10 rounded-xl shadow-xl border border-gray-200 w-full max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6">이메일 변경 인증</h2>
        <p className="text-gray-700 text-lg mb-6">{message}</p>
        <p className="mt-8">
          <a href="/mypage" className="text-blue-600 hover:text-blue-800 font-medium">마이페이지로 이동</a>
        </p>
      </div>
    </div>
  );
}
