import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sendVerificationEmail } from '@/lib/email';
import { getVerificationStores } from '@/lib/verificationStore';
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

  // Compare current password with hashed password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[userIndex].password);
  if (!isCurrentPasswordValid) {
    return NextResponse.json({ message: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  // Check if new password is same as current
  if (newPassword === currentPassword) {
    return NextResponse.json({ message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' }, { status: 400 });
  }

  // 새 비밀번호 유효성 검사
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return NextResponse.json({ message: '새 비밀번호는 8자 이상이어야 하며, 하나 이상의 대문자, 숫자, 특수문자를 포함해야 합니다.' }, { status: 400 });
  }

  const newCode = Math.random().toString().slice(2, 8); // Generate 6-digit code
  const { passwordChange: passwordChangeVerificationCodes } = getVerificationStores();
  passwordChangeVerificationCodes.set(userId, { code: newCode, timestamp: Date.now() });

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  users[userIndex].pendingPassword = hashedNewPassword;
  // users[userIndex].passwordVerificationToken = undefined; // No longer needed
  writeUsers(users);

  const subject = '[Tickr] 비밀번호 변경 인증번호';
  const text = `비밀번호 변경 인증번호는 ${newCode} 입니다. 3분 이내에 입력해주세요.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #0056b3;">[Tickr] 비밀번호 변경 인증번호 안내</h2>
      <p>안녕하세요,</p>
      <p>요청하신 비밀번호 변경 인증번호는 다음과 같습니다:</p>
      <p style="font-size: 24px; font-weight: bold; color: #0056b3; background-color: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;">
        ${newCode}
      </p>
      <p>이 인증번호는 3분 이내에 입력해야 유효합니다.</p>
      <p>감사합니다.<br/>Tickr 팀 드림</p>
    </div>
  `;

  const emailResult = await sendVerificationEmail(users[userIndex].email, subject, text, html);

  if (!emailResult.success) {
    console.error('Failed to send password change verification email:', emailResult.error);
    return NextResponse.json({ message: '비밀번호 변경 인증 이메일 전송에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ message: '비밀번호 변경 인증번호가 이메일로 발송되었습니다. 확인해주세요.' }, { status: 200 });
}
