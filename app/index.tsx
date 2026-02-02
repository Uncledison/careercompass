import React, { useRef, useEffect } from 'react';
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
import { ModelViewer3D } from '../src/components/character/ModelViewer3D';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../src/constants';
import { useProfileStore } from '../src/stores/profileStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 3D 캐릭터 듀오 컴포넌트
const RandomPairCharacter = () => {
  const [pairIndex, setPairIndex] = React.useState(0);

  React.useEffect(() => {
    // 0 또는 1 랜덤 선택 (0: Set 1, 1: Set 2)
    setPairIndex(Math.floor(Math.random() * 2));
  }, []);

  const characters = pairIndex === 0
    ? ['Male_1', 'Female_1']
    : ['Male_2', 'Female_2'];

  return (
    <View style={styles.characterDuoContainer}>
      <View style={styles.characterWrapper}>
        <ModelViewer3D
          modelPath={`/models/characters/${characters[0]}.glb`}
          animations={['Wave']}
          width={140}
          height={180}
          autoRotate={false}
          cameraDistance="9.0m"
          cameraTarget="0m 1.0m 0m"
          disableControls={true}
        />
      </View>
      <View style={styles.characterWrapper}>
        <ModelViewer3D
          modelPath={`/models/characters/${characters[1]}.glb`}
          animations={['Wave']}
          width={140}
          height={180}
          autoRotate={false}
          cameraDistance="9.0m"
          cameraTarget="0m 1.0m 0m"
          disableControls={true}
        />
      </View>
    </View>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile, loadProfile } = useProfileStore();

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile?.isOnboarded) {
      router.replace('/(tabs)');
    }
  }, [profile]);

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
            <RandomPairCharacter />
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
    height: 180,
  },
  characterDuoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: -20, // 캐릭터들이 약간 겹치게
  },
  characterWrapper: {
    width: 140,
    height: 180,
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
