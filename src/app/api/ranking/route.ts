import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// studySessionsFilePath는 더 이상 사용하지 않음
// const studySessionsFilePath = path.resolve(process.cwd(), 'study_sessions.json');
const usersFilePath = path.resolve(process.cwd(), 'users.json');

interface StudySession {
  id: string;
  userId: string;
  subject: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
}

interface User {
  id: string;
  username: string;
  email: string;
}

async function readAllStudySessions(): Promise<StudySession[]> {
  const sessions: StudySession[] = [];
  const files = await fs.readdir(process.cwd()); // 현재 디렉토리의 모든 파일 읽기

  for (const file of files) {
    if (file.startsWith('study_sessions_') && file.endsWith('.json')) {
      const filePath = path.resolve(process.cwd(), file);
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        const userSessions: StudySession[] = JSON.parse(data);
        sessions.push(...userSessions);
      } catch (error) {
        console.error(`Error reading study session file ${file}:`, error);
      }
    }
  }
  return sessions;
}

async function readUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function GET() {
  try {
    const allSessions = await readAllStudySessions(); // 변경된 함수 호출
    const allUsers = await readUsers();

    const usersMap = new Map<string, string>();
    allUsers.forEach(user => usersMap.set(String(user.id), user.username));

    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    const dailyStudyTimes: Record<string, number> = {};

    allSessions.forEach(session => {
      const sessionStartTime = new Date(session.startTime).getTime();
      if (sessionStartTime >= twentyFourHoursAgo) {
        dailyStudyTimes[String(session.userId)] = (dailyStudyTimes[String(session.userId)] || 0) + session.duration;
      }
    });

    const ranking = Object.entries(dailyStudyTimes)
      .map(([userId, totalDuration]) => ({
        username: usersMap.get(userId) || '알 수 없는 사용자',
        totalDuration: totalDuration,
      }))
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 10); // <-- 이 부분 추가

    return NextResponse.json({ ranking });
  } catch (error) {
    console.error('Failed to generate ranking:', error);
    console.error(error);
    return NextResponse.json({ message: '랭킹을 불러오는데 실패했습니다.', error: error.message }, { status: 500 });
  }
}