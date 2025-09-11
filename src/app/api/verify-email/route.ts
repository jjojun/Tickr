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

  const users = readUsers();

  const userIndex = users.findIndex((u: any) => u.verificationToken === token);

  if (userIndex === -1) {
    return NextResponse.json({ message: '유효하지 않거나 만료된 인증 토큰입니다.' }, { status: 400 });
  }

  if (users[userIndex].verified) {
    return NextResponse.json({ message: '이미 인증된 계정입니다.' }, { status: 200 });
  }

  users[userIndex].verified = true;
  users[userIndex].verificationToken = undefined; // Clear token after verification
  writeUsers(users);

  return NextResponse.json({ message: '이메일 인증이 성공적으로 완료되었습니다!' }, { status: 200 });
}
