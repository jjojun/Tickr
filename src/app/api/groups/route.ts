import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataDir = process.cwd();

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
  password?: string;
  memberLimit?: number;
}

// Reads all groups from all groups_*.json files
async function readAllGroups(): Promise<Group[]> {
  let allGroups: Group[] = [];
  try {
    const files = await fs.readdir(dataDir);
    const groupFiles = files.filter(file => file.startsWith('groups_') && file.endsWith('.json'));

    for (const file of groupFiles) {
      try {
        const filePath = path.join(dataDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const userGroups = JSON.parse(data) as Group[];
        allGroups = allGroups.concat(userGroups);
      } catch (error) {
        console.error(`Error reading or parsing file ${file}:`, error);
        // Continue to next file
      }
    }
    return allGroups;
  } catch (error) {
    console.error('Error reading directory for groups:', error);
    throw new Error('Failed to read groups data.');
  }
}

// Reads groups for a specific user (groups they own)
async function readUserOwnedGroups(userId: string): Promise<Group[]> {
  const filePath = path.join(dataDir, `groups_${userId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []; // File not found, return empty array
    }
    console.error(`Error reading groups for user ${userId}:`, error);
    throw new Error('Failed to read user groups data.');
  }
}

// Writes groups for a specific user (groups they own)
async function writeUserOwnedGroups(userId: string, groups: Group[]): Promise<void> {
  const filePath = path.join(dataDir, `groups_${userId}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(groups, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing groups for user ${userId}:`, error);
    throw new Error('Failed to write user groups data.');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const allGroups = await readAllGroups();
    
    // If a userId is provided, filter for groups they are a member of
    if (userId) {
      const userMemberGroups = allGroups.filter(group => group.members.some(member => member.userId === userId));
      return NextResponse.json({ groups: userMemberGroups });
    }
    
    // Otherwise, return all groups (for discovery)
    return NextResponse.json({ groups: allGroups });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch groups.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, ownerId, password, memberLimit } = await request.json();

    if (!name || !description || !ownerId) {
      return NextResponse.json({ message: 'Missing required fields: name, description, ownerId.' }, { status: 400 });
    }

    // Read only the groups owned by this user
    const ownerGroups = await readUserOwnedGroups(ownerId);

    const newGroup: Group = {
      id: uuidv4(),
      name,
      description,
      createdAt: new Date().toISOString(),
      ownerId,
      members: [{ userId: ownerId, joinedAt: new Date().toISOString() }], // Owner is automatically a member
      ...(password && { password }),
      ...(memberLimit && { memberLimit }),
    };

    ownerGroups.push(newGroup);
    
    // Write the updated list back to the owner's specific file
    await writeUserOwnedGroups(ownerId, ownerGroups);

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Failed to create group:', error);
    return NextResponse.json({ message: 'Failed to create group.' }, { status: 500 });
  }
}
