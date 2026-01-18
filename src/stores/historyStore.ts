/**
 * 검사 히스토리 관리 스토어
 * 웹: localStorage, 네이티브: AsyncStorage 사용
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CareerScores, GradeLevel, CareerField } from '../types';

// 저장되는 결과 타입
export interface SavedResult {
  id: string;
  timestamp: number;
  level: GradeLevel;
  scores: CareerScores;
  topCareer: CareerField;
  topScore: number;
  // 프로필 정보 (선택)
  nickname?: string;
  grade?: string;
}

interface HistoryState {
  results: SavedResult[];
  isLoading: boolean;

  // 액션
  loadHistory: () => Promise<void>;
  saveResult: (result: Omit<SavedResult, 'id' | 'timestamp'>) => Promise<SavedResult>;
  deleteResult: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  getResultById: (id: string) => SavedResult | undefined;
}

const STORAGE_KEY = '@careercompass_history';

// 플랫폼별 스토리지 헬퍼
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return await AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
      return;
    }
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  results: [],
  isLoading: false,

  // 히스토리 로드
  loadHistory: async () => {
    set({ isLoading: true });
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const results: SavedResult[] = JSON.parse(stored);
        // 최신순 정렬
        results.sort((a, b) => b.timestamp - a.timestamp);
        set({ results });
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // 결과 저장
  saveResult: async (result) => {
    const newResult: SavedResult = {
      ...result,
      id: `result_${Date.now()}`,
      timestamp: Date.now(),
    };

    try {
      const { results } = get();
      const updatedResults = [newResult, ...results];

      // 최대 50개까지만 저장
      const limitedResults = updatedResults.slice(0, 50);

      await storage.setItem(STORAGE_KEY, JSON.stringify(limitedResults));
      set({ results: limitedResults });

      return newResult;
    } catch (error) {
      console.error('Failed to save result:', error);
      throw error;
    }
  },

  // 결과 삭제
  deleteResult: async (id) => {
    try {
      const { results } = get();
      const updatedResults = results.filter(r => r.id !== id);

      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
      set({ results: updatedResults });
    } catch (error) {
      console.error('Failed to delete result:', error);
      throw error;
    }
  },

  // 전체 히스토리 삭제
  clearHistory: async () => {
    try {
      await storage.removeItem(STORAGE_KEY);
      set({ results: [] });
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  },

  // ID로 결과 조회
  getResultById: (id) => {
    const { results } = get();
    return results.find(r => r.id === id);
  },
}));

// 레벨 한글 변환
export const getLevelLabel = (level: GradeLevel): string => {
  switch (level) {
    case 'elementary_lower':
      return '초등 저학년';
    case 'elementary_upper':
      return '초등 고학년';
    case 'middle':
      return '중학생';
    case 'high':
      return '고등학생';
    default:
      return '초등학생';
  }
};

// 날짜 포맷
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

// 결과 제목 포맷 (이름 + 학년 + 날짜)
export const formatResultTitle = (result: SavedResult): string => {
  const parts: string[] = [];

  // 이름
  if (result.nickname) {
    parts.push(result.nickname);
  }

  // 학년
  if (result.grade) {
    parts.push(result.grade);
  } else {
    parts.push(getLevelLabel(result.level));
  }

  // 날짜
  parts.push(formatDate(result.timestamp));

  return parts.join(' · ');
};
