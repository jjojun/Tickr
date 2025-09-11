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
  const { userId, email } = await request.json();

  if (!userId || !email) {
    return NextResponse.json({ message: 'User ID and email are required.' }, { status: 400 });
  }

  const users = readUsers();
  const userIndex = users.findIndex((u: any) => u.id === userId);

  if (userIndex === -1) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  // Check if new email is already the current email
  if (users[userIndex].email === email) {
    return NextResponse.json({ message: '현재 이메일과 동일합니다.' }, { status: 400 });
  }

  // Check if new email already exists for another user
  if (users.some((u: any) => u.email === email && u.id !== userId)) {
    return NextResponse.json({ message: '이미 사용 중인 이메일입니다.' }, { status: 409 });
  }

  const emailVerificationToken = uuidv4();
  users[userIndex].pendingEmail = email;
  users[userIndex].emailVerificationToken = emailVerificationToken;
  writeUsers(users);

  // Simulate sending email
  console.log(`
    --------------------------------------------------
    이메일 변경 인증 링크 (개발용 - 실제 이메일 발송 아님):
    http://localhost:3000/verify-email-change?token=${emailVerificationToken}
    --------------------------------------------------
  `);

  return NextResponse.json({ message: '새 이메일로 인증 링크가 발송되었습니다. 확인해주세요.' }, { status: 200 });
}
