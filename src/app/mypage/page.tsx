'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudyContext } from '../contexts/StudyContext';
import { useToast } from '../contexts/ToastContext';

interface User {
  id: string;
  username: string;
  email: string;
}

interface StudySession {
  id: string;
  userId: string;
  subject: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
}

export default function MyPage() {
  const { userId, studySessions, resetStudyContext } = useStudyContext();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [subjectSummary, setSubjectSummary] = useState<Record<string, number>>({});
  const router = useRouter();

  // Profile Update States
  const [newEmail, setNewEmail] = useState('');

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      setNewEmail(parsedUser.email);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    let total = 0;
    const summary: Record<string, number> = {};
    studySessions.forEach((session: StudySession) => {
      total += session.duration;
      summary[session.subject] = (summary[session.subject] || 0) + session.duration;
    });
    setTotalStudyTime(total);
    setSubjectSummary(summary);
  }, [studySessions]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, email: newEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast(data.message || '프로필이 성공적으로 업데이트되었습니다.', 'success');
        const updatedUser = { ...user, email: newEmail };
        setUser(updatedUser);
        localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      } else {
        addToast(data.message || '프로필 업데이트에 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류 또는 서버 문제.', 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmNewPassword) {
      addToast('새 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast(data.message || '비밀번호가 성공적으로 변경되었습니다.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        addToast(data.message || '비밀번호 변경에 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류 또는 서버 문제.', 'error');
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    const loggedOutUserId = user?.id;

    // 1. Immediately reset the context state for a snappy UI response
    resetStudyContext();

    // 2. Clear user from localStorage
    localStorage.removeItem('loggedInUser');

    // 3. Dispatch event to notify other tabs/windows
    window.dispatchEvent(new Event('user-changed'));

    // 4. Clear any saved timer state for the user that just logged out
    if (loggedOutUserId) {
      localStorage.removeItem(`studyTimerState_${loggedOutUserId}`);
    }

    addToast('로그아웃 되었습니다. 로그인 페이지로 이동합니다.', 'success');
    
    // 5. Redirect to login page
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700">로그인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-xl border border-gray-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800">마이페이지</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/study/timer')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
            >
              학습 타이머로 돌아가기
            </button>
          </div>
        </div>

        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">내 정보</h3>
          <p className="text-gray-700 mb-2"><span className="font-semibold">아이디:</span> {user.username}</p>
          <p className="text-gray-700 mb-2"><span className="font-semibold">이메일:</span> {user.email}</p>
        </div>

        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">프로필 수정</h3>
          <form onSubmit={handleProfileUpdate}>
            <div className="mb-4">
              <label htmlFor="newEmail" className="block text-gray-700 text-base font-medium mb-2">
                새 이메일
              </label>
              <input
                type="email"
                id="newEmail"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                placeholder="새 이메일을 입력하세요"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
            >
              이메일 변경
            </button>
          </form>
        </div>

        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">비밀번호 변경</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-gray-700 text-base font-medium mb-2">
                현재 비밀번호
              </label>
              <input
                type="password"
                id="currentPassword"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                placeholder="현재 비밀번호를 입력하세요"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700 text-base font-medium mb-2">
                새 비밀번호
              </label>
              <input
                type="password"
                id="newPassword"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                placeholder="새 비밀번호를 입력하세요"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirmNewPassword" className="block text-gray-700 text-base font-medium mb-2">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
                placeholder="새 비밀번호를 다시 입력하세요"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
            >
              비밀번호 변경
            </button>
          </form>
        </div>

        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">나의 학습 통계</h3>
          <p className="text-gray-700 mb-4"><span className="font-semibold">총 학습 시간:</span> {formatTime(totalStudyTime)}</p>
          <h4 className="text-xl font-semibold text-gray-700 mb-2">과목별 학습 시간:</h4>
          {Object.keys(subjectSummary).length === 0 ? (
            <p className="text-gray-600">아직 기록된 과목별 학습 시간이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(subjectSummary).map(([subjectName, duration]) => (
                <li key={subjectName} className="flex justify-between items-center text-gray-700">
                  <span>{subjectName}</span>
                  <span className="font-semibold">{formatTime(duration)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">최근 학습 기록</h3>
          {studySessions.length === 0 ? (
            <p className="text-gray-600 text-center">아직 학습 기록이 없습니다. 학습 타이머를 사용해보세요!</p>
          ) : (
            <ul className="space-y-3">
              {studySessions.slice(0, 5).map((session) => (
                <li key={session.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{session.subject}</p>
                    <p className="text-sm text-gray-600">{new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{formatTime(session.duration)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => router.push('/mypage/delete-account')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-200"
          >
            회원 탈퇴
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
