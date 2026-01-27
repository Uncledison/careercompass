import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import { GRADE_LEVEL_CONFIG } from '../../src/types';

interface AssessmentOptionProps {
  level: string;
  title: string;
  subtitle: string;
  description: string;
  questionCount: number;
  duration: string;
  emoji: string;
  colors: readonly [string, string, ...string[]];
  features: string[];
}

const AssessmentOption = ({
  level,
  title,
  subtitle,
  description,
  questionCount,
  duration,
  emoji,
  colors,
  features,
}: AssessmentOptionProps) => {
  const router = useRouter();

  return (
    <View style={styles.optionCard}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.optionHeader}
      >
        <View style={styles.optionHeaderContent}>
          <Text style={styles.optionEmoji}>{emoji}</Text>
          <View style={styles.optionHeaderText}>
            <Text style={styles.optionTitle}>{title}</Text>
            <Text style={styles.optionSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.optionBody}>
        <Text style={styles.optionDescription}>{description}</Text>

        <View style={styles.optionStats}>
          <View style={styles.optionStat}>
            <Text style={styles.optionStatValue}>{questionCount}</Text>
            <Text style={styles.optionStatLabel}>문항</Text>
          </View>
          <View style={styles.optionStatDivider} />
          <View style={styles.optionStat}>
            <Text style={styles.optionStatValue}>{duration}</Text>
            <Text style={styles.optionStatLabel}>소요시간</Text>
          </View>
        </View>

        <View style={styles.optionFeatures}>
          {features.map((feature, index) => (
            <View key={index} style={styles.optionFeature}>
              <Text style={styles.optionFeatureCheck}>✓</Text>
              <Text style={styles.optionFeatureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
          ]}
          onPress={() => router.push(`/assessment/${level}`)}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>검사 시작하기</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
};

export default function AssessmentScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>검사 선택</Text>
          <Text style={styles.headerSubtitle}>
            학년에 맞는 검사를 선택하세요
          </Text>
        </View>

        <AssessmentOption
          level="elementary"
          title="초등학생"
          subtitle="3-6학년"
          description="게임처럼 재미있게! 귀여운 캐릭터와 함께 미래 행성을 탐험하며 나의 흥미를 발견해요."
          questionCount={35}
          duration="12-15분"
          emoji="🎮"
          colors={['#4ECDC4', '#44A08D'] as const}
          features={[
            '게임 모드로 재미있게 진행',
            '캐릭터 표정으로 응답',
            '스테이지별 배지 획득',
          ]}
        />

        <AssessmentOption
          level="middle"
          title="중학생"
          subtitle="1-3학년"
          description="나침반 퀘스트를 통해 진로를 탐색해요. 다양한 미션을 클리어하며 나의 적성을 찾아보세요."
          questionCount={65}
          duration="20-25분"
          emoji="🧭"
          colors={['#667eea', '#764ba2'] as const}
          features={[
            '퀘스트 미션 형식',
            '상세한 성향 분석',
            '미래 직업 추천',
          ]}
        />

        <AssessmentOption
          level="high"
          title="고등학생"
          subtitle="1-3학년"
          description="심층적인 분석을 통해 대학 전공과 진로를 설계해요. 가치관과 적성을 종합적으로 평가합니다."
          questionCount={85}
          duration="25-30분"
          emoji="📊"
          colors={['#f857a6', '#ff5858'] as const}
          features={[
            '전문적인 분석 리포트',
            '대학 학과 추천',
            '미래 커리어 로드맵',
          ]}
        />
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
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...TextStyle.title2,
    marginLeft: 24,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  optionCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  optionHeader: {
    padding: Spacing.md,
  },
  optionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionEmoji: {
    fontSize: 40,
  },
  optionHeaderText: {
    flex: 1,
  },
  optionTitle: {
    ...TextStyle.title2,
    color: Colors.text.inverse,
  },
  optionSubtitle: {
    ...TextStyle.callout,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  optionBody: {
    padding: Spacing.md,
  },
  optionDescription: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  optionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  optionStat: {
    flex: 1,
    alignItems: 'center',
  },
  optionStatValue: {
    ...TextStyle.title2,
    color: Colors.text.primary,
  },
  optionStatLabel: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  optionStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.gray[300],
  },
  optionFeatures: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionFeatureCheck: {
    color: Colors.semantic.success,
    fontWeight: '600',
  },
  optionFeatureText: {
    ...TextStyle.callout,
    color: Colors.text.primary,
  },
  startButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  startButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  startButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  startButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
});
