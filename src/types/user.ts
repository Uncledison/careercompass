/**
 * Career Compass - User Type Definitions
 */

import { GradeLevel, Grade, AssessmentResult } from './assessment';

// 사용자 역할
export type UserRole = 'student' | 'parent' | 'teacher';

// 성별
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// 사용자 기본 정보
export interface User {
  id: string;
  role: UserRole;
  nickname: string;
  birthYear: number;
  gender?: Gender;
  gradeLevel: GradeLevel;
  grade: Grade;
  createdAt: number;
  updatedAt: number;
  parentId?: string;  // 학생인 경우 연결된 학부모
  childrenIds?: string[]; // 학부모인 경우 연결된 자녀들
}

// 학생 프로필
export interface StudentProfile extends User {
  role: 'student';
  avatarType: number; // 캐릭터 타입
  totalBadges: number;
  assessmentHistory: AssessmentResult[];
  lastAssessmentAt?: number;
}

// 학부모 프로필
export interface ParentProfile extends User {
  role: 'parent';
  email: string;
  phoneVerified: boolean;
  children: StudentProfile[];
}

// 온보딩 상태
export interface OnboardingState {
  hasSeenIntro: boolean;
  hasSelectedRole: boolean;
  hasEnteredProfile: boolean;
  hasParentConsent: boolean; // 만 14세 미만인 경우
  completedAt?: number;
}

// 앱 설정
export interface UserSettings {
  userId: string;
  notifications: {
    assessmentReminder: boolean;
    resultReady: boolean;
    tips: boolean;
  };
  privacy: {
    shareWithTeacher: boolean;
    anonymousAnalytics: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
  };
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  expiresAt: number | null;
}

// 법정대리인 동의
export interface ParentConsent {
  studentId: string;
  parentId: string;
  consentedAt: number;
  method: 'phone' | 'ipin' | 'other';
  expiresAt: number;
}
