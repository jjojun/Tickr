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

export async function POST(request: Request) {
  const { username, password, email } = await request.json();

  // 아이디 유효성 검사
  const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/;
  if (username.length > 10) {
    return NextResponse.json({ message: '아이디는 10자 이내로 설정해주세요.' }, { status: 400 });
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
  const hashedPassword = password; // Placeholder for actual hashing
  const verificationToken = uuidv4();

  const newUser = {
    id: users.length + 1,
    username,
    password: hashedPassword,
    email,
    verified: false,
    verificationToken,
  };

  users.push(newUser);
  writeUsers(users);

  // Simulate sending email
  console.log(`
    --------------------------------------------------
    이메일 인증 링크 (개발용 - 실제 이메일 발송 아님):
    http://localhost:3000/verify?token=${verificationToken}
    --------------------------------------------------
  `);

  return NextResponse.json({ message: '회원가입 성공! 이메일 인증을 완료해주세요.' }, { status: 200 });
}
