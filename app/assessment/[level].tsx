/**
 * 검사 화면 (학령별 동적 라우트)
 * /assessment/elementary, /assessment/middle, /assessment/high
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  BackHandler,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import { GradeLevel, ResponseValue } from '../../src/types';
import { useAssessmentStore, useStageInfo } from '../../src/stores/assessmentStore';
import { ExpressionCharacter } from '../../src/components/character/ExpressionCharacter';
import { Character3D } from '../../src/components/character/Character3D';
import { ModelViewer3D } from '../../src/components/character/ModelViewer3D';
import { EmotionSlider } from '../../src/components/assessment/EmotionSlider';

// GLB 모델 경로 (웹 배포용)
const MODEL_PATHS: Record<string, Record<number, { path: string; animations: string[]; cameraDistance?: string }>> = {
  elementary: {
    1: { path: '/models/chick.glb', animations: ['Idle_Peck', 'Run'], cameraDistance: '2.5m' },
    2: { path: '/models/cat.glb', animations: ['Idle', 'Walk'], cameraDistance: '5.0m' },
    3: { path: '/models/dog.glb', animations: ['Idle', 'Walk'], cameraDistance: '6.0m' },
    4: { path: '/models/pig.glb', animations: ['Idle', 'Walk'], cameraDistance: '6.0m' },
    5: { path: '/models/sheep.glb', animations: ['Idle', 'Walk'], cameraDistance: '6.0m' },
  },
  middle: {
    1: { path: '/models/Ninja.glb', animations: ['Walk.009'], cameraDistance: '8.5m' },
    2: { path: '/models/Orc.glb', animations: ['Walk.009'], cameraDistance: '8.0m' },
    3: { path: '/models/Bunny.glb', animations: ['Walk.009'], cameraDistance: '8.0m' },
    4: { path: '/models/Yeti_High.glb', animations: ['Walk.009'], cameraDistance: '7.0m' },
    5: { path: '/models/Demon.glb', animations: ['Walk.009'], cameraDistance: '7.0m' },
  },
  high: {
    1: { path: '/models/Wizard.glb', animations: ['Walk.004'], cameraDistance: '10.0m' },
    2: { path: '/models/Yeti_Middle.glb', animations: ['Walk.004'], cameraDistance: '8.5m' },
    3: { path: '/models/Goblin.glb', animations: ['Walk.004'], cameraDistance: '9.0m' },
    4: { path: '/models/Giant.glb', animations: ['Walk.004'], cameraDistance: '10.0m' },
    5: { path: '/models/Zombie.glb', animations: ['Walk.004'], cameraDistance: '6.5m' },
  },
};
import { getStagesByLevel } from '../../src/data/questions';

import { useWindowDimensions } from 'react-native';

const MAX_APP_WIDTH = 500;

// ...

// 질문 텍스트 폰트 크기 계산 (2줄에 맞추기)
const getQuestionFontSize = (text: string, screenWidth: number): number => {
  const safeWidth = Math.min(screenWidth, MAX_APP_WIDTH); // 최대 너비 제한 적용
  const maxWidth = safeWidth - 80; // 양쪽 패딩 고려
  const baseFontSize = 22;
  const minFontSize = 16;

  // 한 줄당 대략적인 글자 수 계산 (한글 기준)
  const charsPerLine = Math.floor(maxWidth / (baseFontSize * 0.6));
  const maxChars = charsPerLine * 2; // 2줄 기준

  if (text.length <= maxChars) {
    return baseFontSize;
  }

  // 글자 수에 비례하여 폰트 크기 축소
  const ratio = maxChars / text.length;
  const calculatedSize = Math.floor(baseFontSize * Math.sqrt(ratio));

  return Math.max(minFontSize, calculatedSize);
};

// 스테이지 완료 모달
interface StageCompleteModalProps {
  visible: boolean;
  stageName: string;
  badgeIcon: string;
  badgeName: string;
  stageColor: string;
  level: string;
  character: string;
  currentStage: number;
  onContinue: () => void;
  isMuted?: boolean;
}

// 학령별 축하 애니메이션 설정
const CELEBRATION_ANIMATIONS: Record<string, string[]> = {
  elementary: ['Run'],
  middle: ['Attack'],
  high: ['Wave'],
};

// 학령별 축하 메시지
const CELEBRATION_MESSAGES: Record<string, string[]> = {
  elementary: ['대단해요! 🌟', '최고예요! 👏', '멋져요! 💪', '잘했어요! 🎉', '훌륭해요! ⭐'],
  middle: ['멋진 실력이에요! 💥', '정말 잘했어요! 🔥', '대단한 집중력! 👊', '최고의 도전자! ⚡', '파워풀해요! 💪'],
  high: ['훌륭한 성과예요! 🎓', '깊이 있는 탐색! 📚', '미래가 기대돼요! 🌟', '놀라운 성장! 🚀', '완벽해요! ✨'],
};

const StageCompleteModal = ({
  visible,
  stageName,
  badgeIcon,
  badgeName,
  stageColor,
  level,
  character,
  currentStage,
  onContinue,
  isMuted = false,
}: StageCompleteModalProps) => {
  const lottieRef = useRef<LottieView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 축하 메시지 (스테이지별로 다른 메시지)
  const celebrationMessage = useMemo(() => {
    const messages = CELEBRATION_MESSAGES[level] || CELEBRATION_MESSAGES.elementary;
    return messages[(currentStage - 1) % messages.length];
  }, [level, currentStage]);

  // 캐릭터 애니메이션 (학령별)
  const celebrationAnimation = useMemo(() => {
    return CELEBRATION_ANIMATIONS[level] || CELEBRATION_ANIMATIONS.elementary;
  }, [level]);

  // 학령별 카메라 설정
  const cameraConfig = useMemo(() => {
    if (level === 'elementary') {
      // 거리 설정: 1단계(병아리)는 2단계 더 크게(2.5m -> 1.5m), 나머지는 1단계 더 크게(약 80% 거리)
      let distance = 'auto';
      if (currentStage === 1) {
        distance = '1.5m'; // 병아리 아주 크게
      } else {
        // 기존 대비 약간 줌인 (기본값들이 5~6m이므로 4~5m 정도로)
        distance = '4.5m';
      }

      // 초등: 오른쪽 측면 뷰 (270deg), 캐릭터를 원의 중앙으로
      return {
        orbit: '270deg 75deg auto',
        target: '0m 1.5m 0m',
        distance: distance
      };
    }
    // 중등/고등: 정면, 캐릭터를 원의 중앙으로
    return {
      orbit: '0deg 75deg auto',
      target: '0m 1.8m 0m',
      distance: null // 기본값 사용
    };
  }, [level, currentStage]);

  // 현재 스테이지의 모델 경로 가져오기
  const modelConfig = useMemo(() => {
    const levelModels = MODEL_PATHS[level];
    if (levelModels && levelModels[currentStage]) {
      return levelModels[currentStage];
    }
    return null;
  }, [level, currentStage]);

  // 사운드 재생
  useEffect(() => {
    if (visible && !isMuted) {
      const playSound = async () => {
        try {
          let soundSource;
          switch (currentStage) {
            case 1: soundSource = require('../../assets/sounds/fanfare-01.mp3'); break;
            case 2: soundSource = require('../../assets/sounds/fanfare-02.mp3'); break;
            case 3: soundSource = require('../../assets/sounds/fanfare-03.mp3'); break;
            case 4: soundSource = require('../../assets/sounds/fanfare-04.mp3'); break;
            case 5: soundSource = require('../../assets/sounds/fanfare-05.mp3'); break;
            default: return; // 스테이지 범위 벗어나면 사운드 재생 안 함
          }

          const { sound } = await Audio.Sound.createAsync(soundSource);
          soundRef.current = sound;
          await sound.setVolumeAsync(0.6);
          await sound.playAsync();
        } catch (error) {
          console.log('Sound play error:', error);
          // 에러 발생 시 조용히 무시 (비프음 재생하지 않음)
        }
      };
      playSound();
      // Note: Lottie 애니메이션은 autoPlay로 자동 시작됨
    }

    return () => {
      // 사운드 정리
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [visible, isMuted]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.modalOverlay}
    >
      {/* 하단 폭죽 효과 (랜덤) */}
      <LottieView
        source={[
          require('../../assets/lottie/Fireworks-01.json'),
          require('../../assets/lottie/Fireworks-02.json'),
          require('../../assets/lottie/Fireworks-03.json'),
          require('../../assets/lottie/Fireworks-04.json'),
          require('../../assets/lottie/Fireworks-05.json'),
        ][Math.floor(Math.random() * 5)]}
        style={{
          position: 'absolute',
          width: SCREEN_WIDTH,
          height: 400,
          bottom: 0,
          zIndex: 0,
        }}
        autoPlay
        loop={false}
        speed={1.0}
        resizeMode="cover"
      />

      <Animated.View
        entering={FadeIn.delay(200).duration(300)}
        style={styles.modalContent}
      >
        {/* 캐릭터 축하 반응 */}
        <View style={[styles.celebrationCharacterContainer, { backgroundColor: stageColor + '20' }]}>
          {modelConfig ? (
            <ModelViewer3D
              modelPath={modelConfig.path}
              animations={celebrationAnimation}
              cameraDistance={cameraConfig.distance || modelConfig.cameraDistance || '8m'}
              cameraOrbit={cameraConfig.orbit}
              cameraTarget={cameraConfig.target}
              width={140}
              height={140}
              autoRotate={false}
              borderRadius={70}
              backgroundColor="transparent"
            />
          ) : (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeIcon}>{badgeIcon}</Text>
            </View>
          )}
        </View>

        {/* 축하 메시지 - 하나로 통합 */}
        <Text style={styles.modalTitle}>{celebrationMessage}</Text>
        <Text style={styles.modalSubtitle}>
          {stageName}을 완료하고{'\n'}
          <Text style={{ color: stageColor, fontWeight: '700' }}>{badgeName}</Text> 배지를 획득했어요!
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.modalButton,
            pressed && styles.modalButtonPressed,
          ]}
          onPress={onContinue}
        >
          <LinearGradient
            colors={[stageColor, stageColor + 'DD'] as const}
            style={styles.modalButtonGradient}
          >
            <Text style={styles.modalButtonText}>다음 행성으로!</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// 프로그레스 바
