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

  const { emailChange: emailChangeVerificationCodes } = getVerificationStores();
  const storedEntry = emailChangeVerificationCodes.get(email);

  if (!storedEntry || storedEntry.code !== code) {
    return NextResponse.json({ message: '인증 코드가 올바르지 않습니다.' }, { status: 400 });
  }

  // Check if code has expired (e.g., 3 minutes)
  if (Date.now() - storedEntry.timestamp > 3 * 60 * 1000) {
    emailChangeVerificationCodes.delete(email);
    return NextResponse.json({ message: '인증 코드가 만료되었습니다. 다시 시도해주세요.' }, { status: 400 });
  }

  const users = readUsers();
  const userIndex = users.findIndex((u: any) => u.pendingEmail === email);

  if (userIndex === -1) {
    return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  // Finalize email change
  users[userIndex].email = users[userIndex].pendingEmail;
  users[userIndex].pendingEmail = undefined; // Clear pending email
  // users[userIndex].emailVerificationToken = undefined; // No longer needed
  writeUsers(users);
  emailChangeVerificationCodes.delete(email); // Clear code after successful verification

  return NextResponse.json({ message: '이메일이 성공적으로 변경되었습니다!' }, { status: 200 });
}
