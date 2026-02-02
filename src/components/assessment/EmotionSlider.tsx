/**
 * 감정 슬라이더 컴포넌트
 * 드래그로 1~5점 응답을 자연스럽게 선택
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../constants';

import { useWindowDimensions } from 'react-native';

// ...

// 상수 제거: 컴포넌트 내부에서 계산
// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const SLIDER_WIDTH = SCREEN_WIDTH - 152;
const THUMB_SIZE = 32;
const TRACK_HEIGHT = 8;
const MAX_APP_WIDTH = 500; // 앱 최대 너비 제한에 맞춤

interface EmotionSliderProps {
  value: number; // 1~5
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

// ...

// Lottie 이모지 애니메이션
const LottieEmoji = ({ type }: { type: 'sad' | 'happy' }) => (
  <View style={styles.lottieContainer}>
    <LottieView
      source={
        type === 'sad'
          ? require('../../../assets/sad-emoji.json')
          : require('../../../assets/smiley-emoji.json')
      }
      autoPlay
      loop
      speed={1}
      style={styles.lottieEmoji}
      resizeMode="cover"
    />
  </View>
);

export const EmotionSlider: React.FC<EmotionSliderProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  // 앱 컨테이너 너비(최대 500)에 맞춰 슬라이더 너비 계산
  const SLIDER_WIDTH = Math.min(windowWidth, MAX_APP_WIDTH) - 152;

  // 슬라이더 위치 상태
  const translateX = useSharedValue(((value - 1) / 4) * SLIDER_WIDTH);

  // value prop이 변경될 때 슬라이더 위치 동기화
  useEffect(() => {
    const normalizedValue = (value - 1) / 4;
    translateX.value = withSpring(normalizedValue * SLIDER_WIDTH, {
      damping: 15,
      stiffness: 200,
    });
  }, [value]);

  const updateValue = useCallback((newNormalizedValue: number) => {
    // 0~1을 1~5로 변환하고 반올림
    const newValue = Math.round(newNormalizedValue * 4) + 1;
    const clampedValue = Math.max(1, Math.min(5, newValue));
    onValueChange(clampedValue);
  }, [onValueChange]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((event) => {
      const newX = Math.max(0, Math.min(SLIDER_WIDTH, event.x));
      translateX.value = newX;
      const newNormalizedValue = newX / SLIDER_WIDTH;
      runOnJS(updateValue)(newNormalizedValue);
    })
    .onEnd(() => {
      // 스냅: 가장 가까운 정수 값으로
      const snappedNormalized = Math.round(translateX.value / SLIDER_WIDTH * 4) / 4;
      translateX.value = withSpring(snappedNormalized * SLIDER_WIDTH, {
        damping: 15,
        stiffness: 200,
      });
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - THUMB_SIZE / 2 }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: translateX.value,
  }));

  // 5단계 점 표시
  const renderDots = () => {
    return [0, 1, 2, 3, 4].map((i) => {
      const position = (i / 4) * SLIDER_WIDTH;
      const isActive = value >= i + 1;
      return (
        <Pressable
          key={i}
          style={[
            styles.dot,
            { left: position - 6 },
            isActive && styles.dotActive,
          ]}
          onPress={() => !disabled && onValueChange(i + 1)}
        />
      );
    });
  };

  // 라벨 텍스트
  const getLabel = (val: number) => {
    switch (val) {
      case 1: return '전혀 아니야';
      case 2: return '아닌 것 같아';
      case 3: return '보통이야';
      case 4: return '그런 것 같아';
      case 5: return '완전 그래!';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* 현재 값 라벨 */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{getLabel(value)}</Text>
      </View>

      {/* 슬라이더 영역 */}
      <View style={styles.sliderRow}>
        {/* 슬픈 이모지 */}
        <LottieEmoji type="sad" />

        {/* 슬라이더 트랙 */}
        <GestureDetector gesture={panGesture}>
          <View style={[styles.sliderWrapper, { width: SLIDER_WIDTH }]}>
            <View style={styles.track}>
              <Animated.View style={[styles.progress, progressStyle]} />
              {renderDots()}
            </View>
            <Animated.View style={[styles.thumb, thumbStyle]}>
              <View style={styles.thumbInner} />
            </Animated.View>
          </View>
        </GestureDetector>

        {/* 행복 이모지 */}
        <LottieEmoji type="happy" />
      </View>

      {/* 숫자 버튼 - 슬라이더와 정렬 */}
      <View style={styles.numbersRow}>
        {/* 왼쪽 이모지 너비만큼 여백 */}
        <View style={{ width: 44 }} />

        {/* 숫자 버튼들 */}
        <View style={[styles.numbersContainer, { width: SLIDER_WIDTH }]}>
          {[1, 2, 3, 4, 5].map((num, index) => {
            const position = (index / 4) * SLIDER_WIDTH;
            return (
              <Pressable
                key={num}
                style={[
                  styles.numberButton,
                  { left: position - 22 },
                  value === num && styles.numberButtonActive,
                ]}
                onPress={() => !disabled && onValueChange(num)}
              >
                <Text
                  style={[
                    styles.numberText,
                    value === num && styles.numberTextActive,
                  ]}
                >
                  {num}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 오른쪽 이모지 너비만큼 여백 */}
        <View style={{ width: 44 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  labelContainer: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.main + '15',
    borderRadius: BorderRadius.full,
  },
  label: {
    ...TextStyle.headline,
    color: Colors.primary.main,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  sliderWrapper: {
    height: 50,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    backgroundColor: Colors.gray[200],
    borderRadius: TRACK_HEIGHT / 2,
    position: 'relative',
  },
  progress: {
    height: TRACK_HEIGHT,
    backgroundColor: Colors.primary.main,
    borderRadius: TRACK_HEIGHT / 2,
  },
  dot: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.gray[300],
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  dotActive: {
    backgroundColor: Colors.primary.main,
  },
  thumb: {
    position: 'absolute',
    top: -12,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.background.primary,
    ...Shadow.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInner: {
    width: THUMB_SIZE - 8,
    height: THUMB_SIZE - 8,
    borderRadius: (THUMB_SIZE - 8) / 2,
    backgroundColor: Colors.primary.main,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  numbersContainer: {
    height: 50,
    position: 'relative',
  },
  numberButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonActive: {
    backgroundColor: Colors.primary.main,
  },
  numberText: {
    ...TextStyle.headline,
    color: Colors.text.secondary,
  },
  numberTextActive: {
    color: Colors.text.inverse,
  },
  lottieContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieEmoji: {
    width: 44,
    height: 44,
  },
});

export default EmotionSlider;
