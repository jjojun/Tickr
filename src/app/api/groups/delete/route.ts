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
  if (groups.length === 0) {
    // If the user has no more groups, delete their file
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
        throw error;
      }
    }
  } else {
    await fs.writeFile(filePath, JSON.stringify(groups, null, 2), 'utf-8');
  }
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

    // Verify owner
    if (group.ownerId !== userId) {
      return NextResponse.json({ message: 'Only the group owner can delete the group.' }, { status: 403 });
    }
    
    // Also check if the ownerId from the group matches the ownerId from the file
    if (ownerId !== userId) {
        return NextResponse.json({ message: 'Ownership consistency error.' }, { status: 500 });
    }

    // Verify password if set
    if (group.password && group.password !== password) {
      return NextResponse.json({ message: 'Incorrect password.' }, { status: 401 });
    }

    // Read the owner's group file, filter out the group, and write back
    const ownerGroupFilePath = path.join(dataDir, `groups_${ownerId}.json`);
    const ownerGroupsData = await fs.readFile(ownerGroupFilePath, 'utf-8');
    const ownerGroups = JSON.parse(ownerGroupsData) as Group[];

    const updatedGroups = ownerGroups.filter(g => g.id !== groupId);

    if (updatedGroups.length === ownerGroups.length) {
        return NextResponse.json({ message: 'Consistency error: Group to delete not found in owner file.' }, { status: 500 });
    }

    await writeUserOwnedGroups(ownerId, updatedGroups);

    return NextResponse.json({ message: 'Group deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete group:', error);
    return NextResponse.json({ message: 'Failed to delete group.' }, { status: 500 });
  }
}
