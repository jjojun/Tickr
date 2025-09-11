'use client';

import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [email, setEmail] = useState('');
  const [usernameAvailability, setUsernameAvailability] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const { addToast } = useToast();

  const checkUsernameAvailability = async () => {
    if (usernameMessage) {
      return;
    }
    setIsCheckingUsername(true);
    setUsernameAvailability(null);
    setUsernameMessage('아이디 중복 확인 중...');

    try {
      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      setUsernameAvailability(data.available);
      setUsernameMessage(data.message);
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameAvailability(null);
      setUsernameMessage('아이디 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setUsernameAvailability(null);

    const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/;
    if (newUsername.length > 10) {
      setUsernameMessage('아이디는 10자 이내로 설정해주세요.');
    } else if (newUsername.length > 0 && !usernameRegex.test(newUsername)) {
      setUsernameMessage('아이디는 영문자와 숫자로 구성되며, 최소 하나의 영문자를 포함해야 합니다.');
    } else {
      setUsernameMessage('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordMessage('비밀번호는 8자 이상이어야 하며, 하나 이상의 대문자, 숫자, 특수문자를 포함해야 합니다.');
    } else {
      setPasswordMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameAvailability !== true) {
      addToast('아이디 중복 확인을 완료하고 사용 가능한 아이디를 입력해주세요.', 'error');
      return;
    }
    if (passwordMessage) {
      addToast(passwordMessage, 'error');
      return;
    }
    addToast('회원가입 처리 중...', 'info');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast(data.message || '회원가입 성공! 이메일 인증을 완료해주세요.', 'success');
      } else {
        addToast(data.message || '회원가입 실패.', 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      addToast('네트워크 오류 또는 서버 문제.', 'error');
    }
  };

  const isSignupButtonDisabled = usernameAvailability !== true || !password || !email || !!passwordMessage;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-xl border border-gray-200 w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-8">회원가입</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="username" className="block text-gray-700 text-base font-medium mb-2">
              아이디
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                className="w-full px-4 py-2 pr-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 text-gray-900"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={handleUsernameChange}
                required
              />
              <button
                type="button"
                onClick={checkUsernameAvailability}
                className="absolute inset-y-0 right-0 flex items-center px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-r-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-200"
                disabled={isCheckingUsername || !!usernameMessage}
              >
                {isCheckingUsername ? '확인 중...' : '중복 확인'}
              </button>
            </div>
            {usernameMessage && (
              <p className={`text-sm mt-1 ${usernameAvailability === true ? 'text-green-600' : 'text-red-600'}`}>
                {usernameMessage}
              </p>
            )}
          </div>
          <div className="mb-5">
            <label htmlFor="password" className="block text-gray-700 text-base font-medium mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 text-gray-900"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={handlePasswordChange}
              required
            />
            {passwordMessage && (
              <p className="text-sm mt-1 text-red-600">
                {passwordMessage}
              </p>
            )}
          </div>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 text-base font-medium mb-2">
              이메일
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 text-gray-900"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              className={`w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-200 ${isSignupButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSignupButtonDisabled}
            >
              회원가입
            </button>
          </div>
          <p className="text-center text-gray-600 text-base mt-6">
            이미 계정이 있으신가요? <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">로그인</a>
          </p>
        </form>
      </div>
    </div>
  );
}
