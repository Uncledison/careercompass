/**
 * 검사 통계/분석 페이지
 * 여러 번의 검사 결과 변화 추이 분석
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle, G, Text as SvgText, Rect } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../src/constants';
import { useHistoryStore, SavedResult, formatDate } from '../src/stores/historyStore';
import { CareerField } from '../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.md * 4;
const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 40 };

// 계열 정보
const careerFieldInfo: Record<CareerField, { label: string; icon: string; color: string }> = {
  humanities: { label: '인문', icon: '📚', color: Colors.career.humanities.main },
  social: { label: '사회', icon: '🌍', color: Colors.career.social.main },
  natural: { label: '자연', icon: '🔬', color: Colors.career.natural.main },
  engineering: { label: '공학', icon: '🤖', color: Colors.career.engineering.main },
  medicine: { label: '의학', icon: '🏥', color: Colors.career.medicine.main },
  arts: { label: '예체능', icon: '🎨', color: Colors.career.arts.main },
};

const careerFields: CareerField[] = ['humanities', 'social', 'natural', 'engineering', 'medicine', 'arts'];

// 라인 차트 컴포넌트
const TrendLineChart = ({
  results,
  selectedField,
}: {
  results: SavedResult[];
  selectedField: CareerField | 'all';
}) => {
  const chartInnerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // 최근 10개만 표시 (오래된 순으로 정렬)
  const displayResults = [...results].reverse().slice(-10);

  if (displayResults.length < 2) {
    return (
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartPlaceholderText}>
          2회 이상 검사 후 추이를 확인할 수 있어요
        </Text>
      </View>
    );
  }

  const xStep = chartInnerWidth / (displayResults.length - 1);

  const getY = (score: number) => {
    return CHART_PADDING.top + chartInnerHeight - (score / 100) * chartInnerHeight;
  };

  const getX = (index: number) => {
    return CHART_PADDING.left + index * xStep;
  };

  // 그리드 라인
  const gridLines = [0, 25, 50, 75, 100].map((value) => ({
    y: getY(value),
    label: value.toString(),
  }));

  // 선택된 필드들의 데이터
  const fieldsToShow = selectedField === 'all' ? careerFields : [selectedField];

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* 배경 그리드 */}
      {gridLines.map((line, idx) => (
        <G key={`grid-${idx}`}>
          <Line
            x1={CHART_PADDING.left}
            y1={line.y}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y2={line.y}
            stroke={Colors.gray[200]}
            strokeWidth={1}
            strokeDasharray={idx === 0 ? undefined : "4,4"}
          />
          <SvgText
            x={CHART_PADDING.left - 8}
            y={line.y + 4}
            fontSize={10}
            fill={Colors.gray[400]}
            textAnchor="end"
          >
            {line.label}
          </SvgText>
        </G>
      ))}

      {/* X축 라벨 */}
      {displayResults.map((result, idx) => {
        const date = new Date(result.timestamp);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        return (
          <SvgText
            key={`label-${idx}`}
            x={getX(idx)}
            y={CHART_HEIGHT - 10}
            fontSize={10}
            fill={Colors.gray[400]}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        );
      })}

      {/* 데이터 라인 */}
      {fieldsToShow.map((field) => {
        const info = careerFieldInfo[field];
        const points = displayResults.map((result, idx) => ({
          x: getX(idx),
          y: getY(result.scores[field]),
          score: result.scores[field],
        }));

        const pathD = points
          .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
          .join(' ');

        return (
          <G key={field}>
            <Path
              d={pathD}
              stroke={info.color}
              strokeWidth={2}
              fill="none"
            />
            {points.map((p, idx) => (
              <Circle
                key={`point-${idx}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={info.color}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </G>
        );
      })}
    </Svg>
  );
};

// 변화 분석 카드
const ChangeAnalysisCard = ({
  field,
  firstScore,
  lastScore,
  delay,
}: {
  field: CareerField;
  firstScore: number;
  lastScore: number;
  delay: number;
}) => {
  const info = careerFieldInfo[field];
  const change = lastScore - firstScore;
  const isImproved = change > 0;
  const isDeclined = change < 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.changeCard}
    >
      <View style={[styles.changeIcon, { backgroundColor: info.color + '20' }]}>
        <Text style={styles.changeEmoji}>{info.icon}</Text>
      </View>
      <View style={styles.changeContent}>
        <Text style={styles.changeLabel}>{info.label}</Text>
        <Text style={styles.changeScore}>
          {firstScore}점 → {lastScore}점
        </Text>
      </View>
      <View style={[
        styles.changeBadge,
        {
          backgroundColor: isImproved
            ? Colors.success + '20'
            : isDeclined
            ? Colors.error + '20'
            : Colors.gray[100],
        },
      ]}>
        <Text style={[
          styles.changeBadgeText,
          {
            color: isImproved
              ? Colors.success
              : isDeclined
              ? Colors.error
              : Colors.gray[500],
          },
        ]}>
          {isImproved ? '↑' : isDeclined ? '↓' : '→'} {Math.abs(change)}점
        </Text>
      </View>
    </Animated.View>
  );
};

export default function StatsScreen() {
  const router = useRouter();
  const { results, loadHistory } = useHistoryStore();
  const [selectedField, setSelectedField] = useState<CareerField | 'all'>('all');

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 통계 계산
  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const totalTests = results.length;
    const firstResult = results[results.length - 1];
    const lastResult = results[0];

    // 평균 점수 계산
    const averageScores: Record<CareerField, number> = {} as Record<CareerField, number>;
    careerFields.forEach((field) => {
      const sum = results.reduce((acc, r) => acc + r.scores[field], 0);
      averageScores[field] = Math.round(sum / totalTests);
    });

    // 가장 높은 평균 계열
    const topField = careerFields.reduce((a, b) =>
      averageScores[a] > averageScores[b] ? a : b
    );

    // 가장 많이 향상된 계열
    const improvements: { field: CareerField; change: number }[] = careerFields.map((field) => ({
      field,
      change: lastResult.scores[field] - firstResult.scores[field],
    }));
    const mostImproved = improvements.reduce((a, b) =>
      a.change > b.change ? a : b
    );

    return {
      totalTests,
      firstResult,
      lastResult,
      averageScores,
      topField,
      mostImproved,
      improvements,
    };
  }, [results]);

  if (results.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path
                d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                fill={Colors.gray[700]}
              />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>통계 분석</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>아직 검사 기록이 없어요</Text>
          <Text style={styles.emptySubtitle}>
            검사를 완료하면 통계를 확인할 수 있어요
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/assessment')}
          >
            <Text style={styles.emptyButtonText}>검사하러 가기</Text>
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
        <Text style={styles.headerTitle}>통계 분석</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 요약 카드 */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats?.totalTests}</Text>
              <Text style={styles.summaryLabel}>총 검사 횟수</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {careerFieldInfo[stats?.topField || 'humanities'].icon}
              </Text>
              <Text style={styles.summaryLabel}>강점 계열</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                +{Math.max(stats?.mostImproved.change || 0, 0)}
              </Text>
              <Text style={styles.summaryLabel}>최대 상승</Text>
            </View>
          </View>
        </Animated.View>

        {/* 인사이트 */}
        {stats && stats.totalTests >= 2 && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={styles.insightCard}
          >
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightText}>
              {stats.mostImproved.change > 0
                ? `${careerFieldInfo[stats.mostImproved.field].label} 계열이 ${stats.mostImproved.change}점 상승했어요! 꾸준히 관심을 가져보세요.`
                : stats.mostImproved.change < 0
                ? `최근 점수가 다소 하락했지만, 다양한 경험을 통해 새로운 가능성을 발견해보세요!`
                : `점수가 안정적으로 유지되고 있어요. 새로운 활동에 도전해보는 것도 좋아요!`}
            </Text>
          </Animated.View>
        )}

        {/* 추이 차트 */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>점수 변화 추이</Text>

          {/* 필드 선택 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fieldSelector}
          >
            <Pressable
              style={[
                styles.fieldButton,
                selectedField === 'all' && styles.fieldButtonActive,
              ]}
              onPress={() => setSelectedField('all')}
            >
              <Text
                style={[
                  styles.fieldButtonText,
                  selectedField === 'all' && styles.fieldButtonTextActive,
                ]}
              >
                전체
              </Text>
            </Pressable>
            {careerFields.map((field) => {
              const info = careerFieldInfo[field];
              return (
                <Pressable
                  key={field}
                  style={[
                    styles.fieldButton,
                    selectedField === field && [
                      styles.fieldButtonActive,
                      { backgroundColor: info.color },
                    ],
                  ]}
                  onPress={() => setSelectedField(field)}
                >
                  <Text
                    style={[
                      styles.fieldButtonText,
                      selectedField === field && styles.fieldButtonTextActive,
                    ]}
                  >
                    {info.icon} {info.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.chartContainer}>
            <TrendLineChart results={results} selectedField={selectedField} />
          </View>

          {/* 범례 */}
          {selectedField === 'all' && (
            <View style={styles.legend}>
              {careerFields.map((field) => {
                const info = careerFieldInfo[field];
                return (
                  <View key={field} style={styles.legendItem}>
                    <View
                      style={[styles.legendColor, { backgroundColor: info.color }]}
                    />
                    <Text style={styles.legendText}>{info.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* 계열별 변화 */}
        {stats && stats.totalTests >= 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계열별 변화</Text>
            <Text style={styles.sectionSubtitle}>
              첫 검사 대비 최근 검사 점수 변화
            </Text>
            {careerFields.map((field, idx) => (
              <ChangeAnalysisCard
                key={field}
                field={field}
                firstScore={stats.firstResult.scores[field]}
                lastScore={stats.lastResult.scores[field]}
                delay={300 + idx * 50}
              />
            ))}
          </View>
        )}

        {/* 평균 점수 */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>평균 점수</Text>
          <View style={styles.averageCard}>
            {careerFields.map((field) => {
              const info = careerFieldInfo[field];
              const avg = stats?.averageScores[field] || 0;
              return (
                <View key={field} style={styles.averageItem}>
                  <View style={styles.averageHeader}>
                    <Text style={styles.averageEmoji}>{info.icon}</Text>
                    <Text style={styles.averageLabel}>{info.label}</Text>
                    <Text style={[styles.averageScore, { color: info.color }]}>
                      {avg}점
                    </Text>
                  </View>
                  <View style={styles.averageBarBg}>
                    <View
                      style={[
                        styles.averageBarFill,
                        { width: `${avg}%`, backgroundColor: info.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  summaryCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...TextStyle.title1,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray[200],
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary.main + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightText: {
    ...TextStyle.body,
    color: Colors.primary.main,
    flex: 1,
    lineHeight: 22,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...TextStyle.headline,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  fieldSelector: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  fieldButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
  },
  fieldButtonActive: {
    backgroundColor: Colors.primary.main,
  },
  fieldButtonText: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  fieldButtonTextActive: {
    color: Colors.text.inverse,
  },
  chartContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    ...TextStyle.body,
    color: Colors.text.secondary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...TextStyle.caption2,
    color: Colors.text.secondary,
  },
  changeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  changeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  changeEmoji: {
    fontSize: 18,
  },
  changeContent: {
    flex: 1,
  },
  changeLabel: {
    ...TextStyle.callout,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  changeScore: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  changeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  changeBadgeText: {
    ...TextStyle.caption1,
    fontWeight: '700',
  },
  averageCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  averageItem: {
    marginBottom: Spacing.md,
  },
  averageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  averageEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  averageLabel: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
    flex: 1,
  },
  averageScore: {
    ...TextStyle.callout,
    fontWeight: '700',
  },
  averageBarBg: {
    height: 8,
    backgroundColor: Colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  averageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...TextStyle.title3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
});
