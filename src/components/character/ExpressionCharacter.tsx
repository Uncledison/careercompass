/**
 * 표정이 변하는 캐릭터 컴포넌트
 * value (0~1)에 따라 슬픔 → 보통 → 기쁨 표정 변화
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Path,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { Colors } from '../../constants';

interface ExpressionCharacterProps {
  value: number; // 0 (슬픔) ~ 0.5 (보통) ~ 1 (기쁨)
  size?: number;
}

export const ExpressionCharacter: React.FC<ExpressionCharacterProps> = ({
  value,
  size = 180,
}) => {
  // 표정 계산
  const expression = useMemo(() => {
    // 입 모양 계산
    const getMouthPath = () => {
      const baseY = 130;
      if (value < 0.3) {
        // 슬픈 표정 (아래로 휜 입)
        const curve = 130 + (0.3 - value) * 30;
        return `M 70 ${baseY} Q 100 ${curve} 130 ${baseY}`;
      } else if (value > 0.7) {
        // 기쁜 표정 (활짝 웃는 입)
        const curve = 145 + (value - 0.7) * 20;
        return `M 70 125 Q 100 ${curve} 130 125`;
      }
      // 보통 표정
      const curve = 135 + (value - 0.5) * 15;
      return `M 75 130 Q 100 ${curve} 125 130`;
    };

    // 눈 모양 (기쁠수록 눈웃음)
    const isHappyEyes = value > 0.8;

    // 볼터치 강도
    const blushOpacity = 0.3 + value * 0.5;

    // 입 채우기 (활짝 웃을 때만)
    const mouthFill = value > 0.7 ? Colors.character.mouth : 'none';

    return {
      mouthPath: getMouthPath(),
      isHappyEyes,
      blushOpacity,
      mouthFill,
    };
  }, [value]);

  const scale = size / 200;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="bgGradChar" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.primary.main} />
            <Stop offset="100%" stopColor={Colors.secondary.main} />
          </LinearGradient>
          <LinearGradient id="faceGradChar" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={Colors.character.skin.light} />
            <Stop offset="100%" stopColor={Colors.character.skin.medium} />
          </LinearGradient>
        </Defs>

        {/* 배경 원 */}
        <Circle cx={100} cy={100} r={95} fill="url(#bgGradChar)" />

        {/* 얼굴 */}
        <Circle cx={100} cy={105} r={60} fill="url(#faceGradChar)" />

        {/* 머리카락 */}
        <Ellipse cx={100} cy={60} rx={50} ry={30} fill={Colors.character.hair.brown} />
        <Ellipse cx={65} cy={75} rx={15} ry={20} fill={Colors.character.hair.brown} />
        <Ellipse cx={135} cy={75} rx={15} ry={20} fill={Colors.character.hair.brown} />

        {/* 눈 */}
        <G>
          {expression.isHappyEyes ? (
            // 눈웃음 (반달 모양)
            <>
              <Path
                d="M 63 100 Q 75 92 87 100"
                stroke={Colors.character.hair.black}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M 113 100 Q 125 92 137 100"
                stroke={Colors.character.hair.black}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            </>
          ) : (
            // 일반 눈
            <>
              <Ellipse cx={75} cy={100} rx={12} ry={14} fill="white" />
              <Ellipse cx={125} cy={100} rx={12} ry={14} fill="white" />
              <Circle cx={77} cy={102} r={7} fill={Colors.character.hair.black} />
              <Circle cx={127} cy={102} r={7} fill={Colors.character.hair.black} />
              {/* 눈 하이라이트 */}
              <Circle cx={80} cy={98} r={3} fill="white" />
              <Circle cx={130} cy={98} r={3} fill="white" />
            </>
          )}
        </G>

        {/* 볼터치 */}
        <Ellipse
          cx={55}
          cy={120}
          rx={10}
          ry={6}
          fill={Colors.character.blush}
          opacity={expression.blushOpacity}
        />
        <Ellipse
          cx={145}
          cy={120}
          rx={10}
          ry={6}
          fill={Colors.character.blush}
          opacity={expression.blushOpacity}
        />

        {/* 입 */}
        <Path
          d={expression.mouthPath}
          stroke={Colors.character.mouth}
          strokeWidth={3}
          fill={expression.mouthFill}
          strokeLinecap="round"
        />

        {/* 기쁠 때 반짝이 효과 */}
        {value > 0.8 && (
          <>
            <Path
              d="M170,35 L172,42 L179,42 L173,46 L175,53 L170,49 L165,53 L167,46 L161,42 L168,42 Z"
              fill="#FFD700"
            />
            <Path
              d="M30,45 L32,50 L37,50 L33,53 L34,58 L30,55 L26,58 L27,53 L23,50 L28,50 Z"
              fill="#FFD700"
              opacity={0.7}
            />
          </>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ExpressionCharacter;
