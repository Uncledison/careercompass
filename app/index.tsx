import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Path,
  Ellipse,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../src/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 메인 캐릭터 컴포넌트
const MainCharacter = () => (
  <Svg width={200} height={200} viewBox="0 0 200 200">
    <Defs>
      <SvgLinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={Colors.primary.main} />
        <Stop offset="100%" stopColor={Colors.secondary.main} />
      </SvgLinearGradient>
      <SvgLinearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={Colors.character.skin.light} />
        <Stop offset="100%" stopColor={Colors.character.skin.medium} />
      </SvgLinearGradient>
    </Defs>

    {/* 배경 원 */}
    <Circle cx={100} cy={100} r={95} fill="url(#bgGrad)" />

    {/* 얼굴 */}
    <Circle cx={100} cy={105} r={60} fill="url(#faceGrad)" />

    {/* 머리카락 */}
    <Ellipse cx={100} cy={60} rx={50} ry={30} fill={Colors.character.hair.brown} />
    <Ellipse cx={65} cy={75} rx={15} ry={20} fill={Colors.character.hair.brown} />
    <Ellipse cx={135} cy={75} rx={15} ry={20} fill={Colors.character.hair.brown} />

    {/* 눈 */}
    <G>
      <Ellipse cx={75} cy={100} rx={12} ry={14} fill="white" />
      <Ellipse cx={125} cy={100} rx={12} ry={14} fill="white" />
      <Circle cx={77} cy={102} r={7} fill={Colors.character.hair.black} />
      <Circle cx={127} cy={102} r={7} fill={Colors.character.hair.black} />
      <Circle cx={80} cy={98} r={3} fill="white" />
      <Circle cx={130} cy={98} r={3} fill="white" />
    </G>

    {/* 볼터치 */}
    <Ellipse cx={55} cy={120} rx={10} ry={6} fill={Colors.character.blush} opacity={0.6} />
    <Ellipse cx={145} cy={120} rx={10} ry={6} fill={Colors.character.blush} opacity={0.6} />

    {/* 입 (미소) */}
    <Path
      d="M 85 130 Q 100 145 115 130"
      stroke={Colors.character.mouth}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
    />

    {/* 별 장식 */}
    <Path
      d="M170,30 L173,40 L183,40 L175,47 L178,57 L170,50 L162,57 L165,47 L157,40 L167,40 Z"
      fill="#FFD700"
    />
  </Svg>
);

export default function WelcomeScreen() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/onboarding');
  };

  return (
    <LinearGradient
      colors={[Colors.background.primary, Colors.background.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* 로고 영역 */}
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>Career</Text>
            <Text style={styles.logoTextAccent}>Compass</Text>
          </View>

          {/* 캐릭터 */}
          <View style={styles.characterSection}>
            <MainCharacter />
          </View>

          {/* 설명 텍스트 */}
          <View style={styles.textSection}>
            <Text style={styles.title}>나만의 미래를 발견해요</Text>
            <Text style={styles.subtitle}>
              재미있는 질문에 답하면서{'\n'}
              나에게 딱 맞는 진로를 찾아보세요
            </Text>
          </View>

          {/* CTA 버튼 */}
          <View style={styles.buttonSection}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
              onPress={handleStart}
            >
              <LinearGradient
                colors={Colors.primary.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>시작하기</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.secondaryButtonText}>이미 계정이 있어요</Text>
            </Pressable>
          </View>
        </View>

        {/* 하단 정보 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            만 14세 미만은 보호자 동의가 필요합니다
          </Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xl,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  logoTextAccent: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary.main,
    letterSpacing: -1,
  },
  characterSection: {
    marginBottom: Spacing.xl,
    ...Shadow.xl,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    ...TextStyle.title1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonSection: {
    width: '100%',
    maxWidth: 320,
    gap: Spacing.md,
  },
  primaryButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadow.md,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...TextStyle.headline,
    color: Colors.text.inverse,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    ...TextStyle.callout,
    color: Colors.primary.main,
  },
  footer: {
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...TextStyle.caption1,
    color: Colors.text.tertiary,
  },
});
