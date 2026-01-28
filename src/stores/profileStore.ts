/**
 * 프로필 관리 스토어
 * 사용자 정보 저장/로드
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradeLevel } from '../types';

// 학년 타입
export type SchoolType = 'elementary' | 'middle' | 'high';
export type GradeNumber = 1 | 2 | 3 | 4 | 5 | 6;

// 프로필 타입
export interface UserProfile {
  nickname: string;
  schoolType: SchoolType;
  grade: GradeNumber;
  character: string;
  heartCount: number;
  createdAt: number;
  updatedAt: number;
}

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;

  // 액션
  loadProfile: () => Promise<void>;
  saveProfile: (profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'createdAt' | 'updatedAt'>>) => Promise<void>;
  clearProfile: () => Promise<void>;
  incrementHeartCount: () => Promise<void>;
  resetHeartCount: () => Promise<void>;
  getGradeLevel: () => GradeLevel;
}

const STORAGE_KEY = '@careercompass_profile';

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

// 기본 프로필
const defaultProfile: UserProfile = {
  nickname: '탐험가',
  schoolType: 'elementary',
  grade: 5,
  character: 'Female_1',
  heartCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,

  // 프로필 로드
  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const profile: UserProfile = JSON.parse(stored);
        set({ profile });
      } else {
        // 기본 프로필 설정
        set({ profile: defaultProfile });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      set({ profile: defaultProfile });
    } finally {
      set({ isLoading: false });
    }
  },

  // 프로필 저장
  saveProfile: async (profileData) => {
    const newProfile: UserProfile = {
      ...profileData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      set({ profile: newProfile });
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  },

  // 프로필 업데이트
  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;

    const updatedProfile: UserProfile = {
      ...profile,
      ...updates,
      updatedAt: Date.now(),
    };

    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      set({ profile: updatedProfile });
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // 프로필 삭제
  clearProfile: async () => {
    try {
      await storage.removeItem(STORAGE_KEY);
      set({ profile: defaultProfile });
    } catch (error) {
      console.error('Failed to clear profile:', error);
      throw error;
    }
  },

  // 하트 개수 증가
  incrementHeartCount: async () => {
    const { profile } = get();
    if (!profile) return;

    const updatedProfile: UserProfile = {
      ...profile,
      heartCount: (profile.heartCount || 0) + 1,
      updatedAt: Date.now(),
    };

    try {
      // 비동기로 저장하지만 상태는 즉시 업데이트하여 반응성 높임
      set({ profile: updatedProfile });
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Failed to increment heart count:', error);
    }
  },

  // 하트 개수 초기화 (테스트용)
  resetHeartCount: async () => {
    const { profile } = get();
    if (!profile) return;

    const updatedProfile: UserProfile = {
      ...profile,
      heartCount: 0,
      updatedAt: Date.now(),
    };

    try {
      set({ profile: updatedProfile });
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Failed to reset heart count:', error);
    }
  },

  // 학년에 맞는 GradeLevel 반환
  getGradeLevel: () => {
    const { profile } = get();
    if (!profile) return 'elementary_lower';

    switch (profile.schoolType) {
      case 'elementary':
        return profile.grade <= 3 ? 'elementary_lower' : 'elementary_lower';
      case 'middle':
        return 'middle';
      case 'high':
        return 'high';
      default:
        return 'elementary_lower';
    }
  },
}));

// 학교 타입 한글 변환
export const getSchoolTypeLabel = (type: SchoolType): string => {
  switch (type) {
    case 'elementary':
      return '초등학교';
    case 'middle':
      return '중학교';
    case 'high':
      return '고등학교';
    default:
      return '초등학교';
  }
};

// 전체 학년 문자열 반환
export const getFullGradeLabel = (schoolType: SchoolType, grade: GradeNumber): string => {
  return `${getSchoolTypeLabel(schoolType)} ${grade}학년`;
};

// 짧은 학년 문자열 반환 (예: "초등2", "중2", "고2")
export const getShortGradeLabel = (schoolType: SchoolType, grade: GradeNumber): string => {
  switch (schoolType) {
    case 'elementary':
      return `초등${grade}`;
    case 'middle':
      return `중${grade}`;
    case 'high':
      return `고${grade}`;
    default:
      return `초등${grade}`;
  }
};
