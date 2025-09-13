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

export async function POST(request: Request) {
  const { username, password, email } = await request.json();

  // 아이디 유효성 검사
  const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/;
  if (username.length > 15) {
    return NextResponse.json({ message: '아이디는 15자 이내로 설정해주세요.' }, { status: 400 });
  }
  if (!usernameRegex.test(username)) {
    return NextResponse.json({ message: '아이디는 영문자와 숫자로 구성되며, 최소 하나의 영문자를 포함해야 합니다.' }, { status: 400 });
  }

  // 비밀번호 유효성 검사
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return NextResponse.json({ message: '비밀번호는 8자 이상이어야 하며, 하나 이상의 대문자, 숫자, 특수문자를 포함해야 합니다.' }, { status: 400 });
  }

  const users = readUsers();

  // Check if username or email already exists
  if (users.some((user: any) => user.username === username)) {
    return NextResponse.json({ message: '이미 존재하는 아이디입니다.' }, { status: 409 });
  }
  if (users.some((user: any) => user.email === email)) {
    return NextResponse.json({ message: '이미 등록된 이메일입니다.' }, { status: 409 });
  }

  // In a real app, you'd hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    username,
    password: hashedPassword,
    email,
    verified: false,
  };

  users.push(newUser);
  writeUsers(users);

  const { signup: signupVerificationCodes } = getVerificationStores();
  const newCode = Math.random().toString().slice(2, 8); // Generate 6-digit code
  signupVerificationCodes.set(email, { code: newCode, timestamp: Date.now() });

  const subject = '[Tickr] 회원가입 인증번호';
  const text = `회원가입 인증번호는 ${newCode} 입니다. 3분 이내에 입력해주세요.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #0056b3;">[Tickr] 회원가입 인증번호 안내</h2>
      <p>안녕하세요,</p>
      <p>회원가입을 완료하려면 다음 인증번호를 입력해주세요:</p>
      <p style="font-size: 24px; font-weight: bold; color: #0056b3; background-color: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;">
        ${newCode}
      </p>
      <p>이 인증번호는 3분 이내에 입력해야 유효합니다.</p>
      <p>감사합니다.<br/>Tickr 팀 드림</p>
    </div>
  `;

  const emailResult = await sendVerificationEmail(email, subject, text, html);

  if (!emailResult.success) {
    console.error('Failed to send verification email:', emailResult.error);
    return NextResponse.json({ message: '회원가입은 성공했지만, 인증 이메일 전송에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ message: '회원가입 성공! 이메일로 전송된 인증번호를 입력해주세요.' }, { status: 200 });
}
