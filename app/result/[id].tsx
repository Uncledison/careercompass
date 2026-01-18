/**
 * 검사 결과 화면
 * 레이더 차트와 추천 직업 표시
 */

import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import { useAssessmentStore } from '../../src/stores/assessmentStore';
import { useHistoryStore } from '../../src/stores/historyStore';
import { useProfileStore, getShortGradeLabel } from '../../src/stores/profileStore';
import { CareerField, CareerScores } from '../../src/types';
import { exportToPDF } from '../../src/utils/pdfExport';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 차트 크기를 적절하게 제한 (최대 280px)
const CHART_SIZE = Math.min(SCREEN_WIDTH - 80, 280);
const CHART_PADDING = 35; // 라벨을 위한 여백
const SVG_SIZE = CHART_SIZE + CHART_PADDING * 2;
const CENTER = SVG_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 20;

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
              y={labelPoint.y - 6}
              fontSize={12}
              fontWeight="600"
              fill={Colors.text.primary}
              textAnchor="middle"
            >
              {info.icon} {info.label}
            </SvgText>
            <SvgText
              x={labelPoint.x}
              y={labelPoint.y + 8}
              fontSize={11}
              fill={info.color}
              fontWeight="bold"
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
          <Text style={styles.recommendLabel}>{info.label} 계열</Text>
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
          {bottomInfo.label} 계열 역량을 키워보면 더 다양한 가능성이 열려요!
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
                {info.label} 계열
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
    if (score >= 85) {
      return `${info.label} 계열에 대한 적성이 매우 높아요! 이 분야에서 뛰어난 성과를 낼 가능성이 커요.`;
    } else if (score >= 70) {
      return `${info.label} 계열에 좋은 적성을 보여주고 있어요. 꾸준히 관심을 가지면 더 성장할 수 있어요.`;
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

  // 테스트용 기본 점수 (실제로는 스토어에서 가져옴)
  const displayScores = scores || {
    humanities: 65,
    social: 72,
    natural: 78,
    engineering: 92,
    medicine: 71,
    arts: 58,
  };

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
        message: `Career Compass 검사 결과\n\n나의 1순위 진로: ${topInfo.icon} ${topInfo.label} 계열 (${topCareer.score}점)\n\n추천 직업: ${topInfo.jobs.join(', ')}\n\n#CareerCompass #진로탐색`,
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
      // 학년을 "초등2", "중2", "고2" 형식으로
      const gradeLabel = profile?.schoolType && profile?.grade
        ? getShortGradeLabel(profile.schoolType, profile.grade)
        : undefined;
      await exportToPDF(
        displayScores,
        level || 'elementary',
        Date.now(),
        profile?.nickname,
        gradeLabel
      );
    } catch (error) {
      console.log('PDF export error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Text style={styles.headerTitle}>검사 완료!</Text>
          <Text style={styles.headerSubtitle}>
            나의 진로 적성 분석 결과예요
          </Text>
        </Animated.View>

        {/* 1위 결과 하이라이트 */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.highlightCard}
        >
          <LinearGradient
            colors={[topInfo.color, topInfo.color + 'DD'] as const}
            style={styles.highlightGradient}
          >
            <View style={styles.highlightContent}>
              <Text style={styles.highlightLabel}>나의 1순위 진로</Text>
              <View style={styles.highlightMain}>
                <Text style={styles.highlightIcon}>{topInfo.icon}</Text>
                <Text style={styles.highlightTitle}>{topInfo.label} 계열</Text>
              </View>
              <Text style={styles.highlightScore}>{topCareer.score}점</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 레이더 차트 */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
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
              delay={600 + index * 150}
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
        </View>

        {/* 버튼 영역 */}
        <View style={styles.buttonSection}>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                { flex: 1 },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleShare}
            >
              <Text style={styles.shareButtonText}>📤 공유하기</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.pdfButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleExportPDF}
            >
              <Text style={styles.pdfButtonText}>📄 PDF 저장</Text>
            </Pressable>
          </View>

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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  headerTitle: {
    ...TextStyle.largeTitle,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  highlightCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadow.lg,
  },
  highlightGradient: {
    padding: Spacing.xl,
  },
  highlightContent: {
    alignItems: 'center',
  },
  highlightLabel: {
    ...TextStyle.caption1,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.sm,
  },
  highlightMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  highlightIcon: {
    fontSize: 40,
  },
  highlightTitle: {
    ...TextStyle.title1,
    color: Colors.text.inverse,
  },
  highlightScore: {
    ...TextStyle.largeTitle,
    color: Colors.text.inverse,
    fontWeight: '800',
  },
  chartContainer: {
    marginBottom: Spacing.lg,
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
