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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 질문 텍스트 폰트 크기 계산 (2줄에 맞추기)
const getQuestionFontSize = (text: string): number => {
  const maxWidth = SCREEN_WIDTH - 80; // 양쪽 패딩 고려
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
    if (visible) {
      const playSound = async () => {
        try {
          let soundSource;
          switch (currentStage) {
            case 1: soundSource = require('../../assets/sounds/fanfare-01.mp3'); break;
            case 2: soundSource = require('../../assets/sounds/fanfare-02.mp3'); break;
            case 3: soundSource = require('../../assets/sounds/fanfare-03.mp3'); break;
            case 4: soundSource = require('../../assets/sounds/fanfare-04.mp3'); break;
            case 5: soundSource = require('../../assets/sounds/fanfare-05.mp3'); break;
            default: soundSource = require('../../assets/sounds/success.mp3');
          }

          const { sound } = await Audio.Sound.createAsync(soundSource);
          soundRef.current = sound;
          await sound.setVolumeAsync(0.6); // 볼륨 줄임
          await sound.playAsync();
        } catch (error) {
          console.log('Sound play error:', error);
          // 팡파레 파일이 없으면 success.mp3로 fallback
          try {
            const { sound } = await Audio.Sound.createAsync(require('../../assets/sounds/success.mp3'));
            soundRef.current = sound;
            await sound.playAsync();
          } catch (e) { }
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
  }, [visible]);

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
  const { level } = useLocalSearchParams<{ level: string }>();
  const router = useRouter();

  const {
    initAssessment,
    getCurrentQuestion,
    submitResponse,
    goToNextQuestion,
    goToPrevQuestion,
    getStageProgress,
    isStageComplete,
    completeStage,
    currentStage,
    totalStages,
    responses,
    isCompleted,
    scores,
    questionsPerStage,
    currentQuestionIndex,
    saveProgress,
    clearSavedProgress,
  } = useAssessmentStore();

  const [currentValue, setCurrentValue] = useState<ResponseValue>(3);
  const [showStageModal, setShowStageModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 현재 스테이지 정보 (레벨에 맞는 스테이지 데이터 사용)
  const stages = getStagesByLevel(level || 'elementary');
  const stageInfo = stages[currentStage - 1];
  const question = getCurrentQuestion();
  const progress = getStageProgress();

  // 현재 문항의 저장된 응답값 가져오기
  useEffect(() => {
    if (question) {
      const savedResponse = responses.find(r => r.questionId === question.id);
      setCurrentValue(savedResponse?.value || 3);
    }
  }, [question?.id, responses]);

  // 검사 초기화 (재개가 아닐 때만)
  useEffect(() => {
    // 이미 세션이 있으면 재개 상태이므로 초기화하지 않음
    const state = useAssessmentStore.getState();
    if (state.sessionId && state.questions.length > 0) {
      // 재개 상태 - 초기화 건너뛰기
      return;
    }

    let gradeLevel: GradeLevel = 'elementary_lower';
    if (level === 'middle') {
      gradeLevel = 'middle';
    } else if (level === 'high') {
      gradeLevel = 'high';
    }
    initAssessment(gradeLevel);
  }, [level]);

  // 뒤로가기 방지
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        '검사 종료',
        '검사를 종료하시겠습니까?\n진행 내용이 저장되지 않습니다.',
        [
          { text: '계속하기', style: 'cancel' },
          {
            text: '종료',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // 검사 완료 시 결과 화면으로
  useEffect(() => {
    if (isCompleted && scores) {
      // 검사 완료 시 저장된 진행 상태 삭제
      clearSavedProgress();
      router.replace(`/result/${Date.now()}`);
    }
  }, [isCompleted, scores, clearSavedProgress]);

  // 다음 버튼 핸들러
  const handleNext = useCallback(() => {
    if (isTransitioning) return;

    // 현재 응답 저장
    submitResponse(currentValue);

    // 전체 문항 수 가져오기
    const totalQuestions = useAssessmentStore.getState().questions.length;
    const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

    // 스테이지 마지막 문항인지 확인
    const stageEndIndex = currentStage * questionsPerStage - 1;
    const isStageEnd = currentQuestionIndex === stageEndIndex;

    if (isLastQuestion || (isStageEnd && currentStage === totalStages)) {
      // 마지막 문항 → 최종 스테이지 완료 모달 표시 후 결과로
      setShowStageModal(true);
    } else if (isStageEnd) {
      // 스테이지 완료 모달 표시
      setShowStageModal(true);
    } else {
      // 다음 문항으로
      setIsTransitioning(true);
      setTimeout(() => {
        const advanced = goToNextQuestion();
        if (!advanced) {
          // 다음 문항이 없으면 검사 완료 처리
          setShowStageModal(true);
        }
        setIsTransitioning(false);
      }, 150);
    }
  }, [currentValue, currentStage, currentQuestionIndex, questionsPerStage, totalStages, isTransitioning]);

  // 스테이지 완료 후 계속
  const handleStageContinue = useCallback(() => {
    setShowStageModal(false);

    // completeStage 호출 후 store에서 최신 상태를 가져와서 확인
    completeStage();

    // 항상 다음 문항으로 이동 시도 (goToNextQuestion 내부에서 경계 체크)
    // completeStage에서 isCompleted가 설정되면 useEffect에서 결과 화면으로 이동
    goToNextQuestion();
  }, [completeStage, goToNextQuestion]);

  // 이전 버튼 핸들러
  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      goToPrevQuestion();
    }
  }, [currentQuestionIndex]);

  // 저장하고 종료
  const handleSaveAndClose = useCallback(async () => {
    // 현재 응답 저장
    submitResponse(currentValue);
    await saveProgress();
    router.back();
  }, [currentValue, saveProgress, submitResponse, router]);

  // 저장 없이 종료
  const handleCloseWithoutSave = useCallback(async () => {
    await clearSavedProgress();
    router.back();
  }, [clearSavedProgress, router]);

  // 닫기 버튼 핸들러
  const handleClose = useCallback(() => {
    if (Platform.OS === 'web') {
      // 웹에서는 3가지 옵션을 제공하기 어려우므로 저장 여부 확인
      const saveConfirm = window.confirm('검사 종료\n\n진행 상태를 저장하시겠습니까?\n\n확인: 저장하고 종료\n취소: 저장 안함');
      if (saveConfirm) {
        handleSaveAndClose();
      } else {
        const reallyQuit = window.confirm('정말 저장하지 않고 종료하시겠습니까?');
        if (reallyQuit) {
          handleCloseWithoutSave();
        }
      }
    } else {
      Alert.alert(
        '검사 종료',
        '검사를 종료하시겠습니까?',
        [
          { text: '계속하기', style: 'cancel' },
          {
            text: '저장하고 종료',
            onPress: handleSaveAndClose,
          },
          {
            text: '저장 안함',
            style: 'destructive',
            onPress: handleCloseWithoutSave,
          },
        ]
      );
    }
  }, [handleSaveAndClose, handleCloseWithoutSave]);

  if (!question || !stageInfo) {
    return (
      <View style={styles.loadingContainer}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  // 감정값으로 변환 (1~5 -> 0~1)
  const emotionValue = (currentValue - 1) / 4;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[stageInfo.color + '10', Colors.background.primary] as const}
        style={styles.background}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path
                d="M18 6L6 18M6 6L18 18"
                stroke={Colors.gray[500]}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>

          <View style={styles.stageIndicator}>
            <View style={[styles.stageDot, { backgroundColor: stageInfo.color }]} />
            <Text style={styles.stageText}>
              {stageInfo.title} · {stageInfo.subtitle}
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* 프로그레스 바 */}
        <ProgressBar
          current={progress.stageQuestionIndex}
          total={questionsPerStage}
          stageColor={stageInfo.color}
        />

        {/* 메인 콘텐츠 - 세로 중앙 정렬 레이아웃 */}
        <View style={styles.content}>
          {/* 3D 캐릭터 영역 */}
          <View style={styles.characterSection}>
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
                  width={300}
                  height={280}
                  autoRotate={true}
                  borderRadius={16}
                />
              ) : (
                <Character3D
                  stage={currentStage}
                  level={level as 'elementary' | 'middle' | 'high'}
                  size={150}
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
                  { fontSize: getQuestionFontSize(question.contentKid || question.content) }
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {question.contentKid || question.content}
              </Text>
            </Animated.View>
          </View>

          {/* 슬라이더 영역 */}
          <View style={styles.sliderSection}>
            <EmotionSlider
              value={currentValue}
              onValueChange={(val) => setCurrentValue(val as ResponseValue)}
            />
          </View>
        </View>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
          {currentQuestionIndex > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.prevButton,
                pressed && styles.prevButtonPressed,
              ]}
              onPress={handlePrev}
            >
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Path
                  d="M12 4L6 10L12 16"
                  stroke={Colors.gray[500]}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
              <Text style={styles.prevButtonText}>이전</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}
            onPress={handleNext}
          >
            <LinearGradient
              colors={[stageInfo.color, stageInfo.color + 'DD'] as const}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {progress.stageQuestionIndex === questionsPerStage ? '완료' : '다음'}
              </Text>
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Path
                  d="M8 4L14 10L8 16"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </LinearGradient>
          </Pressable>
        </View>
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
    height: SCREEN_HEIGHT * 0.4,
  },
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
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
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
    width: SCREEN_WIDTH - 60,
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
