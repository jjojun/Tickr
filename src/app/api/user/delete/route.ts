import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const usersFilePath = path.resolve(process.cwd(), 'users.json');

// Helper to read users from file
const readUsers = async () => {
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

// Helper to write users to file
const writeUsers = async (users: any[]) => {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
};

// Helper to delete user-specific files
const deleteUserFiles = async (userId: string) => {
  const subjectFilePath = path.resolve(process.cwd(), `subjects_${userId}.json`);
  const studySessionFilePath = path.resolve(process.cwd(), `study_sessions_${userId}.json`);

  try {
    await fs.unlink(subjectFilePath);
    console.log(`Deleted subject file for userId ${userId}: ${subjectFilePath}`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error(`Error deleting subject file for userId ${userId}:`, error);
    }
  }

  try {
    await fs.unlink(studySessionFilePath);
    console.log(`Deleted study session file for userId ${userId}: ${studySessionFilePath}`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error(`Error deleting study session file for userId ${userId}:`, error);
    }
  }
};

export async function DELETE(request: Request) {
  const { userId, password } = await request.json();

  if (!userId || !password) {
    return NextResponse.json({ message: '사용자 ID와 비밀번호가 필요합니다.' }, { status: 400 });
  }

  try {
    let users = await readUsers();
    const userIndex = users.findIndex((u: any) => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const userToDelete = users[userIndex];

    // In a real app, you'd compare hashed passwords
    if (userToDelete.password !== password) { // Placeholder for actual hashing comparison
      return NextResponse.json({ message: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    // Remove user from users.json
    users.splice(userIndex, 1);
    await writeUsers(users);

    // Delete user-specific data files
    await deleteUserFiles(userId);

    return NextResponse.json({ message: '회원 탈퇴가 성공적으로 처리되었습니다.' }, { status: 200 });
  } catch (error) {
    console.error('Error during account deletion:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
