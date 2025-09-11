import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

const usersFilePath = path.resolve(process.cwd(), 'users.json');

// Helper to read users from file
const readUsers = () => {
  if (!fs.existsSync(usersFilePath)) {
    return [];
  }
  const data = fs.readFileSync(usersFilePath, 'utf-8');
  return JSON.parse(data);
};

// Helper to write users to file
const writeUsers = (users: any[]) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
};

export async function PUT(request: Request) {
  const { userId, currentPassword, newPassword } = await request.json();

  if (!userId || !currentPassword || !newPassword) {
    return NextResponse.json({ message: 'User ID, current password, and new password are required.' }, { status: 400 });
  }

  const users = readUsers();
  const userIndex = users.findIndex((u: any) => u.id === userId);

  if (userIndex === -1) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  // In a real app, you'd compare hashed passwords
  if (users[userIndex].password !== currentPassword) { // Placeholder for actual hashing comparison
    return NextResponse.json({ message: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  // Check if new password is same as current
  if (newPassword === currentPassword) {
    return NextResponse.json({ message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' }, { status: 400 });
  }

  const passwordVerificationToken = uuidv4();
  users[userIndex].pendingPassword = newPassword;
  users[userIndex].passwordVerificationToken = passwordVerificationToken;
  writeUsers(users);

  // Simulate sending email
  console.log(`
    --------------------------------------------------
    비밀번호 변경 인증 링크 (개발용 - 실제 이메일 발송 아님):
    http://localhost:3000/verify-password-change?token=${passwordVerificationToken}
    --------------------------------------------------
  `);

  return NextResponse.json({ message: '비밀번호 변경 인증 링크가 이메일로 발송되었습니다. 확인해주세요.' }, { status: 200 });
}
