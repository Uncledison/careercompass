import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { InteractionHint } from '../../src/components/InteractionHint';
import { useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import { useAssessmentStore, SavedAssessmentState } from '../../src/stores/assessmentStore';
import { useProfileStore } from '../../src/stores/profileStore';
import { ModelViewer3D } from '../../src/components/character/ModelViewer3D';
import { SnowOverlay } from '../../src/components/SnowOverlay';
import { InfiniteMarquee } from '../../src/components/InfiniteMarquee';
import { Audio } from 'expo-av';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

// Grass Lottie dimensions (matches button width, auto-calculated height)
const GRASS_WIDTH = SCREEN_WIDTH - Spacing.md * 2;
const GRASS_HEIGHT = GRASS_WIDTH * (2000 / 2650); // Original ratio preserved



// 학년 선택 카드
interface GradeLevelCardProps {
  title: string;
  subtitle: string;
  emoji: string;
  colors: readonly [string, string, ...string[]];
  onPress: () => void;
}

const GradeLevelCard = ({ title, subtitle, emoji, colors, onPress }: GradeLevelCardProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.gradeLevelCard,
      pressed && styles.gradeLevelCardPressed,
    ]}
    onPress={onPress}
  >
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradeLevelCardGradient}
    >
      <Text style={styles.gradeLevelEmoji}>{emoji}</Text>
      <View>
        <Text style={styles.gradeLevelTitle}>{title}</Text>
        <Text style={styles.gradeLevelSubtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
  </Pressable>
);

// 퀵 액션 버튼
interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
}

const QuickAction = ({ icon, label, onPress }: QuickActionProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.quickAction,
      pressed && styles.quickActionPressed,
    ]}
    onPress={onPress}
  >
    <View style={styles.quickActionIcon}>
      <Text style={styles.quickActionEmoji}>{icon}</Text>
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </Pressable>
);

