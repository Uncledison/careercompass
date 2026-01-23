/**
 * 검사 결과 화면
 * Summary First, Depth On Demand UX 구조
 * - 상단: 3초 안에 결과 요약 파악
 * - 하단: 상세 분석 리포트
 */

import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Polygon,
  Line,
  Circle,
  Text as SvgText,
  G,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Path,
} from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import { useAssessmentStore } from '../../src/stores/assessmentStore';
import { useHistoryStore } from '../../src/stores/historyStore';
import { useProfileStore, getShortGradeLabel, SchoolType } from '../../src/stores/profileStore';
import { CareerField, CareerScores } from '../../src/types';
import { exportToPDF } from '../../src/utils/pdfExport';
import { ModelViewer3D } from '../../src/components/character/ModelViewer3D';
import * as Linking from 'expo-linking';
import { captureRef } from 'react-native-view-shot';

// 학년별 문항 수
const QUESTION_COUNTS: Record<string, number> = {
  elementary: 35,
  middle: 65,
  high: 85,
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// 차트 크기를 적절하게 제한 (최대 280px)
const CHART_SIZE = Math.min(SCREEN_WIDTH - 80, 280);
const CHART_PADDING = 35; // 라벨을 위한 여백
const SVG_SIZE = CHART_SIZE + CHART_PADDING * 2;
const CENTER = SVG_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 20;

// 유형명 매핑 (계열 → 캐릭터형 이름)
const typeNames: Record<CareerField, string> = {
  humanities: '인문 탐구자',
  social: '사회 리더',
  natural: '자연 탐험가',
  engineering: '공학 메이커',
  medicine: '생명 수호자',
  arts: '예술 크리에이터',
};

// 유형별 핵심 키워드
const typeKeywords: Record<CareerField, string[]> = {
  humanities: ['공감', '언어감각', '비판적사고'],
  social: ['리더십', '설득력', '소통'],
  natural: ['탐구심', '분석력', '논리'],
  engineering: ['창의력', '문제해결', '도전정신'],
  medicine: ['봉사정신', '책임감', '집중력'],
  arts: ['창의성', '표현력', '감성'],
};

// 계열별 상세 정보
interface CareerFieldDetail {
  label: string;
  icon: string;
  color: string;
  jobs: string[];
  description: string;
  traits: string[];
  strengths: string[];
  activities: string[];
  subjects: string[];
  futureJobs: string[];
}

const careerFieldInfo: Record<CareerField, CareerFieldDetail> = {
  humanities: {
    label: '인문',
    icon: '📚',
    color: Colors.career.humanities.main,
    jobs: ['작가', '기자', '번역가', '심리상담사'],
    description: '언어와 문화, 역사에 관심이 많고 깊이 있는 사고를 좋아해요.',
    traits: ['창의적 글쓰기', '공감 능력', '비판적 사고', '언어 감각'],
    strengths: ['다양한 관점으로 생각해요', '이야기를 잘 만들어요', '감정을 잘 표현해요'],
    activities: ['독서 토론 동아리', '글쓰기 대회', '외국어 학습', '역사 탐방'],
    subjects: ['국어', '영어', '역사', '철학', '심리학'],
    futureJobs: ['AI 콘텐츠 작가', '문화기획자', '데이터 스토리텔러', '심리 AI 개발자'],
  },
  social: {
    label: '사회',
    icon: '🌍',
    color: Colors.career.social.main,
    jobs: ['CEO', '마케터', '변호사', '외교관'],
    description: '사람들과 소통하고 사회 문제 해결에 관심이 많아요.',
    traits: ['리더십', '협상력', '논리적 사고', '의사소통'],
    strengths: ['설득력이 뛰어나요', '팀을 이끄는 것을 좋아해요', '공정함을 중시해요'],
    activities: ['학생회 활동', '모의재판', '토론 대회', '봉사활동'],
    subjects: ['사회', '정치', '경제', '법학', '행정학'],
    futureJobs: ['ESG 컨설턴트', '스타트업 CEO', '국제기구 전문가', '디지털 정책 전문가'],
  },
  natural: {
    label: '자연',
    icon: '🔬',
    color: Colors.career.natural.main,
    jobs: ['과학자', '연구원', '기후전문가', '수학자'],
    description: '자연 현상의 원리를 탐구하고 실험하는 것을 좋아해요.',
    traits: ['탐구심', '분석력', '논리적 사고', '인내심'],
    strengths: ['꼼꼼하게 관찰해요', '원리를 찾는 것을 좋아해요', '숫자에 강해요'],
    activities: ['과학 실험 동아리', '수학 올림피아드', '자연 관찰', '코딩 학습'],
    subjects: ['수학', '물리', '화학', '생물', '지구과학'],
    futureJobs: ['기후과학자', '바이오 연구원', '양자컴퓨팅 전문가', '우주 과학자'],
  },
  engineering: {
    label: '공학',
    icon: '🤖',
    color: Colors.career.engineering.main,
    jobs: ['AI개발자', '로봇공학자', '건축가', '게임개발자'],
    description: '기술로 문제를 해결하고 새로운 것을 만드는 것을 좋아해요.',
    traits: ['창의력', '문제해결력', '기술 감각', '도전정신'],
    strengths: ['손으로 만드는 것을 좋아해요', '새로운 기술에 관심이 많아요', '논리적이에요'],
    activities: ['로봇 동아리', '코딩 부트캠프', '발명 대회', '메이커 스페이스'],
    subjects: ['수학', '물리', '정보', '기술가정', '프로그래밍'],
    futureJobs: ['AI 엔지니어', '메타버스 개발자', '자율주행 엔지니어', '드론 전문가'],
  },
  medicine: {
    label: '의학',
    icon: '🏥',
    color: Colors.career.medicine.main,
    jobs: ['의사', '간호사', '약사', '수의사'],
    description: '생명을 소중히 여기고 다른 사람을 돕는 것에 보람을 느껴요.',
    traits: ['봉사정신', '꼼꼼함', '책임감', '인내심'],
    strengths: ['다른 사람을 돕고 싶어해요', '생명에 대한 관심이 많아요', '집중력이 좋아요'],
    activities: ['의료 봉사', '생물 실험', '응급처치 교육', '보건 동아리'],
    subjects: ['생물', '화학', '보건', '심리학', '해부학'],
    futureJobs: ['정밀의료 전문의', '바이오 헬스케어 전문가', 'AI 진단 개발자', '유전자 치료 전문가'],
  },
  arts: {
    label: '예체능',
    icon: '🎨',
    color: Colors.career.arts.main,
    jobs: ['디자이너', '음악가', '운동선수', '유튜버'],
    description: '자신만의 방식으로 표현하고 창작하는 것을 즐겨요.',
    traits: ['창의성', '표현력', '감성', '끈기'],
    strengths: ['독창적인 아이디어가 많아요', '감정 표현을 잘해요', '예술적 감각이 뛰어나요'],
    activities: ['미술 동아리', '밴드 활동', '스포츠 클럽', '영상 제작'],
    subjects: ['미술', '음악', '체육', '영상', '디자인'],
    futureJobs: ['UX/UI 디자이너', '버추얼 아티스트', 'e스포츠 선수', '콘텐츠 크리에이터'],
  },
};

// 요약 카드 컴포넌트 (최상단 - 3초 안에 파악)
const SummaryCard = ({
  topField,
  score,
  nickname,
  character,
  level,
  onKakaoShare,
  onPngSave,
  onToggleDetail,
  isDetailOpen,
  captureRef,
}: {
  topField: CareerField;
  score: number;
  nickname?: string;
  character: string;
  level: string;
  onKakaoShare: () => void;
  onPngSave: () => void;
  onToggleDetail: () => void;
  isDetailOpen: boolean;
  captureRef?: React.RefObject<View | null>;
}) => {
  const info = careerFieldInfo[topField];
  const typeName = typeNames[topField];
  const keywords = typeKeywords[topField];
  const questionCount = QUESTION_COUNTS[level] || 35;

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.summaryCardContainer}>
      <View ref={captureRef} collapsable={false} style={{ backgroundColor: 'transparent' }}>
        <LinearGradient
          colors={[info.color + 'F0', info.color + 'CC'] as const}
          style={styles.summaryCardGradient}
        >
          {/* 상단: 요약 카드 영역 (전체 화면 높이의 약 70-80% 차지) */}
          <View style={styles.topSpacer} />

          {/* 사용자 캐릭터 (화면 상단에서 적당한 거리를 두고 배치) */}
          <View style={styles.characterSection}>
            <View style={styles.characterCircle}>
              <ModelViewer3D
                modelPath={`/models/characters/${character}.gltf`}
                animations={['Wave', 'Yes']}
                width={160}
                height={160}
                autoRotate={false}
                cameraDistance="14m"
                cameraTarget="0m 1.25m 0m"
                borderRadius={80}
                backgroundColor="transparent"
              />
            </View>
          </View>

          {/* 인사말 */}
          <Text style={styles.greetingText}>
            {nickname ? `${nickname}님의 진로 유형` : '나의 진로 유형'}
          </Text>

          {/* 유형명 & 점수 (시각적 중심) */}
          <View style={styles.typeSection}>
            {/* 아이콘 */}
            <View style={styles.iconCircle}>
              <Text style={styles.typeIcon}>{info.icon}</Text>
            </View>
            <Text style={styles.typeName}>{typeName}</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreUnit}>점</Text>
            </View>
          </View>

          {/* 강점 키워드 */}
          <View style={styles.keywordsSection}>
            {keywords.map((keyword, idx) => (
              <View key={idx} style={styles.keywordChip}>
                <Text style={styles.keywordText}>#{keyword}</Text>
              </View>
            ))}
          </View>

          {/* 공유 버튼 (높이 48px, 동일 크기, 색상 강조) */}
          <View style={styles.shareButtonsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                styles.kakaoBtn, // 노란색 배경
                pressed && styles.shareBtnPressed,
              ]}
              onPress={onKakaoShare}
            >
              <Text style={styles.shareBtnIcon}>💬</Text>
              <Text style={styles.kakaoBtnText}>카톡 공유</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                styles.imageBtn, // 투명 배경 + 테두리
                pressed && styles.shareBtnPressed,
              ]}
              onPress={onPngSave}
            >
              <Text style={styles.shareBtnIcon}>🖼️</Text>
              <Text style={styles.imageBtnText}>이미지 저장</Text>
            </Pressable>
          </View>

          {/* 신뢰 배지 */}
          <View style={styles.trustBadgeInCard}>
            <Text style={styles.trustBadgeText}>
              🎓 과학적 검사 기반 · {questionCount}문항 분석
            </Text>
          </View>

          {/* 상세 분석 보기 (작은 텍스트 링크) */}
          <Pressable
            style={({ pressed }) => [
              styles.detailToggleLink,
              pressed && styles.detailToggleLinkPressed,
            ]}
            onPress={onToggleDetail}
          >
            {/* 상세 분석 보기 (작은 텍스트 링크, 시각적 우선순위 낮춤) */}
            <Pressable
              style={({ pressed }) => [
                styles.detailToggleLink,
                pressed && styles.detailToggleLinkPressed,
              ]}
              onPress={onToggleDetail}
            >
              <Text style={styles.detailToggleLinkText}>
                {isDetailOpen ? '📊 상세 분석 접기' : '📊 상세 분석 보기 ▼'}
              </Text>
            </Pressable>
          </Pressable>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

