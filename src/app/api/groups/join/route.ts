import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

// Finds a group by its ID across all groups_*.json files
// Returns the group and the ownerId (from the filename)
async function findGroupAndOwner(groupId: string): Promise<{ group: Group; ownerId: string } | null> {
  try {
    const files = await fs.readdir(dataDir);
    const groupFiles = files.filter(file => file.startsWith('groups_') && file.endsWith('.json'));

    for (const file of groupFiles) {
      try {
        const ownerId = file.replace('groups_', '').replace('.json', '');
        const filePath = path.join(dataDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const userGroups = JSON.parse(data) as Group[];
        const foundGroup = userGroups.find(g => g.id === groupId);
        if (foundGroup) {
          return { group: foundGroup, ownerId };
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

// Writes groups for a specific user
async function writeUserOwnedGroups(userId: string, groups: Group[]): Promise<void> {
  const filePath = path.join(dataDir, `groups_${userId}.json`);
  await fs.writeFile(filePath, JSON.stringify(groups, null, 2), 'utf-8');
}

export async function POST(request: Request) {
  try {
    const { groupId, userId, password } = await request.json();

    if (!groupId || !userId) {
      return NextResponse.json({ message: 'Missing required fields: groupId, userId.' }, { status: 400 });
    }

    const findResult = await findGroupAndOwner(groupId);

    if (!findResult) {
      return NextResponse.json({ message: 'Group not found.' }, { status: 404 });
    }

    const { group, ownerId } = findResult;

    // Verify password if the group requires one
    if (group.password && group.password !== password) {
      return NextResponse.json({ message: '그룹 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // Check if user is already a member
    if (group.members.some(member => member.userId === userId)) {
      return NextResponse.json({ message: 'User is already a member of this group.' }, { status: 409 });
    }

    // Check if the group is full
    if (group.memberLimit && group.members.length >= group.memberLimit) {
      return NextResponse.json({ message: '이 그룹은 최대 인원수에 도달했습니다.' }, { status: 403 });
    }

    // Add the user to the members list
    const updatedGroup = {
      ...group,
      members: [...group.members, { userId, joinedAt: new Date().toISOString() }],
    };

    // Read the owner's group file, update the specific group, and write back
    const ownerGroupFilePath = path.join(dataDir, `groups_${ownerId}.json`);
    const ownerGroupsData = await fs.readFile(ownerGroupFilePath, 'utf-8');
    const ownerGroups = JSON.parse(ownerGroupsData) as Group[];
    
    const groupIndex = ownerGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
        // This should not happen if findGroupAndOwner worked correctly
        return NextResponse.json({ message: 'Consistency error: Group vanished after being found.' }, { status: 500 });
    }

    ownerGroups[groupIndex] = updatedGroup;
    await writeUserOwnedGroups(ownerId, ownerGroups);

    return NextResponse.json({ message: 'Successfully joined group.', group: updatedGroup }, { status: 200 });
  } catch (error) {
    console.error('Failed to join group:', error);
    return NextResponse.json({ message: 'Failed to join group.' }, { status: 500 });
  }
}
