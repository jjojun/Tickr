'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface IndividualRankingEntry {
  username: string;
  totalDuration: number;
}

interface GroupRankingEntry {
  groupId: string;
  groupName: string;
  totalDuration: number;
  memberCount: number;
}

export default function RankingPage() {
  const [individualRanking, setIndividualRanking] = useState<IndividualRankingEntry[]>([]);
  const [groupRanking, setGroupRanking] = useState<GroupRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [rankingMode, setRankingMode] = useState<'individual' | 'group'>('individual');
  const [showFilterOptions, setShowFilterOptions] = useState(false); // New state for filter dropdown

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        let response;
        if (rankingMode === 'individual') {
          response = await fetch('/api/ranking');
        } else { // rankingMode === 'group'
          response = await fetch('/api/ranking/groups');
        }

        if (response.ok) {
          const data = await response.json();
          if (rankingMode === 'individual') {
            setIndividualRanking(data.ranking);
          } else {
            setGroupRanking(data.ranking);
          }
        } else {
          addToast('랭킹을 불러오는데 실패했습니다.', 'error');
        }
      } catch (error) {
        console.error('Failed to fetch ranking:', error);
        addToast('네트워크 오류로 랭킹을 불러올 수 없습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [addToast, rankingMode]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRankColorClass = (index: number) => {
    if (index === 0) return 'bg-yellow-100 border-yellow-300'; // 1st place
    if (index === 1) return 'bg-gray-100 border-gray-300';   // 2nd place
    if (index === 2) return 'bg-yellow-50 border-yellow-200';  // 3rd place
    return 'bg-white border-gray-100';
  };

  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 relative"> {/* Added relative */}
      <h3 className="text-2xl font-bold text-gray-700 mb-4">오늘의 학습 랭킹</h3>
      <p className="text-gray-600 mb-6">지난 24시간 동안의 학습 시간을 기준으로 한 랭킹입니다.</p>

      {/* Filter Icon */}
      <button
        onClick={() => setShowFilterOptions(!showFilterOptions)}
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full"
        title="랭킹 필터"
      >
        <i className="fas fa-filter"></i>
      </button>

      {/* Filter Options Dropdown */}
      {showFilterOptions && (
        <div className="absolute top-14 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <button
            onClick={() => {
              setRankingMode('individual');
              setShowFilterOptions(false);
            }}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            개인 랭킹
          </button>
          <button
            onClick={() => {
              setRankingMode('group');
              setShowFilterOptions(false);
            }}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            그룹 랭킹
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600">랭킹 불러오는 중...</div>
      ) : (
        <>
          {rankingMode === 'individual' && (
            individualRanking.length === 0 ? (
              <p className="text-gray-600 text-center">아직 개인 랭킹 데이터가 없습니다. 학습을 시작해보세요!</p>
            ) : (
              <ul className="space-y-3">
                {individualRanking.map((entry, index) => (
                  <li key={entry.username} className={`p-4 rounded-lg shadow-sm border flex justify-between items-center ${getRankColorClass(index)}`}>
                    <div className="flex items-center">
                      <span className="font-bold text-lg mr-3">#{index + 1}</span>
                      <span className="text-lg font-semibold text-gray-800">{entry.username}</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{formatTime(entry.totalDuration)}</span>
                  </li>
                ))}
              </ul>
            )
          )}

          {rankingMode === 'group' && (
            groupRanking.length === 0 ? (
              <p className="text-gray-600 text-center">아직 그룹 랭킹 데이터가 없습니다. 그룹을 만들거나 가입해보세요!</p>
            ) : (
              <ul className="space-y-3">
                {groupRanking.map((entry, index) => (
                  <li key={entry.groupId} className={`p-4 rounded-lg shadow-sm border flex justify-between items-center ${getRankColorClass(index)}`}>
                    <div className="flex items-center">
                      <span className="font-bold text-lg mr-3">#{index + 1}</span>
                      <span className="text-lg font-semibold text-gray-800">{entry.groupName}</span>
                      <span className="ml-2 text-sm text-gray-500">({entry.memberCount}명)</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{formatTime(entry.totalDuration)}</span>
                  </li>
                ))}
              </ul>
            )
          )}
        </>
      )}
    </div>
  );
}