/**
 * 도움말 페이지
 * 앱 사용 안내 및 FAQ
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../src/constants';

// FAQ 아이템 컴포넌트
const FAQItem = ({
  question,
  answer,
  isOpen,
  onToggle,
  delay,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
}) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
    <Pressable
      style={[styles.faqItem, isOpen && styles.faqItemOpen]}
      onPress={onToggle}
    >
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQuestionText}>{question}</Text>
        <Text style={styles.faqArrow}>{isOpen ? '▲' : '▼'}</Text>
      </View>
      {isOpen && (
        <Text style={styles.faqAnswer}>{answer}</Text>
      )}
    </Pressable>
  </Animated.View>
);

// 가이드 스텝 컴포넌트
const GuideStep = ({
  step,
  title,
  description,
  icon,
  delay,
}: {
  step: number;
  title: string;
  description: string;
  icon: string;
  delay: number;
}) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(400)}
    style={styles.guideStep}
  >
    <View style={styles.guideStepNumber}>
      <Text style={styles.guideStepNumberText}>{step}</Text>
    </View>
    <View style={styles.guideStepContent}>
      <View style={styles.guideStepHeader}>
        <Text style={styles.guideStepIcon}>{icon}</Text>
        <Text style={styles.guideStepTitle}>{title}</Text>
      </View>
      <Text style={styles.guideStepDescription}>{description}</Text>
    </View>
  </Animated.View>
);

export default function HelpScreen() {
  const router = useRouter();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: '검사는 얼마나 걸리나요?',
      answer: '학년에 따라 다르지만, 보통 10-15분 정도 소요됩니다. 초등학생용은 더 짧고 재미있게 구성되어 있어요.',
    },
    {
      question: '검사 중에 나가면 어떻게 되나요?',
      answer: '걱정 마세요! 검사 도중 나가도 자동으로 저장됩니다. 다음에 앱을 열면 "이어서 하기"로 이전에 멈춘 곳부터 다시 시작할 수 있어요.',
    },
    {
      question: '검사 결과는 정확한가요?',
      answer: '이 검사는 HOLLAND 직업흥미이론, 다중지능이론, 진로발달이론을 기반으로 제작되었습니다. 과학적으로 검증된 이론을 바탕으로 하지만, 참고 자료로 활용하시고 다양한 경험을 통해 진로를 탐색하시길 권장합니다.',
    },
    {
      question: '검사 결과를 저장할 수 있나요?',
      answer: '네! 모든 검사 결과는 자동으로 저장됩니다. "검사 기록" 탭에서 이전 결과를 모두 확인할 수 있고, PDF로 내보내기도 가능해요.',
    },
    {
      question: '여러 번 검사해도 되나요?',
      answer: '물론이에요! 시간이 지나면서 관심사와 적성이 변할 수 있어요. 정기적으로 검사하면 자신의 변화를 확인할 수 있어 유익합니다.',
    },
    {
      question: '가족이 함께 사용할 수 있나요?',
      answer: '"내 정보"에서 이름을 변경하면 각자의 이름으로 검사 결과가 저장됩니다. 검사 기록에서 누구의 결과인지 구분할 수 있어요.',
    },
  ];

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
        <Text style={styles.headerTitle}>도움말</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 앱 소개 */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.introSection}>
          <Text style={styles.introIcon}>🧭</Text>
          <Text style={styles.introTitle}>Career Compass</Text>
          <Text style={styles.introSubtitle}>청소년 진로적성검사 앱</Text>
          <Text style={styles.introDescription}>
            Career Compass는 청소년들이 자신의 적성과 흥미를 발견하고,
            미래 진로를 탐색할 수 있도록 도와주는 앱입니다.
          </Text>
        </Animated.View>

        {/* 검사 기반 이론 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>검사의 과학적 기반</Text>
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.theoryCard}>
            <View style={styles.theoryItem}>
              <Text style={styles.theoryIcon}>🎯</Text>
              <View style={styles.theoryContent}>
                <Text style={styles.theoryTitle}>HOLLAND 직업흥미이론</Text>
                <Text style={styles.theoryDescription}>
                  존 홀랜드 박사가 개발한 이론으로, 사람의 흥미 유형과 직업 환경을 6가지로 분류합니다.
                </Text>
              </View>
            </View>
            <View style={styles.theoryItem}>
              <Text style={styles.theoryIcon}>🧠</Text>
              <View style={styles.theoryContent}>
                <Text style={styles.theoryTitle}>다중지능이론</Text>
                <Text style={styles.theoryDescription}>
                  하워드 가드너 교수의 이론으로, 인간의 지능이 8가지 영역으로 구성된다고 봅니다.
                </Text>
              </View>
            </View>
            <View style={styles.theoryItem}>
              <Text style={styles.theoryIcon}>📈</Text>
              <View style={styles.theoryContent}>
                <Text style={styles.theoryTitle}>진로발달이론</Text>
                <Text style={styles.theoryDescription}>
                  도널드 슈퍼의 이론으로, 연령에 따른 진로 발달 단계를 설명합니다.
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* 사용 방법 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이렇게 사용하세요</Text>

          <GuideStep
            step={1}
            icon="👤"
            title="내 정보 설정"
            description="먼저 '내 정보' 탭에서 이름과 학년을 설정해주세요. 검사 결과에 이름이 표시됩니다."
            delay={200}
          />

          <GuideStep
            step={2}
            icon="🎮"
            title="학년에 맞는 검사 선택"
            description="홈 화면에서 학년에 맞는 검사를 선택하세요. 초등/중학/고등학생 별로 난이도가 다릅니다."
            delay={300}
          />

          <GuideStep
            step={3}
            icon="✍️"
            title="질문에 솔직하게 답변"
            description="정답이 없는 질문들이에요. 평소 자신의 모습을 떠올리며 솔직하게 답해주세요."
            delay={400}
          />

          <GuideStep
            step={4}
            icon="📊"
            title="결과 확인 및 저장"
            description="검사가 끝나면 6대 계열별 적성 점수와 추천 직업을 확인할 수 있어요. PDF로 저장도 가능합니다."
            delay={500}
          />

          <GuideStep
            step={5}
            icon="📚"
            title="진로 계열 탐색"
            description="홈 화면의 '6대 진로 계열'을 탭하면 각 분야에 대한 상세 정보를 볼 수 있어요."
            delay={600}
          />
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>자주 묻는 질문</Text>
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFAQ === index}
              onToggle={() => toggleFAQ(index)}
              delay={700 + index * 50}
            />
          ))}
        </View>

        {/* 문의 안내 */}
        <Animated.View
          entering={FadeInDown.delay(1000).duration(400)}
          style={styles.contactSection}
        >
          <Text style={styles.contactTitle}>더 궁금한 점이 있으신가요?</Text>
          <Text style={styles.contactDescription}>
            앱 사용 중 문제가 있거나 개선 의견이 있으시면 언제든 연락해주세요.
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>버전</Text>
            <Text style={styles.contactValue}>1.0.0</Text>
          </View>
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
  introSection: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadow.md,
  },
  introIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  introTitle: {
    ...TextStyle.title1,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  introSubtitle: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  introDescription: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...TextStyle.headline,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  theoryCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  theoryItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  theoryIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  theoryContent: {
    flex: 1,
  },
  theoryTitle: {
    ...TextStyle.callout,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  theoryDescription: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  guideStep: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  guideStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  guideStepNumberText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
  guideStepContent: {
    flex: 1,
  },
  guideStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  guideStepIcon: {
    fontSize: 18,
  },
  guideStepTitle: {
    ...TextStyle.callout,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  guideStepDescription: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  faqItem: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  faqItemOpen: {
    borderWidth: 1,
    borderColor: Colors.primary.main + '40',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    ...TextStyle.callout,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  faqArrow: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  faqAnswer: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    lineHeight: 22,
  },
  contactSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  contactTitle: {
    ...TextStyle.callout,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  contactDescription: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  contactInfo: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  contactLabel: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  contactValue: {
    ...TextStyle.caption1,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});
