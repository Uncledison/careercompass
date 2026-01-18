/**
 * 진로계열 상세 소개 페이지
 * 각 계열별 설명, 특성, 직업 등 안내
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import { CareerField } from '../../src/types';

// 계열별 상세 정보
interface CareerFieldDetail {
  label: string;
  icon: string;
  color: string;
  description: string;
  characteristics: string[];
  skills: string[];
  subjects: string[];
  currentJobs: string[];
  futureJobs: string[];
  activities: string[];
  famousPeople: string[];
}

const careerFieldData: Record<CareerField, CareerFieldDetail> = {
  humanities: {
    label: '인문',
    icon: '📚',
    color: Colors.career.humanities.main,
    description: '인문 계열은 인간의 사상, 문화, 역사, 언어를 탐구하는 분야입니다. 글쓰기와 소통 능력이 중요하며, 깊이 있는 사고와 창의적 표현을 통해 세상을 이해하고 변화시킵니다.',
    characteristics: [
      '언어와 글쓰기에 관심이 많아요',
      '책 읽기와 토론을 좋아해요',
      '다양한 문화에 호기심이 있어요',
      '감정 표현과 공감 능력이 뛰어나요',
      '역사와 철학적 질문에 관심이 많아요',
    ],
    skills: ['창의적 글쓰기', '비판적 사고', '언어 감각', '공감 능력', '의사소통'],
    subjects: ['국어', '영어', '역사', '철학', '심리학', '문학'],
    currentJobs: ['작가', '기자', '번역가', '아나운서', '심리상담사', '교사', '학예사', '출판 편집자'],
    futureJobs: ['AI 콘텐츠 작가', '데이터 스토리텔러', '문화기획자', '심리 AI 개발자', '디지털 큐레이터'],
    activities: ['독서 토론 동아리', '글쓰기 대회', '외국어 학습', '역사 탐방', '팟캐스트 제작'],
    famousPeople: ['J.K. 롤링 (작가)', '유시민 (작가)', '손석희 (기자)', '정재승 (과학 커뮤니케이터)'],
  },
  social: {
    label: '사회',
    icon: '🌍',
    color: Colors.career.social.main,
    description: '사회 계열은 인간 사회의 구조, 제도, 경제, 정치를 연구하는 분야입니다. 사람들과 소통하고 협력하여 사회 문제를 해결하며, 공동체의 발전에 기여합니다.',
    characteristics: [
      '뉴스와 시사 문제에 관심이 많아요',
      '토론과 설득을 잘해요',
      '리더십이 있고 팀 활동을 좋아해요',
      '공정함과 정의에 관심이 많아요',
      '사람들과 어울리는 것을 좋아해요',
    ],
    skills: ['리더십', '협상력', '논리적 사고', '의사소통', '문제해결력'],
    subjects: ['사회', '정치', '경제', '법학', '행정학', '국제관계'],
    currentJobs: ['CEO', '마케터', '변호사', '외교관', '기업 컨설턴트', '사회복지사', '정치인'],
    futureJobs: ['ESG 컨설턴트', '스타트업 CEO', '국제기구 전문가', '디지털 정책 전문가', '소셜 임팩트 매니저'],
    activities: ['학생회 활동', '모의재판', '토론 대회', '봉사활동', '모의 UN'],
    famousPeople: ['반기문 (외교관)', '이재용 (기업인)', '박영선 (정치인)', '김연아 (스포츠 행정)'],
  },
  natural: {
    label: '자연',
    icon: '🔬',
    color: Colors.career.natural.main,
    description: '자연 계열은 자연 현상의 원리와 법칙을 탐구하는 분야입니다. 실험과 관찰을 통해 세상의 비밀을 밝히고, 과학적 발견으로 인류의 지식을 확장합니다.',
    characteristics: [
      '자연 현상에 "왜?"라는 질문을 자주 해요',
      '실험하고 관찰하는 것을 좋아해요',
      '숫자와 계산에 강해요',
      '꼼꼼하고 인내심이 있어요',
      '논리적으로 생각하는 것을 좋아해요',
    ],
    skills: ['탐구심', '분석력', '논리적 사고', '인내심', '정밀함'],
    subjects: ['수학', '물리', '화학', '생물', '지구과학', '천문학'],
    currentJobs: ['과학자', '연구원', '기후전문가', '수학자', '물리학자', '화학자', '생물학자'],
    futureJobs: ['기후과학자', '바이오 연구원', '양자컴퓨팅 전문가', '우주 과학자', '나노기술 전문가'],
    activities: ['과학 실험 동아리', '수학 올림피아드', '자연 관찰', '천체 관측', '과학 전시회'],
    famousPeople: ['아인슈타인 (물리학자)', '마리 퀴리 (화학자)', '이휘소 (물리학자)', '장영실 (발명가)'],
  },
  engineering: {
    label: '공학',
    icon: '🤖',
    color: Colors.career.engineering.main,
    description: '공학 계열은 과학 지식을 활용해 실생활에 유용한 기술과 제품을 만드는 분야입니다. 창의적인 아이디어로 문제를 해결하고, 새로운 기술로 세상을 변화시킵니다.',
    characteristics: [
      '뭔가 만들고 조립하는 것을 좋아해요',
      '컴퓨터와 기계에 관심이 많아요',
      '문제가 생기면 해결책을 찾아요',
      '새로운 기술에 호기심이 많아요',
      '논리적이고 체계적으로 생각해요',
    ],
    skills: ['창의력', '문제해결력', '기술 감각', '도전정신', '논리적 사고'],
    subjects: ['수학', '물리', '정보', '기술가정', '프로그래밍', '전자공학'],
    currentJobs: ['AI 개발자', '로봇공학자', '건축가', '게임 개발자', '앱 개발자', '전기공학자'],
    futureJobs: ['AI 엔지니어', '메타버스 개발자', '자율주행 엔지니어', '드론 전문가', '우주 엔지니어'],
    activities: ['로봇 동아리', '코딩 부트캠프', '발명 대회', '메이커 스페이스', '해커톤'],
    famousPeople: ['일론 머스크 (엔지니어)', '스티브 잡스 (혁신가)', '이수만 (기술 기업인)', '장병규 (AI 전문가)'],
  },
  medicine: {
    label: '의학',
    icon: '🏥',
    color: Colors.career.medicine.main,
    description: '의학 계열은 인간의 건강과 생명을 다루는 분야입니다. 질병의 예방과 치료를 연구하고, 아픈 사람들을 돌보며 생명의 소중함을 지킵니다.',
    characteristics: [
      '다른 사람을 돕는 것에 보람을 느껴요',
      '생명과 건강에 관심이 많아요',
      '꼼꼼하고 책임감이 강해요',
      '오랜 시간 집중할 수 있어요',
      '사람의 몸과 마음에 관심이 있어요',
    ],
    skills: ['봉사정신', '꼼꼼함', '책임감', '인내심', '집중력'],
    subjects: ['생물', '화학', '보건', '심리학', '해부학', '약학'],
    currentJobs: ['의사', '간호사', '약사', '수의사', '물리치료사', '한의사', '치과의사'],
    futureJobs: ['정밀의료 전문의', '바이오 헬스케어 전문가', 'AI 진단 개발자', '유전자 치료 전문가', '원격의료 전문가'],
    activities: ['의료 봉사', '생물 실험', '응급처치 교육', '보건 동아리', '병원 탐방'],
    famousPeople: ['이국종 (외과의사)', '백선엽 (의학자)', '이영애 (약학자)', '플로렌스 나이팅게일 (간호사)'],
  },
  arts: {
    label: '예체능',
    icon: '🎨',
    color: Colors.career.arts.main,
    description: '예체능 계열은 예술적 감각과 신체 능력을 발휘하는 분야입니다. 창의적인 표현과 끊임없는 연습을 통해 아름다움과 감동을 전달합니다.',
    characteristics: [
      '그림, 음악, 운동 중 하나에 빠져 있어요',
      '자신만의 방식으로 표현하는 것을 좋아해요',
      '연습과 훈련을 꾸준히 할 수 있어요',
      '감성이 풍부하고 창의적이에요',
      '무대나 경기에서 실력을 발휘해요',
    ],
    skills: ['창의성', '표현력', '감성', '끈기', '집중력'],
    subjects: ['미술', '음악', '체육', '영상', '디자인', '무용'],
    currentJobs: ['디자이너', '음악가', '운동선수', '유튜버', '배우', '화가', '사진작가'],
    futureJobs: ['UX/UI 디자이너', '버추얼 아티스트', 'e스포츠 선수', '콘텐츠 크리에이터', '메타버스 아티스트'],
    activities: ['미술 동아리', '밴드 활동', '스포츠 클럽', '영상 제작', '댄스 동아리'],
    famousPeople: ['BTS (아티스트)', '손흥민 (축구선수)', '봉준호 (영화감독)', '백남준 (미디어 아티스트)'],
  },
};

export default function CareerDetailScreen() {
  const { field } = useLocalSearchParams<{ field: string }>();
  const router = useRouter();

  const careerField = field as CareerField;
  const data = careerFieldData[careerField];

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>잘못된 접근입니다.</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
              fill={Colors.gray[700]}
            />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>{data.label} 계열</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 히어로 섹션 */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={[data.color, data.color + 'CC'] as const}
            style={styles.heroSection}
          >
            <Text style={styles.heroIcon}>{data.icon}</Text>
            <Text style={styles.heroTitle}>{data.label} 계열</Text>
            <Text style={styles.heroDescription}>{data.description}</Text>
          </LinearGradient>
        </Animated.View>

        {/* 이런 특성이 있어요 */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>이런 특성이 있어요</Text>
          <View style={styles.card}>
            {data.characteristics.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={[styles.listBullet, { color: data.color }]}>✓</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* 필요한 역량 */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>필요한 역량</Text>
          <View style={styles.chipContainer}>
            {data.skills.map((skill, idx) => (
              <View
                key={idx}
                style={[styles.chip, { backgroundColor: data.color + '20' }]}
              >
                <Text style={[styles.chipText, { color: data.color }]}>{skill}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* 관련 과목 */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>관련 과목</Text>
          <View style={styles.chipContainer}>
            {data.subjects.map((subject, idx) => (
              <View
                key={idx}
                style={[styles.chip, { borderWidth: 1.5, borderColor: data.color, backgroundColor: 'transparent' }]}
              >
                <Text style={[styles.chipText, { color: data.color }]}>{subject}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* 대표 직업 */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>대표 직업</Text>
          <View style={styles.card}>
            <Text style={styles.subSectionTitle}>현재 인기 직업</Text>
            <View style={styles.jobGrid}>
              {data.currentJobs.map((job, idx) => (
                <View key={idx} style={styles.jobItem}>
                  <View style={[styles.jobBullet, { backgroundColor: data.color }]} />
                  <Text style={styles.jobText}>{job}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.subSectionTitle, { marginTop: Spacing.md }]}>미래 유망 직업</Text>
            <View style={styles.jobGrid}>
              {data.futureJobs.map((job, idx) => (
                <View key={idx} style={styles.jobItem}>
                  <Text style={styles.futureJobIcon}>🚀</Text>
                  <Text style={[styles.jobText, { color: data.color, fontWeight: '600' }]}>{job}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* 추천 활동 */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>추천 활동</Text>
          <View style={styles.card}>
            {data.activities.map((activity, idx) => (
              <View key={idx} style={styles.activityItem}>
                <Text style={styles.activityIcon}>
                  {['🎯', '📖', '🔍', '🎨', '💡'][idx % 5]}
                </Text>
                <Text style={styles.activityText}>{activity}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* 유명인 */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>이 분야의 유명인</Text>
          <View style={styles.card}>
            {data.famousPeople.map((person, idx) => (
              <View key={idx} style={styles.personItem}>
                <Text style={styles.personIcon}>⭐</Text>
                <Text style={styles.personText}>{person}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.ctaSection}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: data.color },
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={() => router.push('/(tabs)/assessment')}
          >
            <Text style={styles.ctaButtonText}>내 적성 검사하러 가기</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  headerBackButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...TextStyle.headline,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  heroSection: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...TextStyle.largeTitle,
    color: Colors.text.inverse,
    marginBottom: Spacing.sm,
  },
  heroDescription: {
    ...TextStyle.body,
    color: Colors.text.inverse,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...TextStyle.headline,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  listBullet: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  listText: {
    ...TextStyle.body,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    ...TextStyle.footnote,
    fontWeight: '600',
  },
  subSectionTitle: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  jobGrid: {
    gap: Spacing.xs,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  jobBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  jobText: {
    ...TextStyle.body,
    color: Colors.text.primary,
  },
  futureJobIcon: {
    fontSize: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  activityIcon: {
    fontSize: 18,
  },
  activityText: {
    ...TextStyle.body,
    color: Colors.text.primary,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  personIcon: {
    fontSize: 16,
  },
  personText: {
    ...TextStyle.body,
    color: Colors.text.primary,
  },
  ctaSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  ctaButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadow.md,
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
});
