'use client';

import React, { useState, useEffect } from 'react';
import { useStudyContext } from '../../contexts/StudyContext';
import { useToast } from '../../contexts/ToastContext';

interface GroupMember {
  userId: string;
  joinedAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  ownerId: string;
  members: GroupMember[];
  password?: string;
  memberLimit?: number;
}

interface RankingEntry {
  userId: string;
  username: string;
  totalStudyDuration: number;
}

export default function GroupsPage() {
  const { userId } = useStudyContext();
  const { addToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupRanking, setGroupRanking] = useState<RankingEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMemberLimit, setNewGroupMemberLimit] = useState<number | string>('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupPassword, setNewGroupPassword] = useState('');
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [deleteGroupPassword, setDeleteGroupPassword] = useState('');
  const [joinGroupPassword, setJoinGroupPassword] = useState('');

  // Helper to format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchGroupsData = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/groups?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        // The API now returns only the groups the user is a member of.
        // If the user is in a group, data.groups will have one item.
        if (data.groups.length > 0) {
          setUserGroup(data.groups[0]);
        } else {
          setUserGroup(null);
        }
        // We also need to fetch all groups for the search functionality.
        fetchAllGroupsForSearch();
      } else {
        addToast('가입한 그룹 정보를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류로 가입한 그룹 정보를 불러올 수 없습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGroupsForSearch = async () => {
    try {
      // Fetch all groups for the search/discovery feature
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
        setFilteredGroups(data.groups);
      } else {
        addToast('전체 그룹 목록을 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류로 전체 그룹 목록을 불러올 수 없습니다.', 'error');
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchGroupsData();
  }, [userId, addToast]);

  // New useEffect to filter groups based on searchTerm
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const newFilteredGroups = groups.filter(group =>
      group.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      group.description.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredGroups(newFilteredGroups);
    setSelectedGroup(null); // Clear selected group when search term changes
  }, [searchTerm, groups]);

  // Fetch group ranking when userGroup is set
  useEffect(() => {
    if (userGroup) {
      const fetchRanking = async () => {
        try {
          const response = await fetch(`/api/groups/${userGroup.id}/ranking`);
          if (response.ok) {
            const data = await response.json();
            setGroupRanking(data.ranking);
          } else {
            addToast('그룹 랭킹을 불러오는데 실패했습니다.', 'error');
          }
        } catch (error) {
          addToast('네트워크 오류로 그룹 랭킹을 불러올 수 없습니다.', 'error');
        }
      };
      fetchRanking();
    } else {
      setGroupRanking([]); // Clear ranking if user is not in a group
    }
  }, [userGroup, addToast]);

  const handleJoinGroup = async (groupId: string) => {
    if (!userId) {
      addToast('로그인이 필요합니다.', 'error');
      return;
    }
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          userId,
          password: joinGroupPassword,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setUserGroup(data.group);
        addToast('그룹에 성공적으로 가입했습니다!', 'success');
        setJoinGroupPassword('');
      } else {
        const errorData = await response.json();
        addToast(errorData.message || '그룹 가입에 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류로 그룹 가입에 실패했습니다.', 'error');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!userId) {
      addToast('로그인이 필요합니다.', 'error');
      return;
    }
    try {
      const response = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, userId }),
      });
      if (response.ok) {
        setUserGroup(null);
        setSelectedGroup(null);
        addToast('그룹을 성공적으로 탈퇴했습니다.', 'success');
        fetchGroupsData();
      } else {
        const errorData = await response.json();
        addToast(errorData.message || '그룹 탈퇴에 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류로 그룹 탈퇴에 실패했습니다.', 'error');
    }
  };

  const handleCreateGroup = async () => {
    if (!userId) {
      addToast('로그인이 필요합니다.', 'error');
      return;
    }
    if (!newGroupName.trim()) {
      addToast('그룹 이름을 입력해주세요.', 'error');
      return;
    }
    if (newGroupMemberLimit && (isNaN(Number(newGroupMemberLimit)) || Number(newGroupMemberLimit) <= 0)) {
      addToast('유효한 인원수를 입력해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
          ownerId: userId,
          memberLimit: newGroupMemberLimit ? Number(newGroupMemberLimit) : undefined,
          password: newGroupPassword || undefined,
        }),
      });

      if (response.ok) {
        addToast('그룹이 성공적으로 생성되었습니다!', 'success');
        setShowCreateGroupModal(false);
        setNewGroupName('');
        setNewGroupMemberLimit('');
        setNewGroupDescription('');
        setNewGroupPassword('');
        fetchGroupsData();
      } else {
        const errorData = await response.json();
        addToast(errorData.message || '그룹 생성에 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류로 그룹 생성에 실패했습니다.', 'error');
    }
  };

  const handleDeleteGroup = async () => {
    if (!userId || !userGroup) {
      addToast('로그인이 필요하거나 그룹 정보가 없습니다.', 'error');
      return;
    }
    if (userGroup.ownerId !== userId) {
      addToast('그룹 소유자만 삭제할 수 있습니다.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/groups/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: userGroup.id,
          userId: userId,
          password: deleteGroupPassword,
        }),
      });

      if (response.ok) {
        addToast('그룹이 성공적으로 삭제되었습니다!', 'success');
        setShowDeleteGroupModal(false);
        setDeleteGroupPassword('');
        setUserGroup(null);
        fetchGroupsData();
      } else {
        const errorData = await response.json();
        addToast(errorData.message || '그룹 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      addToast('네트워크 오류로 그룹 삭제에 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">그룹 정보를 불러오는 중...</div>;
  }

  if (!userId) {
    return <div className="text-center text-red-600">그룹 기능을 사용하려면 로그인해주세요.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">그룹</h2>

      {userGroup ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">내 그룹: {userGroup.name}</h3>
          <p className="text-gray-600 mb-2">가입자수: {userGroup.members.length}명</p>

          <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-3">그룹 랭킹</h4>
          {groupRanking.length === 0 ? (
            <p className="text-gray-600">아직 그룹 랭킹 데이터가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {groupRanking.map((entry, index) => (
                <li key={entry.userId} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                  <span className="font-semibold text-gray-800">{index + 1}. {entry.username}</span>
                  <span className="text-blue-700 font-bold">{formatDuration(entry.totalStudyDuration)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => handleLeaveGroup(userGroup.id)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              그룹 탈퇴하기
            </button>
            {userGroup.ownerId === userId && (
              <button
                onClick={() => setShowDeleteGroupModal(true)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                그룹 삭제하기
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center space-x-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="그룹 이름 또는 설명으로 검색"
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-200 whitespace-nowrap"
            >
              그룹 만들기
            </button>
          </div>

          <h3 className="text-xl font-semibold text-gray-700 mb-4">생성된 그룹 목록</h3>
          {filteredGroups.length === 0 ? (
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {filteredGroups.map((group) => (
                <li
                  key={group.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition duration-200"
                  onClick={() => {
                    setSelectedGroup(group);
                    setJoinGroupPassword('');
                  }}
                >
                  <h4 className="text-lg font-semibold text-gray-800">{group.name}</h4>
                  <p className="text-sm text-gray-500">{group.description}</p>
                  <p className="text-xs text-gray-400">가입자수: {group.members.length}명</p>
                </li>
              ))}
            </ul>
          )}

          {selectedGroup && (
            <div className="mt-6 p-6 bg-blue-50 rounded-lg shadow-inner">
              <h3 className="text-xl font-bold text-blue-800 mb-4">{selectedGroup.name}</h3>
              <p className="text-blue-700 mb-2">설명: {selectedGroup.description}</p>
              <p className="text-blue-700 mb-2">가입자수: {selectedGroup.members.length}명</p>
              <p className="text-blue-700 mb-4">생성일: {new Date(selectedGroup.createdAt).toLocaleDateString()}</p>
              {selectedGroup.password && (
                <div className="mb-4">
                  <label htmlFor="joinPassword" className="block text-blue-700 text-sm font-bold mb-2">그룹 비밀번호:</label>
                  <input
                    type="password"
                    id="joinPassword"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={joinGroupPassword}
                    onChange={(e) => setJoinGroupPassword(e.target.value)}
                    placeholder="그룹 비밀번호를 입력하세요."
                  />
                </div>
              )}
              <button
                onClick={() => handleJoinGroup(selectedGroup.id)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                그룹 가입하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">새 그룹 만들기</h3>
            <div className="mb-4">
              <label htmlFor="groupName" className="block text-gray-700 text-sm font-bold mb-2">그룹 이름:</label>
              <input
                type="text"
                id="groupName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="예: 새벽반 스터디"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="memberLimit" className="block text-gray-700 text-sm font-bold mb-2">제한 인원수 (선택 사항):</label>
              <input
                type="number"
                id="memberLimit"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newGroupMemberLimit}
                onChange={(e) => setNewGroupMemberLimit(e.target.value)}
                placeholder="예: 10 (비워두면 제한 없음)"
                min="1"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">설명:</label>
              <textarea
                id="description"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="그룹에 대한 설명을 입력하세요."
              ></textarea>
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">비밀번호 (선택 사항):</label>
              <input
                type="password"
                id="password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newGroupPassword}
                onChange={(e) => setNewGroupPassword(e.target.value)}
                placeholder="그룹 삭제 시 필요합니다."
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                취소
              </button>
              <button
                onClick={handleCreateGroup}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                그룹 만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteGroupModal && userGroup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">그룹 삭제 확인</h3>
            <p className="text-gray-700 mb-4">정말로 <span className="font-semibold">{userGroup.name}</span> 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            {userGroup.password && (
              <div className="mb-4">
                <label htmlFor="deletePassword" className="block text-gray-700 text-sm font-bold mb-2">비밀번호:</label>
                <input
                  type="password"
                  id="deletePassword"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={deleteGroupPassword}
                  onChange={(e) => setDeleteGroupPassword(e.target.value)}
                  placeholder="그룹 비밀번호를 입력하세요."
                />
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteGroupModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                취소
              </button>
              <button
                onClick={handleDeleteGroup}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}