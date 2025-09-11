'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { useToast } from './ToastContext';

interface StudySession {
  id: string;
  userId: string;
  subject: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
}

interface StudyContextType {
  subject: string;
  setSubject: (subject: string) => void;
  timerRunning: boolean;
  elapsedTime: number;
  startTimer: () => void;
  stopTimer: () => Promise<void>;
  pauseTimer: () => void;
  resetTimer: () => void;
  studySessions: StudySession[];
  setStudySessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  userId: string | null;
  subjects: string[];
  subjectColors: Record<string, string>;
  addSubject: (subject: string) => Promise<void>;
  deleteSubject: (subject: string) => Promise<void>;
  resetStudyContext: () => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const getRandomColor = () => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
    'bg-yellow-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-lime-500',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const StudyProvider = ({ children }: { children: ReactNode }) => {
  const [subject, setSubjectState] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectColors, setSubjectColors] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const resetStudyContext = () => {
    setSubjectState('');
    setTimerRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setStudySessions([]);
    setSubjects([]);
    setSubjectColors({});
    setUserId(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const handleUserChange = async () => {
      const storedUser = localStorage.getItem('loggedInUser');

      if (storedUser) {
        const user = JSON.parse(storedUser);
        const newUserId = String(user.id);
        setUserId(newUserId);

        try {
          const subjectsResponse = await fetch(`/api/subjects?userId=${newUserId}`);
          if (subjectsResponse.ok) {
            const subjectsData = await subjectsResponse.json();
            setSubjects(subjectsData.subjects);
            const colors = {};
            subjectsData.subjects.forEach(s => { colors[s] = getRandomColor(); });
            setSubjectColors(colors);
          } else {
             addToast('과목 정보 로딩 실패', 'error');
          }

          const sessionsResponse = await fetch(`/api/study-sessions?userId=${newUserId}`);
          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json();
            setStudySessions(sessionsData.sessions);
          } else {
            addToast('학습 기록 로딩 실패', 'error');
          }

        } catch (error) {
          addToast('데이터 로딩 중 네트워크 오류 발생', 'error');
        }

      } else {
        resetStudyContext();
      }
      setIsLoading(false);
    };

    handleUserChange();

    window.addEventListener('storage', handleUserChange);
    window.addEventListener('user-changed', handleUserChange);

    return () => {
      window.removeEventListener('storage', handleUserChange);
      window.removeEventListener('user-changed', handleUserChange);
    };
  }, [addToast]);

  useEffect(() => {
    if (!userId) return;
    const savedState = localStorage.getItem(`studyTimerState_${userId}`);
    if (savedState) {
      const { subject, timerRunning, startTime, elapsedTime } = JSON.parse(savedState);
      setSubjectState(subject);
      setTimerRunning(timerRunning);
      setStartTime(startTime);
      setElapsedTime(elapsedTime);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const stateToSave = { subject, timerRunning, startTime, elapsedTime };
    localStorage.setItem(`studyTimerState_${userId}`, JSON.stringify(stateToSave));
  }, [subject, timerRunning, startTime, elapsedTime, userId]);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - (startTime || Date.now()));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerRunning, startTime]);

  const setSubject = (newSubject: string) => {
    setSubjectState(newSubject);
  };

  const addSubject = async (newSubject: string) => {
    if (!newSubject) {
      addToast('과목명을 입력해주세요.', 'error');
      return;
    }
    if (!userId) {
      addToast('사용자 ID를 찾을 수 없습니다. 로그인해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject, userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects((prev) => [...prev, data.subject]);
        setSubjectColors((prev) => ({ ...prev, [data.subject]: getRandomColor() }));
        addToast('과목이 추가되었습니다.', 'success');
      } else {
        const data = await response.json();
        addToast(data.message || '과목 추가에 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류로 과목을 추가할 수 없습니다.', 'error');
    }
  };

  const deleteSubject = async (subjectToDelete: string) => {
    if (!userId) {
      addToast('사용자 ID를 찾을 수 없습니다. 로그인해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/subjects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subjectToDelete, userId }),
      });

      if (response.ok) {
        setSubjects((prev) => prev.filter((s) => s !== subjectToDelete));
        const newColors = { ...subjectColors };
        delete newColors[subjectToDelete];
        setSubjectColors(newColors);
        addToast('과목이 삭제되었습니다.', 'success');
      } else {
        const data = await response.json();
        addToast(data.message || '과목 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류로 과목을 삭제할 수 없습니다.', 'error');
    }
  };

  const startTimer = () => {
    if (!subject || subject.trim() === '') {
      addToast('과목을 선택해주세요.', 'error');
      return;
    }
    const now = Date.now();
    setStartTime(now);
    setElapsedTime(0);
    setTimerRunning(true);
  };

  const stopTimer = async () => {
    if (!timerRunning) return;

    setTimerRunning(false);
    const endTime = Date.now();
    const durationSeconds = Math.floor(elapsedTime / 1000);

    if (durationSeconds === 0) {
      addToast('0초 학습은 기록되지 않습니다.', 'info');
      return;
    }

    const newSession: Omit<StudySession, 'id'> = {
      userId: userId!,
      subject,
      startTime: new Date(startTime!).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: durationSeconds,
    };

    try {
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      });

      if (response.ok) {
        const savedSession = await response.json();
        setStudySessions((prev) => [savedSession, ...prev]);
        addToast('학습 기록이 저장되었습니다!', 'success');
        setElapsedTime(0);
      } else {
        addToast('학습 기록 저장에 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류로 학습 기록을 저장할 수 없습니다.', 'error');
    }
  };

  const pauseTimer = () => {
    if (!timerRunning) return;
    setTimerRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStartTime(Date.now() - elapsedTime);
    addToast('타이머가 일시 중지되었습니다.', 'info');
  };

  const resetTimer = () => {
    setTimerRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsedTime(0);
    setStartTime(null);
    setSubjectState('');
    addToast('타이머가 초기화되었습니다.', 'info');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700">데이터 로딩 중...</p>
      </div>
    );
  }

  return (
    <StudyContext.Provider
      value={{
        subject,
        setSubject,
        timerRunning,
        elapsedTime,
        startTimer,
        stopTimer,
        pauseTimer,
        resetTimer,
        studySessions,
        setStudySessions,
        userId,
        subjects,
        subjectColors,
        addSubject,
        deleteSubject,
        resetStudyContext,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudyContext = () => {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudyContext must be used within a StudyProvider');
  }
  return context;
};