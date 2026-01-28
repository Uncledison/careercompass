import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Animated,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../src/constants';
import { useProfileStore } from '../src/stores/profileStore';

import { ModelViewer3D } from '../src/components/character/ModelViewer3D';
import { SchoolType, GradeNumber, getSchoolTypeLabel } from '../src/stores/profileStore';

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
  {
    id: 'setup',
    title: '프로필 설정',
    subtitle: '함께 여행할 친구와\n닉네임을 알려주세요',
    illustration: null,
  },
];

const CHARACTERS = ['Female_1', 'Female_2', 'Male_1', 'Male_2'];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { saveProfile, profile } = useProfileStore();
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [selectedChar, setSelectedChar] = useState(profile?.character || 'Female_1');
  const [schoolType, setSchoolType] = useState<SchoolType>(profile?.schoolType || 'elementary');
  const [grade, setGrade] = useState<GradeNumber>(profile?.grade || 5);

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * SCREEN_WIDTH,
        animated: true
      });
      setCurrentIndex(nextIndex);
    } else {
      // 마지막 단계에서 프로필 저장
      try {
        await saveProfile({
          nickname: nickname.trim() || '탐험가',
          character: selectedChar,
          schoolType: schoolType,
          grade: grade,
        });
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Failed to save profile during onboarding:', error);
        router.replace('/(tabs)');
      }
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    if (item.id === 'setup') {
      return (
        <View style={styles.slide}>
          <ScrollView
            style={styles.setupScroll}
            contentContainerStyle={styles.setupContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.setupHeader}>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>

            {/* 닉네임 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>닉네임</Text>
              <TextInput
                style={styles.input}
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChangeText={setNickname}
                maxLength={10}
              />
            </View>

            {/* 학교/학년 선택 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>학교 및 학년</Text>
              <View style={styles.schoolRow}>
                {(['elementary', 'middle', 'high'] as SchoolType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.schoolButton,
                      schoolType === type && styles.schoolButtonSelected
                    ]}
                    onPress={() => {
                      setSchoolType(type);
                      if (type !== 'elementary' && grade > 3) setGrade(3 as GradeNumber);
                    }}
                  >
                    <Text style={[
                      styles.schoolButtonText,
                      schoolType === type && styles.schoolButtonTextSelected
                    ]}>
                      {getSchoolTypeLabel(type).replace('학교', '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.gradeRow}>
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  if (schoolType !== 'elementary' && num > 3) return null;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.gradeButton,
                        grade === num && styles.gradeButtonSelected
                      ]}
                      onPress={() => setGrade(num as GradeNumber)}
                    >
                      <Text style={[
                        styles.gradeButtonText,
                        grade === num && styles.gradeButtonTextSelected
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <Text style={styles.gradeUnitText}>학년</Text>
              </View>
            </View>

            {/* 캐릭터 선택 */}
            <View style={styles.charGroup}>
              <Text style={styles.inputLabel}>캐릭터 선택</Text>
              <View style={styles.charGrid}>
                {CHARACTERS.map((char) => (
                  <TouchableOpacity
                    key={char}
                    activeOpacity={0.7}
                    style={[
                      styles.charItem,
                      selectedChar === char && styles.charItemSelected
                    ]}
                    onPress={() => setSelectedChar(char)}
                  >
                    <View style={{ pointerEvents: 'none' }}>
                      <ModelViewer3D
                        modelPath={`/models/characters/${char}.glb`}
                        animations={['Idle']}
                        width={70}
                        height={70}
                        autoRotate={false}
                        cameraDistance="12m"
                        cameraTarget="0m 1.2m 0m"
                        disableControls={true}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.slide}>
        <View style={styles.illustrationContainer}>
          {item.illustration}
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    );
  };

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
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
                { useNativeDriver: false } // 웹 지원을 위해 false로 설정 (또는 Native Driver 경고 방지)
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
      </KeyboardAvoidingView>
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
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
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
  setupContainer: {
    width: '100%',
    marginTop: Spacing.xl,
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    ...TextStyle.subhead,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...TextStyle.body,
    ...Shadow.sm,
  },
  charGroup: {
    gap: Spacing.sm,
  },
  charGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  charItem: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md * 2 - Spacing.sm * 3) / 4,
    height: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md * 2 - Spacing.sm * 3) / 4,
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  charItemSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '10',
  },
  setupScroll: {
    flex: 1,
    width: '100%',
  },
  setupContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  schoolRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  schoolButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: 'white',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  schoolButtonSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '10',
  },
  schoolButtonText: {
    ...TextStyle.subhead,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  schoolButtonTextSelected: {
    color: Colors.primary.main,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  gradeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  gradeButtonSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main,
  },
  gradeButtonText: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    fontWeight: '700',
  },
  gradeButtonTextSelected: {
    color: 'white',
  },
  gradeUnitText: {
    ...TextStyle.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
});