const ProgressBar = ({
  current,
  total,
  stageColor,
}: {
  current: number;
  total: number;
  stageColor: string;
}) => {
  const progress = current / total;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: stageColor,
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {current} / {total}
      </Text>
    </View>
  );
};

export default function AssessmentScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const SAFE_WIDTH = Math.min(windowWidth, MAX_APP_WIDTH);
  const { level } = useLocalSearchParams<{ level: string }>();
  const router = useRouter();

  // ... (existing hooks)

  // ...

  // 감정값으로 변환 (1~5 -> 0~1)
  const emotionValue = (currentValue - 1) / 4;

  // 반응형 캐릭터 높이 계산 (화면 높이의 35%, 최대 280)
  const characterHeight = Math.min(280, windowHeight * 0.35);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[stageInfo.color + '10', Colors.background.primary] as const}
        style={[styles.background, { height: windowHeight * 0.4 }]}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* ... (Header) */}

        {/* ... (ProgressBar: update props if needed, but it works) */}

        {/* ... */}

        {/* 메인 콘텐츠 - 스크롤 가능한 레이아웃으로 변경하여 화면 크기 대응 */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* 3D 캐릭터 영역 */}
          <View style={[styles.characterSection, { height: characterHeight }]}>
            <Animated.View
              key={`char-${currentStage}`}
              entering={FadeIn.duration(300)}
              style={styles.characterContainer}
            >
              {/* 모든 단계에서 GLB 모델 사용 가능하도록 수정 */}
              {MODEL_PATHS[level || 'elementary'] && MODEL_PATHS[level || 'elementary'][currentStage] ? (
                <ModelViewer3D
                  modelPath={MODEL_PATHS[level || 'elementary'][currentStage].path}
                  animations={MODEL_PATHS[level || 'elementary'][currentStage].animations}
                  cameraDistance={MODEL_PATHS[level || 'elementary'][currentStage].cameraDistance}
                  width={300} // width doesn't strictly matter for layout as it's centered, but height does
                  height={characterHeight}
                  autoRotate={true}
                  borderRadius={16}
                />
              ) : (
                <Character3D
                  stage={currentStage}
                  level={level as 'elementary' | 'middle' | 'high'}
                  size={Math.min(150, characterHeight * 0.6)} // Scale fallback char too
                />
              )}
            </Animated.View>
          </View>

          {/* 질문 영역 (세로 중앙) */}
          <View style={styles.questionSection}>
            <Animated.View
              key={`q-${question.id}`}
              entering={SlideInRight.duration(300)}
              style={styles.questionContainer}
            >
              <Text
                style={[
                  styles.questionText,
                  {
                    fontSize: getQuestionFontSize(question.contentKid || question.content, windowWidth),
                    // @ts-ignore: React Native Web support for semantic breaks
                    wordBreak: 'keep-all',
                    wordWrap: 'break-word'
                  }
                ]}
                numberOfLines={4}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {question.contentKid || question.content}
              </Text>
            </Animated.View>
          </View>

          {/* ... (Slider Section) */}
          {/* ... */}
        </ScrollView>

        {/* ... (Footer) */}

      </SafeAreaView>

      {/* 스테이지 완료 모달 */}
      <StageCompleteModal
        visible={showStageModal}
        stageName={stageInfo.title}
        badgeIcon={stageInfo.badge.icon}
        badgeName={stageInfo.badge.name}
        stageColor={stageInfo.color}
        level={level || 'elementary'}
        character={String(currentStage)}
        currentStage={currentStage}
        onContinue={handleStageContinue}
        isMuted={isMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  // ... (rest of styles)
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  stageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stageText: {
    ...TextStyle.subhead,
    color: Colors.text.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  characterSection: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionSection: {
    minHeight: 80,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  questionContainer: {
    paddingHorizontal: Spacing.sm,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 32,
  },
  sliderSection: {
    justifyContent: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Platform.OS === 'web' ? 60 : Spacing.lg,
    gap: Spacing.md,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  prevButtonPressed: {
    opacity: 0.7,
  },
  prevButtonText: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
  },
  nextButton: {
    flex: 1,
    maxWidth: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadow.md,
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  nextButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
  // 모달 스타일
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 440,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.xxl,
  },
  badgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  badgeIcon: {
    fontSize: 48,
  },
  modalTitle: {
    ...TextStyle.title1,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  modalButton: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  modalButtonPressed: {
    opacity: 0.9,
  },
  modalButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
  // 축하 애니메이션 스타일
  confettiAnimation: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 0,
  },
  celebrationCharacterContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  celebrationMessage: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
});
