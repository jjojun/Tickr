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
    const { groupId, userId } = await request.json();

    if (!groupId || !userId) {
      return NextResponse.json({ message: 'Missing required fields: groupId, userId.' }, { status: 400 });
    }

    const findResult = await findGroupAndOwner(groupId);

    if (!findResult) {
      return NextResponse.json({ message: 'Group not found.' }, { status: 404 });
    }

    const { group, ownerId } = findResult;
    const initialMembersCount = group.members.length;

    const updatedMembers = group.members.filter(member => member.userId !== userId);

    if (updatedMembers.length === initialMembersCount) {
      return NextResponse.json({ message: 'User is not a member of this group.' }, { status: 404 });
    }

    const updatedGroup = { ...group, members: updatedMembers };

    // Read the owner's group file, update the specific group, and write back
    const ownerGroupFilePath = path.join(dataDir, `groups_${ownerId}.json`);
    const ownerGroupsData = await fs.readFile(ownerGroupFilePath, 'utf-8');
    const ownerGroups = JSON.parse(ownerGroupsData) as Group[];
    
    const groupIndex = ownerGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
        return NextResponse.json({ message: 'Consistency error: Group vanished after being found.' }, { status: 500 });
    }

    ownerGroups[groupIndex] = updatedGroup;
    await writeUserOwnedGroups(ownerId, ownerGroups);

    return NextResponse.json({ message: 'Successfully left group.', group: updatedGroup }, { status: 200 });
  } catch (error) {
    console.error('Failed to leave group:', error);
    return NextResponse.json({ message: 'Failed to leave group.' }, { status: 500 });
  }
}
