/**
 * 캐릭터 컴포넌트
 * 스테이지별 이모지 캐릭터 표시 (추후 이미지로 교체 가능)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

// 초등학교 스테이지별 캐릭터 매핑
export const ELEMENTARY_CHARACTERS: Record<number, { name: string; emoji: string }> = {
  1: { name: 'Chick', emoji: '🐥' },
  2: { name: 'Cat', emoji: '🐱' },
  3: { name: 'Dog', emoji: '🐕' },
  4: { name: 'Pig', emoji: '🐷' },
  5: { name: 'Sheep', emoji: '🐑' },
};

// 중학교 스테이지별 캐릭터 (해적 테마)
export const MIDDLE_CHARACTERS: Record<number, { name: string; emoji: string }> = {
  1: { name: 'Pirate1', emoji: '🏴‍☠️' },
  2: { name: 'Pirate2', emoji: '⚓' },
  3: { name: 'Shark', emoji: '🦈' },
  4: { name: 'Skull', emoji: '💀' },
  5: { name: 'Treasure', emoji: '🗝️' },
};

// 고등학교 스테이지별 캐릭터 (좀비 테마)
export const HIGH_CHARACTERS: Record<number, { name: string; emoji: string }> = {
  1: { name: 'Zombie1', emoji: '🧟' },
  2: { name: 'Zombie2', emoji: '🧟‍♂️' },
  3: { name: 'Dog', emoji: '🐕' },
  4: { name: 'Survivor', emoji: '🏃' },
  5: { name: 'Hero', emoji: '🦸' },
};

interface CharacterDisplayProps {
  stage: number;
  level: 'elementary' | 'middle' | 'high';
  size?: number;
}

export const Character3D: React.FC<CharacterDisplayProps> = ({
  stage,
  level,
  size = 120,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 바운스 애니메이션
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // 좌우 흔들림 애니메이션
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    bounceAnimation.start();
    rotateAnimation.start();

    return () => {
      bounceAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  const getCharacter = () => {
    switch (level) {
      case 'elementary':
        return ELEMENTARY_CHARACTERS[stage] || ELEMENTARY_CHARACTERS[1];
      case 'middle':
        return MIDDLE_CHARACTERS[stage] || MIDDLE_CHARACTERS[1];
      case 'high':
        return HIGH_CHARACTERS[stage] || HIGH_CHARACTERS[1];
      default:
        return ELEMENTARY_CHARACTERS[1];
    }
  };

  const character = getCharacter();

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.emojiContainer,
          {
            transform: [
              { translateY: bounceAnim },
              { rotate: rotate },
            ],
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: size * 0.6 }]}>
          {character.emoji}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});

export default Character3D;
