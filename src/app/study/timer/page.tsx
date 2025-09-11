'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStudyContext } from '../../contexts/StudyContext';
import { useToast } from '../../contexts/ToastContext';

export default function TimerPage() {
  const {
    subject,
    timerRunning,
    elapsedTime,
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    studySessions,
    userId,
  } = useStudyContext();
  const { setToastContainer } = useToast();
  const router = useRouter();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('TimerPage useEffect: userId =', userId, 'Type:', typeof userId); // 타입 정보 추가
    if (typeof userId !== 'string' || userId.trim() === '') { // userId가 문자열이 아니거나 빈 문자열인 경우
      console.log('TimerPage useEffect: userId is invalid, redirecting to /login');
      router.push('/login');
    }
  }, [userId, router]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFullScreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => {
        setIsFullScreen(true);
        setToastContainer(fullscreenContainerRef.current);
      }).catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
        setToastContainer(null);
      });
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        setToastContainer(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [setToastContainer]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700">로그인 중...</p>
      </div>
    );
  }

  if (isFullScreen) {
    return (
      <div className="fullscreen-timer-container" ref={fullscreenContainerRef}>
        <div className="fullscreen-subject-display">
          <span className="subject-tag">{subject ? subject : '선택 안됨'}</span>
        </div>
        <div className="fullscreen-timer-display">
          {formatTime(elapsedTime)}
        </div>
        <div className="fullscreen-controls"> {/* 새로운 div 추가 */}
          {!timerRunning ? (
            <button
              onClick={startTimer}
              className="fullscreen-control-button bg-blue-600"
            >
              <i className="fas fa-play"></i>
            </button>
          ) : (
            <>
              <button
                onClick={pauseTimer}
                className="fullscreen-control-button bg-yellow-600"
              >
                <i className="fas fa-pause"></i>
              </button>
              <button
                onClick={stopTimer}
                className="fullscreen-control-button bg-red-600"
              >
                <i className="fas fa-stop"></i>
              </button>
            </>
          )}
          <button
            onClick={resetTimer}
            className="fullscreen-control-button bg-gray-600"
            disabled={elapsedTime === 0 && !timerRunning}
          >
            <i className="fas fa-redo"></i>
          </button>
        </div>
        <button
          onClick={toggleFullScreen}
          className="fullscreen-exit-button"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-gray-800 mb-4">타이머</h2>
      <p className="text-gray-600 mb-6">선택된 과목으로 학습 시간을 기록하세요.</p>

      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-2xl font-bold text-gray-700 mb-4">현재 학습</h3>
        <p className="text-xl font-semibold text-gray-800 mb-4 regular-timer-subject-container">
          과목: <span className="subject-tag">{subject || '선택되지 않음'}</span>
        </p>
        <div className="relative">
          <div className="text-4xl sm:text-5xl font-mono text-center my-8 text-gray-900">
            {formatTime(elapsedTime)}
          </div>
          <button
            onClick={toggleFullScreen}
            className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full"
            title="전체 화면"
          >
            <i className="fas fa-expand"></i>
          </button>
        </div>
        <div className="flex justify-center space-x-4">
          {!timerRunning ? (
            <button
              onClick={startTimer}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
            >
              시작
            </button>
          ) : (
            <>
              <button
                onClick={pauseTimer}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 transition duration-200"
              >
                중지
              </button>
              <button
                onClick={stopTimer}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200"
              >
                정지 및 기록
              </button>
            </>
          )}
          <button
            onClick={resetTimer}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-200"
            disabled={elapsedTime === 0 && !timerRunning} // 타이머가 0이고 실행 중이 아니면 비활성화
          >
            초기화
          </button>
        </div>
      </div>

      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-2xl font-bold text-gray-700 mb-4">나의 학습 기록</h3>
        {studySessions.length === 0 ? (
          <p className="text-gray-600 text-center">아직 학습 기록이 없습니다. 타이머를 시작해보세요!</p>
        ) : (
          <ul className="space-y-3">
            {studySessions.map((session) => (
              <li key={session.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-gray-800">{session.subject}</p>
                  <p className="text-sm text-gray-600">{new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}</p>
                </div>
                <p className="text-xl font-bold text-blue-600">{formatTime(session.duration * 1000)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}