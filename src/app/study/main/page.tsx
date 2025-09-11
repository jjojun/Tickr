'use client';

import React from 'react';

export default function MainPage() {
  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-2xl font-bold text-gray-700 mb-4">환영합니다!</h3>
      <p className="text-gray-600 mb-4">
        이 프로젝트는 여러분의 학습 시간을 효율적으로 관리하고 기록할 수 있도록 돕기 위해 만들어졌습니다.<br />
        과목별 학습 시간을 측정하고, 기록을 확인하며, 학습 습관을 개선해보세요.
      </p>
      <p className="text-gray-600 mb-4">
        또한, 그룹 기능을 통해 친구들과 함께 학습 목표를 달성하고, 그룹 랭킹을 통해 서로 동기 부여를 받을 수 있습니다.
      </p>
      <p className="text-gray-600 mb-4">
        주요 기능:
      </p>
      <ul className="list-disc list-inside text-gray-600 mb-4">
        <li>과목별 학습 시간 기록 및 관리</li>
        <li>학습 기록 통계 확인</li>
        <li>간편한 과목 추가 및 삭제</li>
        <li>직관적인 타이머 기능</li>
        <li>그룹 생성, 가입, 탈퇴 및 관리</li>
        <li>그룹별 학습 랭킹 확인</li>
      </ul>
      <p className="text-gray-600">
        지금 바로 학습을 시작하고 여러분의 성장을 기록해보세요!
      </p>
    </div>
  );
}
