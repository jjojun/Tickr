import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataDir = process.cwd();

interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  ownerId: string;
  members: { userId: string; joinedAt: string }[];
}

interface StudySession {
  id: string;
  userId: string;
  subject: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
}

interface User {
  id: number;
  username: string;
}

// Finds a group by its ID across all groups_*.json files
async function findGroup(groupId: string): Promise<Group | null> {
  try {
    const files = await fs.readdir(dataDir);
    const groupFiles = files.filter(file => file.startsWith('groups_') && file.endsWith('.json'));

    for (const file of groupFiles) {
      try {
        const filePath = path.join(dataDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const userGroups = JSON.parse(data) as Group[];
        const foundGroup = userGroups.find(g => g.id === groupId);
        if (foundGroup) {
          return foundGroup;
        }
      } catch {
        // Ignore errors in individual files
      }
    }
    return null; // Group not found
  } catch (error) {
    console.error('Error scanning for group:', error);
    throw new Error('Failed to scan for group.');
  }
}

async function readUsers(): Promise<User[]> {
  const usersFilePath = path.join(dataDir, 'users.json');
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function readStudySessions(userId: string): Promise<StudySession[]> {
  const filePath = path.join(dataDir, `study_sessions_${userId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function getUsernameByUserId(userId: string, users: User[]): Promise<string> {
  const user = users.find(u => String(u.id) === userId);
  return user ? user.username : `Unknown User (${userId})`;
}

export async function GET(request: Request, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params;

    if (!groupId) {
      return NextResponse.json({ message: 'Group ID is required.' }, { status: 400 });
    }

    const group = await findGroup(groupId);

    if (!group) {
      return NextResponse.json({ message: 'Group not found.' }, { status: 404 });
    }

    const users = await readUsers();
    const memberRankings: { userId: string; username: string; totalStudyDuration: number }[] = [];

    for (const member of group.members) {
      const sessions = await readStudySessions(member.userId);
      const totalStudyDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
      const username = await getUsernameByUserId(member.userId, users);
      memberRankings.push({ userId: member.userId, username, totalStudyDuration });
    }

    memberRankings.sort((a, b) => b.totalStudyDuration - a.totalStudyDuration);

    return NextResponse.json({ groupId, ranking: memberRankings }, { status: 200 });
  } catch (error) {
    console.error('Failed to get group ranking:', error);
    return NextResponse.json({ message: 'Failed to get group ranking.' }, { status: 500 });
  }
}