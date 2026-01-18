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
import Svg, { Circle, Path, Rect, Polygon, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../src/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
}

// 슬라이드별 일러스트레이션
const ExploreIllustration = () => (
  <Svg width={240} height={240} viewBox="0 0 240 240">
    <Defs>
      <SvgGradient id="planetGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#667eea" />
        <Stop offset="100%" stopColor="#764ba2" />
      </SvgGradient>
    </Defs>
    {/* 우주 배경 */}
    <Circle cx={40} cy={40} r={2} fill="white" opacity={0.6} />
    <Circle cx={200} cy={60} r={1.5} fill="white" opacity={0.8} />
    <Circle cx={180} cy={180} r={2} fill="white" opacity={0.5} />
    <Circle cx={60} cy={200} r={1} fill="white" opacity={0.7} />
    {/* 행성들 */}
    <Circle cx={120} cy={120} r={70} fill="url(#planetGrad1)" />
    <Circle cx={120} cy={120} r={55} fill="none" stroke="white" strokeWidth={1} opacity={0.3} />
    {/* 로켓 */}
    <G transform="translate(150, 70) rotate(45)">
      <Path d="M0,30 L10,0 L20,30 L10,25 Z" fill="#FF6B6B" />
      <Rect x={5} y={30} width={10} height={15} fill="#4ECDC4" />
      <Circle cx={10} cy={15} r={4} fill="white" />
    </G>
    {/* 별 */}
    <Polygon points="50,100 53,108 62,108 55,113 58,122 50,117 42,122 45,113 38,108 47,108" fill="#FFD700" />
  </Svg>
);

const GameIllustration = () => (
  <Svg width={240} height={240} viewBox="0 0 240 240">
    <Defs>
      <SvgGradient id="gameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4ECDC4" />
        <Stop offset="100%" stopColor="#44A08D" />
      </SvgGradient>
    </Defs>
    {/* 게임 컨트롤러 모양 */}
    <Rect x={40} y={80} width={160} height={100} rx={50} fill="url(#gameGrad)" />
    {/* 버튼들 */}
    <Circle cx={80} cy={120} r={15} fill="#FF6B6B" />
    <Circle cx={160} cy={120} r={15} fill="#FFE66D" />
    <Circle cx={160} cy={150} r={10} fill="#95E1D3" />
    <Circle cx={80} cy={150} r={10} fill="#DDA0DD" />
    {/* 캐릭터 표정 */}
    <Circle cx={120} cy={60} r={35} fill="#FFE5D9" />
    <Circle cx={110} cy={55} r={5} fill="#333" />
    <Circle cx={130} cy={55} r={5} fill="#333" />
    <Path d="M 108 70 Q 120 80 132 70" stroke="#E07A5F" strokeWidth={3} fill="none" />
    {/* 별 이펙트 */}
    <Polygon points="180,40 182,46 188,46 183,50 185,56 180,52 175,56 177,50 172,46 178,46" fill="#FFD700" />
    <Polygon points="50,60 52,66 58,66 53,70 55,76 50,72 45,76 47,70 42,66 48,66" fill="#FFD700" opacity={0.7} />
  </Svg>
);

const ResultIllustration = () => (
  <Svg width={240} height={240} viewBox="0 0 240 240">
    <Defs>
      <SvgGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#667eea" stopOpacity={0.8} />
        <Stop offset="100%" stopColor="#764ba2" stopOpacity={0.4} />
      </SvgGradient>
    </Defs>
    {/* 레이더 차트 배경 */}
    <Polygon points="120,40 180,80 180,160 120,200 60,160 60,80" fill="none" stroke={Colors.gray[200]} strokeWidth={1} />
    <Polygon points="120,60 165,90 165,150 120,180 75,150 75,90" fill="none" stroke={Colors.gray[200]} strokeWidth={1} />
    <Polygon points="120,80 150,100 150,140 120,160 90,140 90,100" fill="none" stroke={Colors.gray[200]} strokeWidth={1} />
    {/* 데이터 영역 */}
    <Polygon points="120,50 175,85 170,155 120,190 70,145 75,85" fill="url(#chartGrad)" />
    <Polygon points="120,50 175,85 170,155 120,190 70,145 75,85" fill="none" stroke="#667eea" strokeWidth={2} />
    {/* 포인트 */}
    <Circle cx={120} cy={50} r={6} fill="#9B59B6" />
    <Circle cx={175} cy={85} r={6} fill="#3498DB" />
    <Circle cx={170} cy={155} r={6} fill="#27AE60" />
    <Circle cx={120} cy={190} r={6} fill="#1ABC9C" />
    <Circle cx={70} cy={145} r={6} fill="#E74C3C" />
    <Circle cx={75} cy={85} r={6} fill="#F39C12" />
    {/* 라벨 */}
    <G>
      <Circle cx={120} cy={25} r={12} fill="#9B59B6" />
      <Circle cx={195} cy={80} r={12} fill="#3498DB" />
      <Circle cx={190} cy={165} r={12} fill="#27AE60" />
      <Circle cx={120} cy={215} r={12} fill="#1ABC9C" />
      <Circle cx={50} cy={165} r={12} fill="#E74C3C" />
      <Circle cx={55} cy={80} r={12} fill="#F39C12" />
    </G>
  </Svg>
);

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: '미래 행성을 탐험해요',
    subtitle: '6개의 진로 행성을 여행하며\n나에게 맞는 길을 발견해요',
    illustration: <ExploreIllustration />,
  },
  {
    id: '2',
    title: '게임처럼 즐겨요',
    subtitle: '재미있는 질문에 답하고\n멋진 배지를 모아보세요',
    illustration: <GameIllustration />,
  },
  {
    id: '3',
    title: '나만의 결과를 받아요',
    subtitle: '과학적 분석을 통해\n딱 맞는 진로를 추천받아요',
    illustration: <ResultIllustration />,
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

        {/* 슬라이드 */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  illustrationContainer: {
    width: 240,
    height: 240,
    marginBottom: Spacing.xxl,
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
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
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
