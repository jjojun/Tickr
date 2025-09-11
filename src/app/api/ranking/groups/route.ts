import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const groupsFilePath = path.resolve(process.cwd(), 'groups.json');
const usersFilePath = path.resolve(process.cwd(), 'users.json');

interface GroupMember {
  userId: string;
  joinedAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  ownerId: string;
  members: GroupMember[];
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

async function readGroups(): Promise<Group[]> {
  try {
    const data = await fs.readFile(groupsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading groups.json:', error);
    throw new Error('Failed to read groups data.');
  }
}

async function readUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading users.json:', error);
    throw new Error('Failed to read users data.');
  }
}

const getStudySessionsFilePath = (userId: string) => {
  return path.resolve(process.cwd(), `study_sessions_${userId}.json`);
};

async function readStudySessions(userId: string): Promise<StudySession[]> {
  const filePath = getStudySessionsFilePath(userId);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error(`Error reading study_sessions_${userId}.json:`, error);
    return [];
  }
}

export async function GET() {
  try {
    const groups = await readGroups();
    const users = await readUsers(); // To get usernames if needed for individual members within group ranking

    const groupRankings: { groupId: string; groupName: string; totalDuration: number; memberCount: number }[] = [];

    for (const group of groups) {
      let totalGroupDuration = 0;
      for (const member of group.members) {
        const sessions = await readStudySessions(member.userId);
        const memberTotalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
        totalGroupDuration += memberTotalDuration;
      }
      groupRankings.push({
        groupId: group.id,
        groupName: group.name,
        totalDuration: totalGroupDuration,
        memberCount: group.members.length,
      });
    }

    // Sort by totalDuration in descending order
    groupRankings.sort((a, b) => b.totalDuration - a.totalDuration);

    return NextResponse.json({ ranking: groupRankings }, { status: 200 });
  } catch (error) {
    console.error('Failed to get group ranking:', error);
    return NextResponse.json({ message: 'Failed to get group ranking.' }, { status: 500 });
  }
}
