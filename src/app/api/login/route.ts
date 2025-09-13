import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const usersFilePath = path.resolve(process.cwd(), 'users.json');

// Helper to read users from file
const readUsers = () => {
  if (!fs.existsSync(usersFilePath)) {
    return [];
  }
  const data = fs.readFileSync(usersFilePath, 'utf-8');
  return JSON.parse(data);
};

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const users = readUsers();

  const user = users.find((u: any) => u.username === username);

  if (!user) {
    return NextResponse.json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  // In a real app, you'd compare hashed passwords
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) { // Placeholder for actual hashing comparison
    return NextResponse.json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  if (!user.verified) {
    return NextResponse.json({ message: '이메일 인증이 필요합니다.' }, { status: 403 });
  }

  // In a real app, you'd create a session or JWT token here
  return NextResponse.json({ message: '로그인 성공!', user: { id: user.id, username: user.username, email: user.email }, redirectUrl: '/study/timer' }, { status: 200 });
}
