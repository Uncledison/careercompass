/**
 * Career Compass - Assessment Type Definitions
 */

// 학령 구분
export type GradeLevel = 'elementary_lower' | 'elementary_upper' | 'middle' | 'high';

// 학년 상세
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// 6대 진로 계열
export type CareerField =
  | 'humanities'   // 인문
  | 'social'       // 사회
  | 'natural'      // 자연
  | 'engineering'  // 공학
  | 'medicine'     // 의학
  | 'arts';        // 예체능

// Holland 코드
export type HollandCode = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

// MBTI 지표
export type MBTIIndicator = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

// 문항 카테고리
export type QuestionCategory =
  | 'interest'     // 흥미 탐색 (Holland)
  | 'personality'  // 성향 탐색 (MBTI)
  | 'value'        // 가치관
  | 'validity';    // 타당성 검증

// 응답 값 (5점 척도)
export type ResponseValue = 1 | 2 | 3 | 4 | 5;

// 단일 문항
export interface Question {
  id: string;
  category: QuestionCategory;
  content: string;
  contentKid?: string;  // 초등학생용 쉬운 표현
  illustration?: string; // SVG 또는 이미지 경로
  hollandCode?: HollandCode;
  mbtiIndicator?: MBTIIndicator;
  careerMapping: {
    primary: CareerField;
    secondary?: CareerField;
  };
  isReversed?: boolean; // 역문항 여부
}

// 사용자 응답
export interface Response {
  questionId: string;
  value: ResponseValue;
  timestamp: number;
}

// 검사 세션
export interface AssessmentSession {
  id: string;
  userId: string;
  gradeLevel: GradeLevel;
  grade: Grade;
  startedAt: number;
  completedAt?: number;
  responses: Response[];
  currentStage: number;
  totalStages: number;
}

// 계열별 점수
export interface CareerScores {
  humanities: number;
  social: number;
  natural: number;
  engineering: number;
  medicine: number;
  arts: number;
}

// 검사 결과
export interface AssessmentResult {
  sessionId: string;
  userId: string;
  completedAt: number;
  scores: CareerScores;
  topCareers: CareerField[];
  hollandProfile: Record<HollandCode, number>;
  mbtiType?: string;
  recommendations: CareerRecommendation[];
}

// 직업 추천
export interface CareerRecommendation {
  field: CareerField;
  score: number;
  jobs: Job[];
  majors: string[];
}

// 직업 정보
export interface Job {
  id: string;
  title: string;
  description: string;
  field: CareerField;
  icon: string;
  futureOutlook: 'growing' | 'stable' | 'declining';
}

// 스테이지 정보
export interface Stage {
  number: number;
  title: string;
  subtitle: string;
  questionCount: number;
  badge: {
    name: string;
    icon: string;
  };
}

// 학령별 설정
export interface GradeLevelConfig {
  level: GradeLevel;
  totalQuestions: number;
  questionsPerStage: number;
  totalStages: number;
  sessionTimeout: number; // ms
  weights: {
    interest: number;
    personality: number;
    value: number;
  };
}

// 학령별 설정 상수
export const GRADE_LEVEL_CONFIG: Record<GradeLevel, GradeLevelConfig> = {
  elementary_lower: {
    level: 'elementary_lower',
    totalQuestions: 35,
    questionsPerStage: 7,
    totalStages: 5,
    sessionTimeout: 15 * 60 * 1000, // 15분
    weights: { interest: 0.60, personality: 0.25, value: 0.15 },
  },
  elementary_upper: {
    level: 'elementary_upper',
    totalQuestions: 45,
    questionsPerStage: 9,
    totalStages: 5,
    sessionTimeout: 18 * 60 * 1000, // 18분
    weights: { interest: 0.55, personality: 0.25, value: 0.20 },
  },
  middle: {
    level: 'middle',
    totalQuestions: 65,
    questionsPerStage: 13,
    totalStages: 5,
    sessionTimeout: 25 * 60 * 1000, // 25분
    weights: { interest: 0.40, personality: 0.35, value: 0.25 },
  },
  high: {
    level: 'high',
    totalQuestions: 85,
    questionsPerStage: 17,
    totalStages: 5,
    sessionTimeout: 30 * 60 * 1000, // 30분
    weights: { interest: 0.30, personality: 0.35, value: 0.35 },
  },
};
