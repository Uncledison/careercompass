import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../src/constants';

import { ModelViewer3D } from '../src/components/character/ModelViewer3D';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: '게임처럼 즐겨요',
    subtitle: '재미있는 질문에 답하고\n멋진 배지를 모아보세요',
    illustration: (
      <ModelViewer3D
        modelPath="/models/chick.glb"
        animations={['Idle_Peck']}
        width={200}
        height={200}
        autoRotate={true}
        cameraDistance="3.0m"
        disableControls={true}
        backgroundColor="transparent"
      />
    ),
  },
  {
    id: '2',
    title: '진로 퀘스트를 떠나요',
    subtitle: '6개의 진로 행성을 여행하며\n나만의 길을 찾아보세요',
    illustration: (
      <ModelViewer3D
        modelPath="/models/Ninja.glb"
        animations={['Run']}
        width={200}
        height={200}
        autoRotate={true}
        cameraDistance="6.0m"
        disableControls={true}
        backgroundColor="transparent"
      />
    ),
  },
  {
    id: '3',
    title: '나의 미래를 분석해요',
    subtitle: '과학적 분석을 통해\n딱 맞는 진로를 추천받아요',
    illustration: (
      <ModelViewer3D
        modelPath="/models/Wizard.glb"
        animations={['Idle']}
        width={200}
        height={200}
        autoRotate={true}
        cameraDistance="7.0m"
        disableControls={true}
        backgroundColor="transparent"
      />
    ),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      // scrollToOffset이 웹에서 더 안정적으로 작동
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * SCREEN_WIDTH,
        animated: true
      });
      setCurrentIndex(nextIndex);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationContainer}>
        {item.illustration}
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  );

  const renderDot = (index: number) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [1, 1.3, 1],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          {
            transform: [{ scale }],
            opacity,
            backgroundColor: Colors.primary.main,
          },
        ]}
      />
    );
  };

  return (
    <LinearGradient
      colors={[Colors.background.primary, Colors.background.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* 스킵 버튼 */}
        <View style={styles.header}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>건너뛰기</Text>
          </Pressable>
        </View>

        {/* 슬라이드 - flex: 1로 제한된 공간 사용 */}
        <View style={styles.slideContainer}>
          <Animated.FlatList
            ref={flatListRef}
            data={slides}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentIndex(index);
            }}
            scrollEventThrottle={16}
          />
        </View>

        {/* 하단 영역 */}
        <View style={styles.footer}>
          {/* 페이지 인디케이터 */}
          <View style={styles.pagination}>
            {slides.map((_, index) => renderDot(index))}
          </View>

          {/* 다음 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}
            onPress={handleNext}
          >
            <LinearGradient
              colors={Colors.primary.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === slides.length - 1 ? '시작하기' : '다음'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  skipText: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  illustrationContainer: {
    width: 240,
    height: 240,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  slideTitle: {
    ...TextStyle.title1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideSubtitle: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadow.md,
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  nextButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
});
