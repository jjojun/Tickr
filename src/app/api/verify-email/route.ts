import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getVerificationStores } from '@/lib/verificationStore';

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
  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json({ message: '이메일과 인증 코드가 필요합니다.' }, { status: 400 });
  }

  const { signup: signupVerificationCodes } = getVerificationStores();
  const storedEntry = signupVerificationCodes.get(email);

  if (!storedEntry || storedEntry.code !== code) {
    return NextResponse.json({ message: '인증 코드가 올바르지 않습니다.' }, { status: 400 });
  }

  // Check if code has expired (e.g., 3 minutes)
  if (Date.now() - storedEntry.timestamp > 3 * 60 * 1000) {
    signupVerificationCodes.delete(email);
    return NextResponse.json({ message: '인증 코드가 만료되었습니다. 다시 시도해주세요.' }, { status: 400 });
  }

  const users = readUsers();

  const userIndex = users.findIndex((u: any) => u.email === email);

  if (userIndex === -1) {
    return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (users[userIndex].verified) {
    return NextResponse.json({ message: '이미 인증된 계정입니다.' }, { status: 200 });
  }

  users[userIndex].verified = true;
  // No need to clear verificationToken from user object as it's not stored there anymore
  writeUsers(users);
  signupVerificationCodes.delete(email); // Clear code after successful verification

  return NextResponse.json({ message: '이메일 인증이 성공적으로 완료되었습니다!' }, { status: 200 });
