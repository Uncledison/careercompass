/**
 * 검사 상태 관리 스토어 (Zustand)
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Question,
  Response,
  CareerField,
  CareerScores,
  GradeLevel,
  ResponseValue,
  GRADE_LEVEL_CONFIG,
} from '../types';
import { getQuestionsByLevel, elementaryStages } from '../data/questions';

// 저장된 검사 상태 타입
export interface SavedAssessmentState {
  level: GradeLevel;
  responses: Response[];
  currentQuestionIndex: number;
  currentStage: number;
  sessionId: string;
  startedAt: number;
  savedAt: number;
}

const SAVED_ASSESSMENT_KEY = '@careercompass_saved_assessment';

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

interface AssessmentState {
  // 기본 정보
  level: GradeLevel;
  questions: Question[];
  responses: Response[];

  // 진행 상태
  currentQuestionIndex: number;
  currentStage: number;
  totalStages: number;
  questionsPerStage: number;

  // 세션 정보
  sessionId: string | null;
  startedAt: number | null;
  isCompleted: boolean;

  // 결과
  scores: CareerScores | null;

  // 액션
  initAssessment: (level: GradeLevel) => void;
  submitResponse: (value: ResponseValue) => void;
  goToNextQuestion: () => boolean; // 다음 문항 있으면 true
  goToPrevQuestion: () => void;
  getCurrentQuestion: () => Question | null;
  getStageProgress: () => { current: number; total: number; stageQuestionIndex: number };
  isStageComplete: () => boolean;
  completeStage: () => void;
  calculateScores: () => CareerScores;
  resetAssessment: () => void;

  // 중단/재개 기능
  saveProgress: () => Promise<void>;
  loadSavedProgress: () => Promise<SavedAssessmentState | null>;
  resumeAssessment: (saved: SavedAssessmentState) => void;
  clearSavedProgress: () => Promise<void>;
  hasSavedProgress: () => Promise<boolean>;
}

// 초기 점수
const initialScores: CareerScores = {
  humanities: 0,
  social: 0,
  natural: 0,
  engineering: 0,
  medicine: 0,
  arts: 0,
};

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  // 초기 상태
  level: 'elementary_lower',
  questions: [],
  responses: [],
  currentQuestionIndex: 0,
  currentStage: 1,
  totalStages: 5,
  questionsPerStage: 7,
  sessionId: null,
  startedAt: null,
  isCompleted: false,
  scores: null,

  // 검사 초기화
  initAssessment: (level: GradeLevel) => {
    const config = GRADE_LEVEL_CONFIG[level];
    const questions = getQuestionsByLevel(level);

    set({
      level,
      questions,
      responses: [],
      currentQuestionIndex: 0,
      currentStage: 1,
      totalStages: config.totalStages,
      questionsPerStage: config.questionsPerStage,
      sessionId: `session_${Date.now()}`,
      startedAt: Date.now(),
      isCompleted: false,
      scores: null,
    });
  },

  // 응답 제출
  submitResponse: (value: ResponseValue) => {
    const { questions, currentQuestionIndex, responses } = get();
    const question = questions[currentQuestionIndex];

    if (!question) return;

    const newResponse: Response = {
      questionId: question.id,
      value,
      timestamp: Date.now(),
    };

    // 기존 응답이 있으면 업데이트, 없으면 추가
    const existingIndex = responses.findIndex(r => r.questionId === question.id);
    const updatedResponses = [...responses];

    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = newResponse;
    } else {
      updatedResponses.push(newResponse);
    }

    set({ responses: updatedResponses });
  },

  // 다음 문항으로
  goToNextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
      return true;
    }
    return false;
  },

  // 이전 문항으로
  goToPrevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  // 현재 문항 가져오기
  getCurrentQuestion: () => {
    const { questions, currentQuestionIndex } = get();
    return questions[currentQuestionIndex] || null;
  },

  // 스테이지 진행 상황
  getStageProgress: () => {
    const { currentQuestionIndex, questionsPerStage, currentStage, totalStages } = get();
    const stageStartIndex = (currentStage - 1) * questionsPerStage;
    let stageQuestionIndex = currentQuestionIndex - stageStartIndex;

    // 범위 보정: 스테이지 인덱스가 범위를 벗어나면 보정
    if (stageQuestionIndex < 0) {
      stageQuestionIndex = 0;
    } else if (stageQuestionIndex >= questionsPerStage) {
      stageQuestionIndex = questionsPerStage - 1;
    }

    return {
      current: currentQuestionIndex + 1,
      total: questionsPerStage * totalStages, // 전체 문항 수
      stageQuestionIndex: stageQuestionIndex + 1,
    };
  },

  // 스테이지 완료 여부
  isStageComplete: () => {
    const { currentQuestionIndex, questionsPerStage, currentStage } = get();
    const stageEndIndex = currentStage * questionsPerStage - 1;
    return currentQuestionIndex >= stageEndIndex;
  },

  // 스테이지 완료 처리
  completeStage: () => {
    const { currentStage, totalStages, currentQuestionIndex, questions } = get();

    if (currentStage < totalStages) {
      set({ currentStage: currentStage + 1 });
    } else {
      // 모든 스테이지 완료
      set({ isCompleted: true });
      const scores = get().calculateScores();
      set({ scores });
    }
  },

  // 점수 계산
  calculateScores: () => {
    const { responses, questions, level } = get();
    const config = GRADE_LEVEL_CONFIG[level];

    // 계열별 점수 초기화
    const scores: CareerScores = { ...initialScores };
    const counts: CareerScores = { ...initialScores };

    responses.forEach((response) => {
      const question = questions.find(q => q.id === response.questionId);
      if (!question) return;

      const { primary, secondary } = question.careerMapping;

      // 1차 매핑 (가중치 1.0)
      scores[primary] += response.value;
      counts[primary] += 1;

      // 2차 매핑 (가중치 0.5)
      if (secondary) {
        scores[secondary] += response.value * 0.5;
        counts[secondary] += 0.5;
      }
    });

    // 평균 계산 후 100점 만점으로 변환
    const fields: CareerField[] = ['humanities', 'social', 'natural', 'engineering', 'medicine', 'arts'];
    fields.forEach((field) => {
      if (counts[field] > 0) {
        // 평균 (1~5점) -> 0~100점으로 변환
        const avg = scores[field] / counts[field];
        scores[field] = Math.round(((avg - 1) / 4) * 100);
      }
    });

    return scores;
  },

  // 검사 리셋
  resetAssessment: () => {
    set({
      level: 'elementary_lower',
      questions: [],
      responses: [],
      currentQuestionIndex: 0,
      currentStage: 1,
      totalStages: 5,
      questionsPerStage: 7,
      sessionId: null,
      startedAt: null,
      isCompleted: false,
      scores: null,
    });
  },

  // 진행 상태 저장
  saveProgress: async () => {
    const { level, responses, currentQuestionIndex, currentStage, sessionId, startedAt } = get();

    if (!sessionId || !startedAt) return;

    const savedState: SavedAssessmentState = {
      level,
      responses,
      currentQuestionIndex,
      currentStage,
      sessionId,
      startedAt,
      savedAt: Date.now(),
    };

    try {
      await storage.setItem(SAVED_ASSESSMENT_KEY, JSON.stringify(savedState));
    } catch (error) {
      console.error('Failed to save progress:', error);
      throw error;
    }
  },

  // 저장된 진행 상태 로드
  loadSavedProgress: async () => {
    try {
      const stored = await storage.getItem(SAVED_ASSESSMENT_KEY);
      if (stored) {
        return JSON.parse(stored) as SavedAssessmentState;
      }
      return null;
    } catch (error) {
      console.error('Failed to load saved progress:', error);
      return null;
    }
  },

  // 저장된 상태에서 검사 재개
  resumeAssessment: (saved: SavedAssessmentState) => {
    const config = GRADE_LEVEL_CONFIG[saved.level];
    const questions = getQuestionsByLevel(saved.level);

    set({
      level: saved.level,
      questions,
      responses: saved.responses,
      currentQuestionIndex: saved.currentQuestionIndex,
      currentStage: saved.currentStage,
      totalStages: config.totalStages,
      questionsPerStage: config.questionsPerStage,
      sessionId: saved.sessionId,
      startedAt: saved.startedAt,
      isCompleted: false,
      scores: null,
    });
  },

  // 저장된 진행 상태 삭제
  clearSavedProgress: async () => {
    try {
      await storage.removeItem(SAVED_ASSESSMENT_KEY);
    } catch (error) {
      console.error('Failed to clear saved progress:', error);
    }
  },

  // 저장된 진행 상태 존재 여부
  hasSavedProgress: async () => {
    try {
      const stored = await storage.getItem(SAVED_ASSESSMENT_KEY);
      return stored !== null;
    } catch {
      return false;
    }
  },
}));

// 현재 응답값 가져오기 (셀렉터)
export const useCurrentResponseValue = () => {
  return useAssessmentStore((state) => {
    const question = state.getCurrentQuestion();
    if (!question) return 3; // 기본값
    const response = state.responses.find(r => r.questionId === question.id);
    return response?.value || 3;
  });
};

// 스테이지 정보 가져오기
export const useStageInfo = () => {
  return useAssessmentStore((state) => {
    const stageData = elementaryStages[state.currentStage - 1];
    return {
      ...stageData,
      currentStage: state.currentStage,
      totalStages: state.totalStages,
    };
  });
};
