'use client';

import React, { useState } from 'react';
import { useStudyContext } from '../../contexts/StudyContext';

export default function SubjectsPage() {
  const {
    subject,
    setSubject,
    subjects,
    subjectColors,
    addSubject,
    deleteSubject,
  } = useStudyContext();
  const [newSubject, setNewSubject] = useState('');

  const handleAddSubject = async () => {
    if (newSubject.trim() !== '') {
      await addSubject(newSubject);
      setNewSubject('');
    }
  };

  const handleDeleteSubject = async (subjectToDelete: string) => {
    await deleteSubject(subjectToDelete);
  };

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-gray-800 mb-4">과목 관리</h2>
      <p className="text-gray-600 mb-6">학습할 과목을 추가하고 관리하세요. 등록된 과목을 선택하여 타이머를 시작할 수 있습니다.</p>

      <div className="mb-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-2xl font-bold text-gray-700 mb-4">새 과목 추가</h3>
        <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <input
            type="text"
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900"
            placeholder="새 과목 추가"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />
          <button
            onClick={handleAddSubject}
            className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-200"
          >
            추가
          </button>
        </div>
      </div>

      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-2xl font-bold text-gray-700 mb-4">등록된 과목 ({subjects.length}개)</h3>
        {subjects.length === 0 ? (
          <p className="text-gray-600">아직 등록된 과목이 없습니다. 새로운 과목을 추가해보세요!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <div key={s} className={`relative`}>
                <button
                  onClick={() => setSubject(s)}
                  className={`font-semibold px-4 py-2 rounded-full text-white ${subjectColors[s]} ${subject === s ? 'ring-2 ring-blue-500' : ''}`}>
                  {s}
                </button>
                <button
                  onClick={() => handleDeleteSubject(s)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
                  aria-label="삭제"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}