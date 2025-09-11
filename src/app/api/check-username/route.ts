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

export async function POST(request: Request) {
  const { username } = await request.json();

  // 아이디 유효성 검사
  const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/;
  if (username.length > 10) {
    return NextResponse.json({ available: false, message: '아이디는 10자 이내로 설정해주세요.' }, { status: 200 });
  }
  if (!usernameRegex.test(username)) {
    return NextResponse.json({ available: false, message: '아이디는 영문자와 숫자로 구성되며, 최소 하나의 영문자를 포함해야 합니다.' }, { status: 200 });
  }

  const users = readUsers();

  const isDuplicate = users.some((user: any) => user.username === username);

  if (isDuplicate) {
    return NextResponse.json({ available: false, message: '이미 사용 중인 아이디입니다.' }, { status: 200 });
  } else {
    return NextResponse.json({ available: true, message: '사용 가능한 아이디입니다.' }, { status: 200 });
  }
}