// 신뢰 배지 컴포넌트 (더 이상 사용하지 않음 - SummaryCard 내부로 이동)


// 레이더 차트 컴포넌트
const RadarChart = ({ scores }: { scores: CareerScores }) => {
  const fields: CareerField[] = ['humanities', 'social', 'natural', 'engineering', 'medicine', 'arts'];
  const numPoints = fields.length;
  const angleStep = (2 * Math.PI) / numPoints;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * RADIUS;
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    };
  };

  // 배경 그리드
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // 데이터 폴리곤
  const dataPoints = fields
    .map((field, index) => {
      const point = getPoint(index, scores[field]);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <Svg width={SVG_SIZE} height={SVG_SIZE}>
      <Defs>
        <SvgGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={Colors.primary.main} stopOpacity={0.5} />
          <Stop offset="100%" stopColor={Colors.secondary.main} stopOpacity={0.5} />
        </SvgGradient>
      </Defs>

      {/* 배경 그리드 */}
      {gridLevels.map((level, levelIdx) => {
        const gridPoints = fields
          .map((_, index) => {
            const point = getPoint(index, level * 100);
            return `${point.x},${point.y}`;
          })
          .join(' ');
        return (
          <Polygon
            key={`grid-${levelIdx}`}
            points={gridPoints}
            fill="none"
            stroke={Colors.gray[200]}
            strokeWidth={1}
          />
        );
      })}

      {/* 축 라인 */}
      {fields.map((_, index) => {
        const point = getPoint(index, 100);
        return (
          <Line
            key={`axis-${index}`}
            x1={CENTER}
            y1={CENTER}
            x2={point.x}
            y2={point.y}
            stroke={Colors.gray[200]}
            strokeWidth={1}
          />
        );
      })}

      {/* 데이터 영역 */}
      <Polygon
        points={dataPoints}
        fill="url(#radarFill)"
        stroke={Colors.primary.main}
        strokeWidth={2}
      />

      {/* 데이터 포인트 */}
      {fields.map((field, index) => {
        const point = getPoint(index, scores[field]);
        const info = careerFieldInfo[field];
        return (
          <Circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r={6}
            fill={info.color}
            stroke="white"
            strokeWidth={2}
          />
        );
      })}

      {/* 라벨 */}
      {fields.map((field, index) => {
        const labelPoint = getPoint(index, 125); // 라벨 위치 조정
        const info = careerFieldInfo[field];
        return (
          <G key={`label-${index}`}>
            <SvgText
              x={labelPoint.x}
              y={labelPoint.y - 8}
              fontSize={15}
              fontWeight="700"
              fill={Colors.text.primary}
              textAnchor="middle"
            >
              {info.icon} {info.label}
            </SvgText>
            <SvgText
              x={labelPoint.x}
              y={labelPoint.y + 10}
              fontSize={16}
              fill={info.color}
              fontWeight="900"
              textAnchor="middle"
            >
              {scores[field]}점
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

// 추천 카드
const RecommendationCard = ({
  rank,
  field,
  score,
  delay,
  onDetailPress,
}: {
  rank: number;
  field: CareerField;
  score: number;
  delay: number;
  onDetailPress: () => void;
}) => {
  const info = careerFieldInfo[field];

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[styles.recommendCard, { borderLeftColor: info.color }]}
    >
      <View style={styles.recommendHeader}>
        <View style={styles.recommendRank}>
          <Text style={styles.recommendRankText}>#{rank}</Text>
        </View>
        <Text style={styles.recommendIcon}>{info.icon}</Text>
        <View style={styles.recommendInfo}>
          <Text style={styles.recommendLabel}>{typeNames[field]}</Text>
          <Text style={styles.recommendScore}>{score}점</Text>
        </View>
        <View style={[styles.recommendBadge, { backgroundColor: info.color + '20' }]}>
          <Text style={[styles.recommendBadgeText, { color: info.color }]}>
            {score >= 80 ? '최적합' : score >= 60 ? '적합' : '관심'}
          </Text>
        </View>
      </View>
      <View style={styles.recommendJobs}>
        <View style={styles.recommendJobsHeader}>
          <Text style={styles.recommendJobsTitle}>추천 직업</Text>
          <Pressable
            style={({ pressed }) => [
              styles.detailButton,
              pressed && styles.detailButtonPressed
            ]}
            onPress={onDetailPress}
          >
            <Text style={[styles.detailButtonText, { color: info.color }]}>자세히 보기</Text>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
                fill={info.color}
              />
            </Svg>
          </Pressable>
        </View>
        <View style={styles.recommendJobsList}>
          {info.jobs.slice(0, 4).map((job, idx) => (
            <View key={idx} style={[styles.jobChip, { backgroundColor: info.color + '15' }]}>
              <Text style={[styles.jobChipText, { color: info.color }]}>{job}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// 강점/약점 분석 카드
const StrengthWeaknessCard = ({
  topField,
  bottomField,
}: {
  topField: CareerField;
  bottomField: CareerField;
}) => {
  const topInfo = careerFieldInfo[topField];
  const bottomInfo = careerFieldInfo[bottomField];

  return (
    <Animated.View
      entering={FadeInDown.delay(800).duration(400)}
      style={styles.analysisCard}
    >
      <Text style={styles.analysisSectionTitle}>나의 강점과 성장 포인트</Text>

      {/* 강점 */}
      <View style={styles.strengthSection}>
        <View style={styles.strengthHeader}>
          <View style={[styles.strengthIcon, { backgroundColor: topInfo.color + '20' }]}>
            <Text style={styles.strengthIconText}>💪</Text>
          </View>
          <Text style={styles.strengthTitle}>나의 강점</Text>
        </View>
        <Text style={styles.strengthDescription}>{topInfo.description}</Text>
        <View style={styles.traitsList}>
          {topInfo.traits.map((trait, idx) => (
            <View key={idx} style={[styles.traitChip, { backgroundColor: topInfo.color + '15' }]}>
              <Text style={[styles.traitChipText, { color: topInfo.color }]}>{trait}</Text>
            </View>
          ))}
        </View>
        <View style={styles.strengthPointsContainer}>
          {topInfo.strengths.map((strength, idx) => (
            <View key={idx} style={styles.strengthPoint}>
              <Text style={[styles.strengthBullet, { color: topInfo.color }]}>✓</Text>
              <Text style={styles.strengthPointText}>{strength}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 성장 포인트 */}
      <View style={styles.growthSection}>
        <View style={styles.strengthHeader}>
          <View style={[styles.strengthIcon, { backgroundColor: bottomInfo.color + '20' }]}>
            <Text style={styles.strengthIconText}>🌱</Text>
          </View>
          <Text style={styles.strengthTitle}>성장 포인트</Text>
        </View>
        <Text style={styles.growthDescription}>
          {typeNames[bottomField]} 역량을 키워보면 더 다양한 가능성이 열려요!
        </Text>
        <View style={styles.growthTips}>
          {bottomInfo.activities.slice(0, 2).map((activity, idx) => (
            <View key={idx} style={styles.growthTip}>
              <Text style={styles.growthTipIcon}>💡</Text>
              <Text style={styles.growthTipText}>{activity}에 도전해보세요</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// 추천 활동 섹션
const RecommendedActivities = ({ field }: { field: CareerField }) => {
  const info = careerFieldInfo[field];

  return (
    <Animated.View
      entering={FadeInDown.delay(1000).duration(400)}
      style={styles.analysisCard}
    >
      <Text style={styles.analysisSectionTitle}>추천 활동 & 학습</Text>

      {/* 추천 활동 */}
      <View style={styles.activitySection}>
        <Text style={styles.activityLabel}>이런 활동을 해보세요</Text>
        <View style={styles.activityGrid}>
          {info.activities.map((activity, idx) => (
            <View key={idx} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: info.color + '20' }]}>
                <Text style={styles.activityEmoji}>
                  {['🎯', '📖', '🔍', '🎨'][idx % 4]}
                </Text>
              </View>
              <Text style={styles.activityText}>{activity}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 관련 과목 */}
      <View style={styles.subjectSection}>
        <Text style={styles.activityLabel}>집중하면 좋은 과목</Text>
        <View style={styles.subjectList}>
          {info.subjects.map((subject, idx) => (
            <View key={idx} style={[styles.subjectChip, { borderColor: info.color }]}>
              <Text style={[styles.subjectText, { color: info.color }]}>{subject}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// 미래 직업 섹션
const FutureJobsSection = ({ topCareers }: { topCareers: { field: CareerField; score: number }[] }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(1200).duration(400)}
      style={styles.analysisCard}
    >
      <Text style={styles.analysisSectionTitle}>미래 유망 직업</Text>
      <Text style={styles.futureJobsSubtitle}>
        AI 시대에 주목받는 직업들이에요
      </Text>

      {topCareers.slice(0, 2).map((career, idx) => {
        const info = careerFieldInfo[career.field];
        return (
          <View key={career.field} style={styles.futureJobSection}>
            <View style={styles.futureJobHeader}>
              <Text style={styles.futureJobIcon}>{info.icon}</Text>
              <Text style={[styles.futureJobLabel, { color: info.color }]}>
                {typeNames[career.field]}
              </Text>
            </View>
            <View style={styles.futureJobList}>
              {info.futureJobs.map((job, jobIdx) => (
                <View key={jobIdx} style={styles.futureJobItem}>
                  <View style={[styles.futureJobBullet, { backgroundColor: info.color }]} />
                  <Text style={styles.futureJobText}>{job}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </Animated.View>
  );
};

// 종합 코멘트 섹션
const SummaryComment = ({
  topField,
  score
}: {
  topField: CareerField;
  score: number;
}) => {
  const info = careerFieldInfo[topField];

  const getComment = () => {
    const typeName = typeNames[topField];
    if (score >= 85) {
      return `${typeName} 유형에 대한 적성이 매우 높아요! 이 분야에서 뛰어난 성과를 낼 가능성이 커요.`;
    } else if (score >= 70) {
      return `${typeName} 유형에 좋은 적성을 보여주고 있어요. 꾸준히 관심을 가지면 더 성장할 수 있어요.`;
    } else {
      return `여러 분야에 고르게 관심이 있네요! 다양한 경험을 통해 나만의 강점을 찾아보세요.`;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(1400).duration(400)}
      style={[styles.summaryCard, { borderColor: info.color }]}
    >
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryIcon}>✨</Text>
        <Text style={styles.summaryTitle}>종합 코멘트</Text>
      </View>
      <Text style={styles.summaryText}>{getComment()}</Text>
      <View style={styles.summaryTip}>
        <Text style={styles.summaryTipIcon}>📌</Text>
        <Text style={styles.summaryTipText}>
          검사 결과는 현재 시점의 적성을 보여줘요.
          다양한 경험을 하면서 새로운 가능성을 발견해 보세요!
        </Text>
      </View>
    </Animated.View>
  );
};

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { scores, level, resetAssessment } = useAssessmentStore();
  const { saveResult } = useHistoryStore();
  const { profile } = useProfileStore();
  const savedRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const detailSectionY = useRef(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 히스토리 모드 확인
  const { getResultById } = useHistoryStore();
  const historyResult = useMemo(() => {
    if (id && id !== 'new') {
      return getResultById(id);
    }
    return null;
  }, [id, getResultById]);

  // 표시할 점수 데이터 결정
  const displayScores = useMemo(() => {
    if (historyResult) return historyResult.scores;
    if (scores) return scores;
    return {
      humanities: 65,
      social: 72,
      natural: 78,
      engineering: 92,
      medicine: 71,
      arts: 58,
    };
  }, [historyResult, scores]);

  const displayLevel = historyResult ? historyResult.level : (level || 'elementary');
  const displayNickname = historyResult ? historyResult.nickname : profile?.nickname;

  // 캡처용 Ref
  const captureViewRef = useRef<View>(null);

  // 전체 계열 순위
  const allCareers = useMemo(() => {
    const fields: CareerField[] = ['humanities', 'social', 'natural', 'engineering', 'medicine', 'arts'];
    return fields
      .map((field) => ({ field, score: displayScores[field] }))
      .sort((a, b) => b.score - a.score);
  }, [displayScores]);

  // 상위 3개 계열
  const topCareers = useMemo(() => allCareers.slice(0, 3), [allCareers]);

  // 최하위 계열 (성장 포인트용)
  const bottomCareer = useMemo(() => allCareers[allCareers.length - 1], [allCareers]);

  // 결과 자동 저장 (최초 1회)
  useEffect(() => {
    if (scores && !savedRef.current) {
      savedRef.current = true;
      const topCareer = topCareers[0];
      // 학년을 "초등2", "중2", "고2" 형식으로 저장
      const gradeLabel = profile?.schoolType && profile?.grade
        ? getShortGradeLabel(profile.schoolType, profile.grade)
        : undefined;
      saveResult({
        level,
        scores,
        topCareer: topCareer.field,
        topScore: topCareer.score,
        nickname: profile?.nickname,
        grade: gradeLabel,
      }).catch(console.error);
    }
  }, [scores, level, topCareers, saveResult, profile]);

  // 1위 계열
  const topCareer = topCareers[0];
  const topInfo = careerFieldInfo[topCareer.field];

  // 공유하기
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Career Compass 진로검사 결과\n\n나의 진로 유형: ${topInfo.icon} ${typeNames[topCareer.field]} (${topCareer.score}점)\n\n추천 직업: ${topInfo.jobs.join(', ')}\n\n#CareerCompass #진로탐색 #${typeNames[topCareer.field]}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // 다시하기
  const handleRetry = () => {
    resetAssessment();
    router.replace('/(tabs)');
  };

  // 홈으로
  const handleGoHome = () => {
    resetAssessment();
    router.replace('/(tabs)');
  };

  // PDF 내보내기
  const handleExportPDF = async () => {
    try {
      const gradeLabel = profile?.schoolType && profile?.grade
        ? getShortGradeLabel(profile.schoolType, profile.grade)
        : undefined;

      await exportToPDF(
        displayScores,
        displayLevel,
        historyResult ? historyResult.timestamp : Date.now(),
        displayNickname,
        historyResult ? historyResult.grade : gradeLabel
      );
    } catch (error) {
      console.log('PDF export error:', error);
    }
  };

  // 상세 분석 보기/접기 토글
  const handleToggleDetail = () => {
    const newState = !isDetailOpen;
    setIsDetailOpen(newState);

    // 펼칠 때 스크롤
    if (newState) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: detailSectionY.current,
          animated: true,
        });
      }, 100);
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = async () => {
    const shareText = `Career Compass 진로검사 결과\n\n나의 진로 유형: ${topInfo.icon} ${typeNames[topCareer.field]}\n적성 점수: ${topCareer.score}점\n\n#CareerCompass #진로탐색 #${typeNames[topCareer.field]}`;

    // 카카오톡 앱이 있는지 확인하고 공유
    if (Platform.OS !== 'web') {
      try {
        await Share.share({
          message: shareText,
        });
      } catch (error) {
        console.log('Share error:', error);
      }
    } else {
      // 웹에서는 클립보드 복사
      try {
        await navigator.clipboard.writeText(shareText);
        Alert.alert('복사 완료', '결과가 클립보드에 복사되었습니다.');
      } catch {
        Alert.alert('알림', '공유 기능은 앱에서 사용 가능합니다.');
      }
    }
  };

   // PNG 저장 (웹: html2canvas, 모바일: captureRef)
  const handlePngSave = async () => {
    try {
      if (Platform.OS === 'web') {
        // 웹: html2canvas 사용
        const html2canvas = (await import('html2canvas')).default;
        const element = captureViewRef.current;
        
        if (!element) {
          Alert.alert('오류', '캡처할 영역을 찾을 수 없습니다.');
          return;
        }

        const canvas = await html2canvas(element as any, {
          backgroundColor: null,
          scale: 2,
          logging: false,
        });

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `career-compass-result-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            Alert.alert('완료', '이미지가 다운로드되었습니다!');
          }
        });
      } else {
        // 모바일: captureRef 사용
        if (captureViewRef.current) {
          const uri = await captureRef(captureViewRef.current, {
            format: 'png',
            quality: 1,
          });

          const Sharing = require('expo-sharing');
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
          } else {
            Alert.alert('오류', '공유 기능을 사용할 수 없습니다.');
          }
        }
      }
    } catch (error) {
      console.log('Capture error:', error);
      Alert.alert('오류', '이미지 저장 중 문제가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== 상단: 요약 카드 영역 ===== */}
        {/* ===== 상단: 요약 카드 영역 ===== */}
        <SummaryCard
          topField={topCareer.field}
          score={topCareer.score}
          nickname={displayNickname}
          character={profile?.character || 'Female_1'}
          level={displayLevel}
          onKakaoShare={handleKakaoShare}
          onPngSave={handlePngSave}
          onToggleDetail={handleToggleDetail}
          isDetailOpen={isDetailOpen}
          captureRef={captureViewRef}
        />

        {/* ===== 하단: 상세 분석 레이어 (접힘/펼침) ===== */}
        {isDetailOpen && (
          <View
            onLayout={(event) => {
              detailSectionY.current = event.nativeEvent.layout.y;
            }}
          >
            {/* 상세 분석 구분선 */}
            <View style={styles.detailDivider}>
              <Text style={styles.theoryBadgeText}>
                🎓 과학적 검사 기반 : HOLLAND / 다중지능 / 진로발달 이론
              </Text>
            </View>

            {/* 레이더 차트 */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.chartContainer}
            >
              <Text style={styles.sectionTitle}>적성 분석 차트</Text>
              <View style={styles.chartWrapper}>
                <RadarChart scores={displayScores} />
              </View>
            </Animated.View>

            {/* 상위 3개 추천 */}
            <View style={styles.recommendSection}>
              <Text style={styles.sectionTitle}>맞춤 진로 추천</Text>
              {topCareers.map((item, index) => (
                <RecommendationCard
                  key={item.field}
                  rank={index + 1}
                  field={item.field}
                  score={item.score}
                  delay={200 + index * 100}
                  onDetailPress={() => router.push(`/career/${item.field}`)}
                />
              ))}
            </View>

            {/* 상세 분석 섹션 */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>상세 분석</Text>

              {/* 강점/약점 분석 */}
              <StrengthWeaknessCard
                topField={topCareer.field}
                bottomField={bottomCareer.field}
              />

              {/* 추천 활동 */}
              <RecommendedActivities field={topCareer.field} />

              {/* 미래 직업 */}
              <FutureJobsSection topCareers={topCareers} />

              {/* 종합 코멘트 */}
              <SummaryComment topField={topCareer.field} score={topCareer.score} />

              {/* PDF 저장 버튼 (상세 리포트 하단) */}
              <Pressable
                style={({ pressed }) => [
                  styles.pdfSaveButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleExportPDF}
              >
                <Text style={styles.pdfSaveIcon}>📄</Text>
                <Text style={styles.pdfSaveText}>상세 리포트 PDF 저장</Text>
              </Pressable>

              {/* 하단 상세 분석 접기 버튼 */}
              <Pressable
                style={({ pressed }) => [
                  styles.bottomFoldButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleToggleDetail}
              >
                <Text style={styles.bottomFoldButtonText}>📊 상세 분석 접기 ▲</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 하단 버튼 영역 */}
        <View style={styles.buttonSection}>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleRetry}
            >
              <Text style={styles.secondaryButtonText}>다시 검사하기</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleGoHome}
            >
              <LinearGradient
                colors={Colors.primary.gradient as readonly [string, string]}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>홈으로</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },

  // ===== 요약 카드 스타일 =====
  // ===== 요약 카드 스타일 =====
  summaryCardContainer: {
    marginBottom: Spacing.sm,
    overflow: 'hidden', // 캡처 시 깔끔하게
  },
  summaryCardGradient: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    minHeight: SCREEN_HEIGHT * 0.75, // 화면의 75% 정도 차지
    justifyContent: 'center', // 세로 중앙 정렬 유도
  },
  // 상단 여백 (40px 정도)
  topSpacer: {
    height: 48,
  },
  // 캐릭터 섹션
  characterSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  characterCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.25)', // 은은한 원형 배경
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  // 인사말
  greetingText: {
    ...TextStyle.body,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  // 유형 섹션
  typeSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeNameRow: {
    // 삭제됨 (iconCircle로 대체)
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeName: {
    fontSize: 28,
    fontWeight: '800', // Fat font
    color: Colors.text.inverse,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 48, // 점수 강조
    fontWeight: '900',
    color: Colors.text.inverse,
  },
  scoreUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginLeft: 4,
  },

  // 키워드 섹션 (태그 스타일)
  keywordsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  keywordChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  keywordText: {
    ...TextStyle.caption1,
    color: Colors.text.inverse,
    fontWeight: '700',
  },

  // 공유 버튼 (동일 크기, 48px 높이)
  shareButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12, // 간격
    marginBottom: Spacing.lg,
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  shareBtn: {
    flex: 1, // 1:1 비율
    maxWidth: 160, // 너무 넓어지지 않게
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12, // 모바일 표준 둥글기
    gap: 8,
    ...Shadow.sm,
  },
  shareBtnIcon: {
    fontSize: 18,
  },
  shareBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  // 카카오 버튼 (노랑)
  kakaoBtn: {
    backgroundColor: '#FEE500',
  },
  kakaoBtnText: {
    ...TextStyle.callout,
    fontWeight: '700',
    color: '#3C1E1E', // 카카오 가이드라인 준수
  },
  // 이미지 저장 버튼 (투명+테두리)
  imageBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  imageBtnText: {
    ...TextStyle.callout,
    fontWeight: '700',
    color: Colors.text.inverse,
  },

  // 신뢰 배지 (문구)
  trustBadgeInCard: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.1)', // 살짝 어둡게 해서 가독성 확보
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  trustBadgeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // 상세 분석 보기 (텍스트 링크)
  detailToggleLink: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  detailToggleLinkPressed: {
    opacity: 0.7,
  },
  detailToggleLinkText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textDecorationLine: 'underline', // 링크 느낌
  },


  // ===== 신뢰 배지 스타일 =====
  trustBadgeContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  trustBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Shadow.sm,
  },
  trustIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  trustIcon: {
    fontSize: 20,
  },
  trustTextContainer: {
    flex: 1,
  },
  trustTitle: {
    ...TextStyle.caption1,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  trustMethods: {
    ...TextStyle.caption2,
    color: Colors.text.tertiary,
  },
  trustQuestionCount: {
    ...TextStyle.caption2,
    fontWeight: '600',
    color: Colors.primary.main,
    marginTop: 2,
  },

  // ===== 공유 버튼 스타일 =====

  pdfBtn: {
    backgroundColor: Colors.secondary.main,
  },
  pdfBtnIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  pdfBtnText: {
    ...TextStyle.caption2,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  moreBtn: {
    backgroundColor: Colors.primary.main,
  },
  moreBtnIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  moreBtnText: {
    ...TextStyle.caption2,
    fontWeight: '600',
    color: Colors.text.inverse,
  },

  // PDF 저장 버튼 (상세 리포트 하단)
  pdfSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  pdfSaveIcon: {
    fontSize: 18,
  },
  pdfSaveText: {
    ...TextStyle.callout,
    fontWeight: '600',
    color: Colors.text.inverse,
  },

  // ===== 상세 분석 구분선 및 상단 텍스트 =====
  detailDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  theoryBadgeText: {
    ...TextStyle.caption1,
    color: Colors.primary.main,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: Colors.primary.main + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },

  // 하단 접기 버튼
  bottomFoldButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  bottomFoldButtonText: {
    ...TextStyle.callout,
    color: Colors.text.tertiary,
    fontWeight: '600',
  },

  // ===== 기존 스타일 (수정) =====
  chartContainer: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  sectionTitle: {
    ...TextStyle.headline,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  chartWrapper: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  recommendSection: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  recommendCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  recommendRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  recommendRankText: {
    ...TextStyle.caption1,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  recommendIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  recommendInfo: {
    flex: 1,
  },
  recommendLabel: {
    ...TextStyle.headline,
    color: Colors.text.primary,
  },
  recommendScore: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  recommendBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  recommendBadgeText: {
    ...TextStyle.caption2,
    fontWeight: '600',
  },
  recommendJobs: {
    marginTop: Spacing.sm,
  },
  recommendJobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  recommendJobsTitle: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  detailButtonPressed: {
    opacity: 0.7,
    backgroundColor: Colors.gray[100],
  },
  detailButtonText: {
    ...TextStyle.caption1,
    fontWeight: '600',
  },
  recommendJobsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  jobChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  jobChipText: {
    ...TextStyle.caption1,
    fontWeight: '500',
  },
  buttonSection: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  shareButton: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  shareButtonText: {
    ...TextStyle.headline,
    color: Colors.primary.main,
  },
  pdfButton: {
    flex: 1,
    backgroundColor: Colors.secondary.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  pdfButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  secondaryButtonText: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
  },
  primaryButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadow.md,
  },
  primaryButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  // 상세 분석 섹션
  detailSection: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  analysisCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  analysisSectionTitle: {
    ...TextStyle.headline,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  // 강점 섹션
  strengthSection: {
    marginBottom: Spacing.lg,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  strengthIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  strengthIconText: {
    fontSize: 16,
  },
  strengthTitle: {
    ...TextStyle.callout,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  strengthDescription: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  traitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  traitChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  traitChipText: {
    ...TextStyle.caption1,
    fontWeight: '500',
  },
  strengthPointsContainer: {
    gap: Spacing.xs,
  },
  strengthPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  strengthBullet: {
    fontSize: 14,
    fontWeight: '700',
  },
  strengthPointText: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
  },
  // 성장 포인트
  growthSection: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  growthDescription: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  growthTips: {
    gap: Spacing.xs,
  },
  growthTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  growthTipIcon: {
    fontSize: 14,
  },
  growthTipText: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
  },
  // 활동 섹션
  activitySection: {
    marginBottom: Spacing.lg,
  },
  activityLabel: {
    ...TextStyle.callout,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  activityItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmoji: {
    fontSize: 14,
  },
  activityText: {
    flex: 1,
    ...TextStyle.caption1,
    color: Colors.text.primary,
  },
  // 과목 섹션
  subjectSection: {},
  subjectList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  subjectChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  subjectText: {
    ...TextStyle.caption1,
    fontWeight: '600',
  },
  // 미래 직업 섹션
  futureJobsSubtitle: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  futureJobSection: {
    marginBottom: Spacing.md,
  },
  futureJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  futureJobIcon: {
    fontSize: 18,
  },
  futureJobLabel: {
    ...TextStyle.callout,
    fontWeight: '600',
  },
  futureJobList: {
    paddingLeft: Spacing.md,
  },
  futureJobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  futureJobBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  futureJobText: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
  },
  // 종합 코멘트
  summaryCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryTitle: {
    ...TextStyle.headline,
    color: Colors.text.primary,
  },
  summaryText: {
    ...TextStyle.body,
    color: Colors.text.primary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  summaryTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.gray[50],
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  summaryTipIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  summaryTipText: {
    flex: 1,
    ...TextStyle.caption1,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
