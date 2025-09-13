import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sendVerificationEmail } from '@/lib/email';
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

  const newCode = Math.random().toString().slice(2, 8); // Generate 6-digit code
  const { emailChange: emailChangeVerificationCodes } = getVerificationStores();
  emailChangeVerificationCodes.set(email, { code: newCode, timestamp: Date.now() });

  users[userIndex].pendingEmail = email;
  // users[userIndex].emailVerificationToken = undefined; // No longer needed
  writeUsers(users);

  const subject = '[Tickr] 이메일 변경 인증번호';
  const text = `이메일 변경 인증번호는 ${newCode} 입니다. 3분 이내에 입력해주세요.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #0056b3;">[Tickr] 이메일 변경 인증번호 안내</h2>
      <p>안녕하세요,</p>
      <p>요청하신 이메일 변경 인증번호는 다음과 같습니다:</p>
      <p style="font-size: 24px; font-weight: bold; color: #0056b3; background-color: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;">
        ${newCode}
      </p>
      <p>이 인증번호는 3분 이내에 입력해야 유효합니다.</p>
      <p>감사합니다.<br/>Tickr 팀 드림</p>
    </div>
  `;

  const emailResult = await sendVerificationEmail(email, subject, text, html);

  if (!emailResult.success) {
    console.error('Failed to send email change verification email:', emailResult.error);
    return NextResponse.json({ message: '이메일 변경 인증 이메일 전송에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ message: '새 이메일로 인증번호가 발송되었습니다. 확인해주세요.' }, { status: 200 });
}
