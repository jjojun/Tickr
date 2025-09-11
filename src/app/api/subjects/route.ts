import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const getSubjectsFilePath = (userId: string) => {
  const filePath = path.join(process.cwd(), `subjects_${userId}.json`);
  return filePath;
};

async function getSubjects(userId: string) {
  const filePath = getSubjectsFilePath(userId);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeSubjects(userId: string, subjects: string[]) {
  const filePath = getSubjectsFilePath(userId);
  await fs.writeFile(filePath, JSON.stringify(subjects, null, 2));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  try {
    const subjects = await getSubjects(userId);
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Failed to read subjects:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { subject, userId } = await req.json();

  if (!subject || !userId) {
    return NextResponse.json({ message: 'Missing required data (subject or userId).' }, { status: 400 });
  }

  try {
    const subjects = await getSubjects(userId);

    if (subjects.includes(subject)) {
      return NextResponse.json({ message: '이미 존재하는 과목입니다.' }, { status: 409 });
    }

    subjects.push(subject);
    await writeSubjects(userId, subjects);

    return NextResponse.json({ message: '과목이 추가되었습니다.', subject });
  } catch (error) {
    console.error('Failed to add subject:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { subject, userId } = await req.json();

  if (!subject || !userId) {
    return NextResponse.json({ message: 'Missing required data (subject or userId).' }, { status: 400 });
  }

  try {
    const subjects = await getSubjects(userId);
    const updatedSubjects = subjects.filter((s: string) => s !== subject);

    if (subjects.length === updatedSubjects.length) {
      return NextResponse.json({ message: '삭제할 과목을 찾을 수 없습니다.' }, { status: 404 });
    }

    await writeSubjects(userId, updatedSubjects);

    return NextResponse.json({ message: '과목이 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete subject:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}