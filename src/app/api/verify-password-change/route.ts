import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function POST(request: Request) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ message: 'Token is required.' }, { status: 400 });
  }

  const users = readUsers();
  const userIndex = users.findIndex((u: any) => u.passwordVerificationToken === token);

  if (userIndex === -1) {
    return NextResponse.json({ message: '유효하지 않거나 만료된 인증 토큰입니다.' }, { status: 400 });
  }

  // Finalize password change
  users[userIndex].password = users[userIndex].pendingPassword;
  users[userIndex].pendingPassword = undefined; // Clear pending password
  users[userIndex].passwordVerificationToken = undefined; // Clear token
  writeUsers(users);

  return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다!' }, { status: 200 });
}
