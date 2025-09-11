import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const getStudySessionsFilePath = (userId: string) => {
  const filePath = path.resolve(process.cwd(), `study_sessions_${userId}.json`);
  console.log(`[study-sessions] File Path for userId ${userId}: ${filePath}`);
  return filePath;
};

// Helper to read study sessions from file for a specific user
const readStudySessions = (userId: string): StudySession[] => {
  const filePath = getStudySessionsFilePath(userId);
  console.log(`[study-sessions][READ] Attempting to read from: ${filePath} for userId: ${userId}`);
  if (!fs.existsSync(filePath)) {
    console.log(`[study-sessions][READ] File does not exist for userId: ${userId} at ${filePath}. Returning empty array.`);
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  console.log(`[study-sessions][READ] Successfully read from ${filePath}. Data length: ${data.length}. First 100 chars: ${data.substring(0, 100)}...`);
  return JSON.parse(data);
};

// Helper to write study sessions to file for a specific user
const writeStudySessions = (userId: string, sessions: StudySession[]) => {
  const filePath = getStudySessionsFilePath(userId);
  console.log(`[study-sessions][WRITE] Attempting to write to: ${filePath} for userId: ${userId}. Data length: ${JSON.stringify(sessions).length}. First 100 chars: ${JSON.stringify(sessions).substring(0, 100)}...`);
  fs.writeFileSync(filePath, JSON.stringify(sessions, null, 2), 'utf-8');
  console.log(`[study-sessions][WRITE] Successfully wrote to: ${filePath} for userId: ${userId}.`);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  const userSessions = readStudySessions(userId);

  return NextResponse.json({ sessions: userSessions }, { status: 200 });
}

export async function POST(request: Request) {
  const newSession: Omit<StudySession, 'id'> = await request.json();

  console.log(`[study-sessions][POST Handler] Received newSession.userId: ${newSession.userId}`); // 추가된 로그

  if (!newSession.userId || !newSession.subject || !newSession.startTime || !newSession.endTime || newSession.duration === undefined) {
    return NextResponse.json({ message: 'Missing required session data.' }, { status: 400 });
  }

  const sessions = readStudySessions(newSession.userId);
  const sessionToSave: StudySession = { ...newSession, id: uuidv4() };
  sessions.push(sessionToSave);
  writeStudySessions(newSession.userId, sessions);

  return NextResponse.json(sessionToSave, { status: 201 });
}