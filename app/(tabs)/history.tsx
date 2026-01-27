/**
 * 검사 히스토리 화면
 * 저장된 검사 결과 목록 표시
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import {
  useHistoryStore,
  SavedResult,
  formatResultTitle,
} from '../../src/stores/historyStore';
import { CareerField } from '../../src/types';

// 플랫폼별 확인 다이얼로그
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    // 네이티브에서는 Alert 사용
    const { Alert } = require('react-native');
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      { text: '확인', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

// 계열 정보
const careerFieldInfo: Record<CareerField, { label: string; icon: string; color: string }> = {
  humanities: { label: '인문', icon: '📚', color: Colors.career.humanities.main },
  social: { label: '사회', icon: '🌍', color: Colors.career.social.main },
  natural: { label: '자연', icon: '🔬', color: Colors.career.natural.main },
  engineering: { label: '공학', icon: '🤖', color: Colors.career.engineering.main },
  medicine: { label: '의학', icon: '🏥', color: Colors.career.medicine.main },
  arts: { label: '예체능', icon: '🎨', color: Colors.career.arts.main },
};

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

// 결과 카드 컴포넌트 (새로운 디자인)
const ResultCard = ({
  item,
  index,
  onPress,
  onDelete,
}: {
  item: SavedResult;
  index: number;
  onPress: () => void;
  onDelete: (id: string) => void;
}) => {
  const careerInfo = careerFieldInfo[item.topCareer];
  const typeName = typeNames[item.topCareer];
  const keywords = typeKeywords[item.topCareer];

  const handleDelete = (e: any) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    showConfirm('기록 삭제', '이 검사 기록을 삭제할까요?', () => {
      onDelete(item.id);
    });
  };

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(400)}
        style={[styles.card, { borderLeftColor: careerInfo.color }]}
      >
        {/* 상단: 유형명 + 점수 */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: careerInfo.color + '20' }]}>
            <Text style={styles.icon}>{careerInfo.icon}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTypeName, { color: careerInfo.color }]}>
              {typeName}
            </Text>
            <View style={styles.cardScoreRow}>
              <Text style={styles.cardScore}>{item.topScore}점</Text>
              <Text style={styles.cardDate}>{formatResultTitle(item)}</Text>
            </View>
          </View>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            hitSlop={8}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"
                fill={Colors.gray[400]}
              />
            </Svg>
          </Pressable>
        </View>

        {/* 키워드 */}
        <View style={styles.keywordsRow}>
          {keywords.map((keyword, idx) => (
            <View key={idx} style={[styles.keywordChip, { backgroundColor: careerInfo.color + '15' }]}>
              <Text style={[styles.keywordText, { color: careerInfo.color }]}>#{keyword}</Text>
            </View>
          ))}
        </View>

        {/* 간단한 점수 바 */}
        <View style={styles.scoresContainer}>
          {(Object.keys(item.scores) as CareerField[]).map((field) => {
            const info = careerFieldInfo[field];
            const score = item.scores[field];
            return (
              <View key={field} style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>{info.icon}</Text>
                <View style={styles.scoreBarBg}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      {
                        width: `${score}%`,
                        backgroundColor: info.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.scoreValue}>{score}</Text>
              </View>
            );
          })}
        </View>

        {/* 클릭 힌트 */}
        <View style={styles.viewHint}>
          <Text style={styles.viewHintText}>탭하여 상세 보기</Text>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
              fill={Colors.gray[400]}
            />
          </Svg>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default function HistoryScreen() {
  const router = useRouter();
  const { results, isLoading, loadHistory, deleteResult, clearHistory } = useHistoryStore();



  // 마운트/포커스 시 히스토리 로드
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  // 새로고침
  const handleRefresh = useCallback(() => {
    loadHistory();
  }, [loadHistory]);

  // 결과 상세 보기
  const handleViewResult = useCallback((item: SavedResult) => {
    router.push(`/result/${item.id}`);
  }, [router]);

  // 삭제
  const handleDelete = useCallback((id: string) => {
    deleteResult(id);
  }, [deleteResult]);

  // 전체 삭제
  const handleClearAll = useCallback(() => {
    showConfirm('전체 삭제', '모든 검사 기록을 삭제할까요?\n이 작업은 되돌릴 수 없습니다.', () => {
      clearHistory();
    });
  }, [clearHistory]);

  // 빈 상태
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📋</Text>
      <Text style={styles.emptyTitle}>아직 검사 기록이 없어요</Text>
      <Text style={styles.emptySubtitle}>
        첫 번째 진로 검사를 시작해보세요!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>검사 기록</Text>
        {results.length > 0 && (
          <Pressable
            onPress={handleClearAll}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.clearButtonPressed,
            ]}
          >
            <Text style={styles.clearButtonText}>전체 삭제</Text>
          </Pressable>
        )}
      </View>

      {/* 결과 개수 */}
      {results.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            총 {results.length}개의 검사 기록
          </Text>
        </View>
      )}

      {/* 리스트 */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ResultCard
            item={item}
            index={index}
            onPress={() => handleViewResult(item)}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          results.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.main}
          />
        }
      />
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
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...TextStyle.title2,
    marginLeft: 24,
    color: Colors.text.primary,
  },
  clearButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearButtonPressed: {
    opacity: 0.7,
  },
  clearButtonText: {
    ...TextStyle.callout,
    color: Colors.semantic.error,
  },
  countContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  countText: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
    marginLeft: 24,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  listContentEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  icon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardTypeName: {
    ...TextStyle.headline,
    fontWeight: '700',
  },
  cardScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  cardScore: {
    ...TextStyle.callout,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cardDate: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  cardTitle: {
    ...TextStyle.headline,
    color: Colors.text.primary,
  },
  cardSubtitle: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  keywordChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  keywordText: {
    ...TextStyle.caption2,
    fontWeight: '600',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  deleteButtonPressed: {
    opacity: 0.5,
  },
  scoresContainer: {
    gap: Spacing.xs,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scoreLabel: {
    fontSize: 14,
    width: 24,
    textAlign: 'center',
  },
  scoreBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreValue: {
    ...TextStyle.caption2,
    color: Colors.text.secondary,
    width: 28,
    textAlign: 'right',
  },
  viewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  viewHintText: {
    ...TextStyle.caption2,
    color: Colors.gray[400],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
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
  },
});