// 이론 배지 컴포넌트 - 반짝반짝 펄스 효과
const TheoryBadge = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 펄스 효과 (살짝 커졌다 작아짐)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // 글로우 효과 (밝기 변화)
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, []);

  const animatedStyle = {
    transform: [{ scale: pulseAnim }],
    opacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
    }),
  };

  return (
    <Animated.View style={[styles.theoryBadge, animatedStyle]}>
      <LinearGradient
        colors={[Colors.primary.main + '15', Colors.secondary.main + '15'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.theoryBadgeGradient}
      >
        <Text style={styles.theoryBadgeIcon}>🎓</Text>
        <View style={styles.theoryBadgeTextContainer}>
          <Text style={styles.theoryBadgeTitle}>과학적 검사 기반</Text>
          <Text style={styles.theoryBadgeSubtitle}>
            HOLLAND 직업흥미이론 · 다중지능이론 · 진로발달이론
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// 레벨 한글 변환
const getLevelLabel = (level: string): string => {
  switch (level) {
    case 'elementary_lower':
    case 'elementary_upper':
      return '초등학생';
    case 'middle':
      return '중학생';
    case 'high':
      return '고등학생';
    default:
      return '검사';
  }
};

// 레벨을 라우트 파라미터로 변환
const getLevelRoute = (level: string): string => {
  if (level.startsWith('elementary')) return 'elementary';
  return level;
};

export default function HomeScreen() {
  const router = useRouter();
  const [savedProgress, setSavedProgress] = useState<SavedAssessmentState | null>(null);
  const { loadSavedProgress, resumeAssessment, clearSavedProgress, resetAssessment } = useAssessmentStore();
  const { profile, loadProfile } = useProfileStore();
  // Sheep Animation State
  const [isInteractionLocked, setInteractionLocked] = useState(false);
  const sheepRef = useRef<LottieView>(null);

  // Preload sound
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Interaction Hints
  const [showCloudHint, setShowCloudHint] = useState(true);
  const [showSheepHint, setShowSheepHint] = useState(true);

  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/Sheep.mp3')
        );
        setSound(sound);
      } catch (error) {
        console.log('Error loading sound', error);
      }
    }
    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // 눈 내림 토글
  const handleSnowToggle = (e: any) => {
    e.stopPropagation();
    setShowCloudHint(false);
    setIsSnowing(prev => !prev);
  }

  const handleSheepPress = useCallback(async () => {
    if (isInteractionLocked) return;
    setShowSheepHint(false);

    setInteractionLocked(true);

    // Fallback: Auto-unlock after 1.5 seconds (Sheep-Jump.json is short)
    setTimeout(() => {
      setInteractionLocked(false);
    }, 1500);

    // Play sound immediately
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        // Ignore play errors
      }
    }
  }, [isInteractionLocked, sound]);

  const handleAnimationFinish = useCallback(() => {
    // interaction finished
    setInteractionLocked(false);
  }, []);
  const [isSnowing, setIsSnowing] = useState(false);

  // 저장된 진행 상태 확인 (화면 포커스 시마다)
  useFocusEffect(
    React.useCallback(() => {
      const checkSavedProgress = async () => {
        const saved = await loadSavedProgress();
        setSavedProgress(saved);
      };
      checkSavedProgress();
      loadProfile();
    }, [])
  );

  const handleStartAssessment = (level: string) => {
    router.push(`/assessment/${level}`);
  };

  // 이어하기
  const handleResumeAssessment = async () => {
    if (savedProgress) {
      resumeAssessment(savedProgress);
      router.push(`/assessment/${getLevelRoute(savedProgress.level)}`);
    }
  };

  // 저장된 진행 삭제
  const handleClearProgress = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('저장된 검사를 삭제하시겠습니까?')) {
        await clearSavedProgress();
        resetAssessment(); // 메모리 상의 진행 상태도 초기화
        setSavedProgress(null);
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert(
        '저장된 검사 삭제',
        '저장된 검사를 삭제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              await clearSavedProgress();
              resetAssessment(); // 메모리 상의 진행 상태도 초기화
              setSavedProgress(null);
            },
          },
        ]
      );
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
        <View style={styles.header}>
          <Pressable
            style={styles.headerLeft}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.greeting}>안녕하세요!</Text>
              <Text style={styles.userName}>{profile?.nickname || '탐험가'}님</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <View style={styles.smallCharacterContainer}>
              <ModelViewer3D
                modelPath={`/models/characters/${profile?.character || 'Female_1'}.gltf`}
                animations={['Run']}
                width={56}
                height={56}
                autoRotate={false}
                cameraDistance="8.0m"
                cameraTarget="0m 1.2m 0m"
                disableControls={true}
                backgroundColor={Colors.primary.main + '15'}
                borderRadius={28}
              />
              {/* 터치 이벤트 가로채기용 오버레이 */}
              <View style={StyleSheet.absoluteFill} />
            </View>
          </Pressable>
        </View>

        {/* 이어서 하기 카드 (저장된 진행 상태가 있을 때) */}
        {savedProgress && (
          <Pressable
            style={({ pressed }) => [
              styles.resumeCard,
              pressed && styles.resumeCardPressed,
            ]}
            onPress={handleResumeAssessment}
          >
            <LinearGradient
              colors={['#FF9500', '#FF6B00'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resumeCardGradient}
            >
              <View style={styles.resumeCardContent}>
                <View style={styles.resumeCardIcon}>
                  <Text style={styles.resumeCardEmoji}>▶️</Text>
                </View>
                <View style={styles.resumeCardText}>
                  <Text style={styles.resumeCardTitle}>이어서 하기</Text>
                  <Text style={styles.resumeCardSubtitle}>
                    {getLevelLabel(savedProgress.level)} · {savedProgress.currentQuestionIndex + 1}번 문항
                  </Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.resumeDeleteButton,
                  pressed && styles.resumeDeleteButtonPressed,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleClearProgress();
                }}
              >
                <Text style={styles.resumeDeleteText}>×</Text>
              </Pressable>
            </LinearGradient>
          </Pressable>
        )}

        {/* 메인 CTA 카드 */}
        <Pressable
          style={({ pressed }) => [
            styles.mainCard,
            pressed && styles.mainCardPressed,
          ]}
          onPress={() => router.push('/(tabs)/assessment')}
        >
          <LinearGradient
            colors={Colors.primary.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainCardGradient}
          >
            <View style={styles.mainCardContent}>
              <View style={styles.mainCardText}>
                <Text style={styles.mainCardTitle}>진로 탐험 시작하기</Text>
                <Text style={styles.mainCardSubtitle}>
                  나에게 맞는 미래를 발견해요
                </Text>
              </View>
              {/* <View style={styles.mainCharacterContainer}>
                캐릭터 삭제됨
              </View> */}


              {/* Snow Cloud Trigger */}
              <Pressable
                onPress={handleSnowToggle}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  width: 80,
                  height: 60,
                  zIndex: 50,
                }}
              >
                <LottieView
                  source={require('../../assets/lottie/cloud-snow.json')}
                  autoPlay
                  loop
                  style={{ width: '100%', height: '100%' }}
                />
                <InteractionHint
                  text="Snow ?"
                  visible={showCloudHint && !isSnowing}
                  delay={2000}
                  direction="right" // Cloud is on right, hint should be left? No, cloud is right, hint to the left of it?
                  // Actually `direction` determines pointer position. `right` means pointer is on the right (bubble on left).
                  style={{ position: 'absolute', top: 60, right: 75, width: 80 }}
                />
              </Pressable>
            </View>
            <View style={styles.mainCardBadge}>
              <Text style={styles.mainCardBadgeText}>약 15분 소요</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* 검사 기반 이론 안내 - 반짝반짝 효과 */}
        <TheoryBadge />

        {/* 학년별 검사 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>학년별 검사</Text>
          <View style={styles.gradeLevelCards}>
            <GradeLevelCard
              title="초등학생"
              subtitle="3-6학년 · 게임 모드"
              emoji="🎮"
              colors={['#4ECDC4', '#44A08D'] as const}
              onPress={() => handleStartAssessment('elementary')}
            />
            <GradeLevelCard
              title="중학생"
              subtitle="1-3학년 · 퀘스트 모드"
              emoji="🧭"
              colors={['#667eea', '#764ba2'] as const}
              onPress={() => handleStartAssessment('middle')}
            />
            <GradeLevelCard
              title="고등학생"
              subtitle="1-3학년 · 분석 모드"
              emoji="📊"
              colors={['#f857a6', '#ff5858'] as const}
              onPress={() => handleStartAssessment('high')}
            />
          </View>
        </View>



        {/* 6대 계열 소개 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6대 진로 계열</Text>
          <InfiniteMarquee speed={40}>
            {[
              { emoji: '📚', name: '인문', field: 'humanities', color: Colors.career.humanities.main },
              { emoji: '🌍', name: '사회', field: 'social', color: Colors.career.social.main },
              { emoji: '🔬', name: '자연', field: 'natural', color: Colors.career.natural.main },
              { emoji: '🤖', name: '공학', field: 'engineering', color: Colors.career.engineering.main },
              { emoji: '🏥', name: '의학', field: 'medicine', color: Colors.career.medicine.main },
              { emoji: '🎨', name: '예체능', field: 'arts', color: Colors.career.arts.main },
            ].map((item, index) => (
              <Pressable
                key={`${item.name}-${index}`}
                style={({ pressed }) => [
                  styles.careerFieldChip,
                  {
                    backgroundColor: item.color + '20',
                    marginRight: 12, // Add explicit margin for spacing in marquee
                  },
                  pressed && styles.careerFieldChipPressed,
                ]}
                onPress={() => router.push(`/career/${item.field}`)}
              >
                <Text style={styles.careerFieldEmoji}>{item.emoji}</Text>
                <Text style={[styles.careerFieldName, { color: item.color }]}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </InfiniteMarquee>
        </View>

        {/* Sheep Animation Container */}
        {/* Bottom Landscape with Grass and Sheep */}
        <View
          style={styles.bottomLandscape}
        >
          <LottieView
            source={require('../../assets/lottie/Grass.json')}
            style={styles.grassLottie}
            autoPlay
            loop
            resizeMode="cover"
          />
          <Pressable
            onPress={handleSheepPress}
            style={styles.sheepOnGrass}
            disabled={isInteractionLocked}
          >
            <LottieView
              source={isInteractionLocked
                ? require('../../assets/lottie/Sheep-Jump.json')
                : require('../../assets/lottie/SheepIdle.json')}
              style={styles.sheepLottie}
              loop={!isInteractionLocked}
              autoPlay={true}
              onAnimationFinish={isInteractionLocked ? handleAnimationFinish : undefined}
            />
            <InteractionHint
              text="Jump ?"
              visible={showSheepHint && !isInteractionLocked}
              delay={3000} // Shear appears a bit later
              direction="bottom" // Pointer on bottom, bubble above sheep
              style={{ position: 'absolute', top: -35, left: 15, width: 80 }}
            />
          </Pressable>
        </View>

      </ScrollView>

      {isSnowing && <SnowOverlay />}
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
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  headerLeft: {
    gap: 2,
    marginLeft: 24, // Indent to match section headers
  },
  greeting: {
    ...TextStyle.subhead,
    color: Colors.text.secondary,
    // marginBottom removed (row layout)
  },
  userName: {
    ...TextStyle.title2,
    color: Colors.text.primary,
  },
  mainCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadow.lg,
  },
  mainCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  mainCardGradient: {
    padding: Spacing.lg,
  },
  mainCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainCardText: {
    flex: 1,
  },
  mainCardTitle: {
    ...TextStyle.title2,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  mainCardSubtitle: {
    ...TextStyle.callout,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  mainCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardEmoji: {
    fontSize: 28,
  },
  mainCardBadge: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  mainCardBadgeText: {
    ...TextStyle.caption1,
    color: Colors.text.inverse,
  },
  theoryBadge: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  theoryBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  theoryBadgeIcon: {
    fontSize: 28,
  },
  theoryBadgeTextContainer: {
    flex: 1,
  },
  theoryBadgeTitle: {
    ...TextStyle.subhead,
    fontWeight: '600',
    color: Colors.primary.main,
    marginBottom: 2,
  },
  theoryBadgeSubtitle: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...TextStyle.headline,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    marginLeft: 24, // Indent past rounded corners (approx 24px)
  },
  gradeLevelCards: {
    gap: Spacing.sm,
  },
  gradeLevelCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.md,
  },
  gradeLevelCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  gradeLevelCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  gradeLevelEmoji: {
    fontSize: 32,
  },
  gradeLevelTitle: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
  gradeLevelSubtitle: {
    ...TextStyle.caption1,
    color: Colors.text.inverse,
    opacity: 0.8,
  },
  historyScore: {
    ...TextStyle.footnote,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  // Game Card Styles
  gameCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  gameCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  gameIcon: {
    fontSize: 24,
  },
  gameTextContainer: {
    flex: 1,
  },
  gameTitle: {
    ...TextStyle.title3,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  gameDescription: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  arrowIcon: {
    ...TextStyle.title2,
    color: Colors.gray[400],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  // Bottom Landscape Styles
  bottomLandscape: {
    width: GRASS_WIDTH,
    height: GRASS_HEIGHT,
    marginTop: Spacing.xl,
    alignSelf: 'center',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  grassLottie: {
    width: GRASS_WIDTH,
    height: GRASS_HEIGHT,
  },
  sheepOnGrass: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  sheepContainerOnGrass: {
    marginBottom: 5,
    zIndex: 10,
  },
  sheepLottie: {
    width: 100,
    height: 100,
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 32,
  },
  quickAction: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickActionPressed: {
    opacity: 0.7,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  careerFieldsScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  careerFieldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  careerFieldChipPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  careerFieldEmoji: {
    fontSize: 16,
  },
  careerFieldName: {
    ...TextStyle.footnote,
    fontWeight: '600',
  },
  // 이어서 하기 카드
  resumeCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  resumeCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  resumeCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  resumeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  resumeCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeCardEmoji: {
    fontSize: 20,
  },
  resumeCardText: {
    flex: 1,
  },
  resumeCardTitle: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
    marginBottom: 2,
  },
  resumeCardSubtitle: {
    ...TextStyle.caption1,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  resumeDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeDeleteButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  resumeDeleteText: {
    fontSize: 20,
    color: Colors.text.inverse,
    fontWeight: '300',
    lineHeight: 22,
  },
  // Lottie 캐릭터 스타일
  smallCharacterContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: Colors.primary.main + '15',
  },
  smallCharacterLottie: {
    width: 56,
    height: 56,
  },
  mainCharacterContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mainCharacterLottie: {
    width: 100,
    height: 100,
  },
});
