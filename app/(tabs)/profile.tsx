/**
 * 프로필 화면
 * 사용자 정보 표시 및 편집
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import {
  useProfileStore,
  SchoolType,
  GradeNumber,
  getFullGradeLabel,
} from '../../src/stores/profileStore';
import { useHistoryStore, formatDate } from '../../src/stores/historyStore';
import { ModelViewer3D } from '../../src/components/character/ModelViewer3D';
import { SnowOverlay } from '../../src/components/SnowOverlay';
import { InteractionHint } from '../../src/components/InteractionHint';

import { useTheme } from '../../src/context/ThemeContext';

const CHARACTER_OPTIONS = [
  { id: 'Female_1', name: '캐릭터 1' },
  { id: 'Female_2', name: '캐릭터 2' },
  { id: 'Male_1', name: '캐릭터 3' },
  { id: 'Male_2', name: '캐릭터 4' },
];

const THEME_STORAGE_KEY = 'careercompass_theme';

// Lottie 색상 변경 헬퍼 (JSON 데이터 직접 수정)
const colorizeLottie = (json: any, hex: string) => {
  try {
    const data = JSON.parse(JSON.stringify(json));
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const traverse = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      // 'fl'은 채우기(Fill) 타입이며, 'c'는 색상 속성입니다.
      if (obj.ty === 'fl' && obj.c && Array.isArray(obj.c.k)) {
        // 단일 색상(k가 배열인 경우)만 처리
        if (typeof obj.c.k[0] === 'number') {
          obj.c.k = [r, g, b, 1];
        }
      }
      Object.keys(obj).forEach(key => traverse(obj[key]));
    };

    traverse(data);
    return data;
  } catch (e) {
    return json;
  }
};

const ProfileAvatar = ({ character }: { character: string }) => (
  <View style={profileAvatarStyles.container}>
    <ModelViewer3D
      modelPath={`/models/characters/${character}.glb`}
      animations={['Wave', 'Yes']}
      width={100}
      height={100}
      autoRotate={false}
      cameraDistance="9m"
      cameraTarget="0m 1.0m 0m"
      borderRadius={50}
    />
  </View>
);

const profileAvatarStyles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: Colors.primary.main + '15',
  },
  lottie: {
    width: 80,
    height: 80,
  },
});

interface MenuItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  colors?: any;
}

const MenuItem = ({ icon, label, value, onPress, danger, colors, isSpecial }: MenuItemProps & { isSpecial?: boolean }) => {
  const [rainbowAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (isSpecial) {
      Animated.loop(
        Animated.timing(rainbowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        })
      ).start();
    }
  }, [isSpecial]);

  const rainbowColor = rainbowAnim.interpolate({
    inputRange: [0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1],
    outputRange: [
      '#FF0000', '#FF7F00', '#D4AF37', '#008000', '#0000FF', '#4B0082', '#9400D3', '#FF0000'
    ]
  });

  // Use Gold for Yellow for better visibility on white

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { borderBottomColor: colors?.gray[200] || Colors.gray[200] },
        pressed && { backgroundColor: colors?.background.secondary || Colors.gray[50] },
      ]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuItemIcon}>{icon}</Text>
        {isSpecial ? (
          <Animated.Text style={[
            styles.menuItemLabel,
            { color: rainbowColor, fontWeight: '800' }
          ]}>
            {label}
          </Animated.Text>
        ) : (
          <Text style={[
            styles.menuItemLabel,
            { color: colors?.text.primary || Colors.text.primary },
            danger && styles.menuItemLabelDanger
          ]}>
            {label}
          </Text>
        )}
      </View>
      {value ? (
        <Text style={[styles.menuItemValue, { color: colors?.text.secondary }]}>{value}</Text>
      ) : (
        <Text style={[styles.menuItemArrow, { color: colors?.gray[400] }]}>›</Text>
      )}
    </Pressable>
  );
};

// 학교 선택 버튼
const SchoolTypeButton = ({
  type,
  label,
  selected,
  onPress,
}: {
  type: SchoolType;
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.schoolTypeButton, selected && styles.schoolTypeButtonSelected]}
    onPress={onPress}
  >
    <Text style={[styles.schoolTypeButtonText, selected && styles.schoolTypeButtonTextSelected]}>
      {label}
    </Text>
  </Pressable>
);

// 학년 선택 버튼
const GradeButton = ({
  grade,
  selected,
  onPress,
  maxGrade,
}: {
  grade: GradeNumber;
  selected: boolean;
  onPress: () => void;
  maxGrade: number;
}) => {
  if (grade > maxGrade) return null;

  return (
    <Pressable
      style={[styles.gradeButton, selected && styles.gradeButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.gradeButtonText, selected && styles.gradeButtonTextSelected]}>
        {grade}학년
      </Text>
    </Pressable>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loadProfile, updateProfile, clearProfile, incrementHeartCount, resetHeartCount } = useProfileStore();
  const { results, loadHistory } = useHistoryStore();
  const { colors, isDarkMode } = useTheme();

  // Heart Interaction State
  const [isHeartPopping, setIsHeartPopping] = useState(false);
  const [showBravo, setShowBravo] = useState(false); // Bravo! 메시지 상태
  const bravoOpacity = useRef(new Animated.Value(0)).current;
  const bravoScale = useRef(new Animated.Value(0.5)).current;
  const heartAnimationRef = useRef<LottieView>(null);
  const lastHeartPressRef = useRef<number>(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Share Feature State
  const [showShareModal, setShowShareModal] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Snow Effect State
  const [isSnowing, setIsSnowing] = useState(false);
  const darkBgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(darkBgOpacity, {
      toValue: isSnowing ? 1 : 0,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [isSnowing]);

  const [editNickname, setEditNickname] = useState('');
  const [editSchoolType, setEditSchoolType] = useState<SchoolType>('elementary');
  const [editGrade, setEditGrade] = useState<GradeNumber>(5);
  const [editCharacter, setEditCharacter] = useState('Female_1');



  // Interaction Hints
  const [showCloudHint, setShowCloudHint] = useState(true);

  // 눈 내림 토글
  const handleSnowToggle = () => {
    setShowCloudHint(false); // Dismiss hint on first interact
    setIsSnowing(!isSnowing);
  };
  useEffect(() => {
    loadProfile();
    loadHistory();
  }, [loadProfile, loadHistory]);

  // 편집 모달 열기
  const openEditModal = () => {
    if (profile) {
      setEditNickname(profile.nickname);
      setEditSchoolType(profile.schoolType);
      setEditGrade(profile.grade);
      setEditCharacter(profile.character || 'Female_1');
    }
    setShowEditModal(true);
  };

  // 프로필 저장
  const handleSave = async () => {
    await updateProfile({
      nickname: editNickname.trim() || '탐험가',
      schoolType: editSchoolType,
      grade: editGrade,
      character: editCharacter,
    });
    setShowEditModal(false);
  };

  // 데이터 초기화
  const handleReset = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('데이터 초기화\n\n모든 데이터를 초기화하시겠습니까?\n프로필과 검사 기록이 모두 삭제됩니다.')) {
        clearProfile();
      }
    } else {
      Alert.alert(
        '데이터 초기화',
        '모든 데이터를 초기화하시겠습니까?\n프로필과 검사 기록이 모두 삭제됩니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '초기화', style: 'destructive', onPress: clearProfile }
        ]
      );
    }
  };

  // 학교 타입별 최대 학년
  const getMaxGrade = (type: SchoolType): number => {
    switch (type) {
      case 'elementary': return 6;
      case 'middle': return 3;
      case 'high': return 3;
      default: return 6;
    }
  };

  // HSL to Hex 변환 헬퍼
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // 하트 색상 가져오기
  const getHeartColor = (count: number) => {
    // 1000회 미만: 기존 단계별 색상
    if (count < 300) return '#FF7E9D';   // Soft Pink
    if (count < 600) return '#FF2B55';   // Apple Red
    if (count < 1000) return '#A10E25';  // Deep Ruby

    // 1000회 이상: 무한 'Living Ember' 스펙트럼 (붉은 계열 순환)
    // Hue 범위: -15(Deep Rose) ~ 45(Golden Orange)
    // 200 클릭마다 색상이 한 번 순환하여 생동감을 줌
    const phase = (count - 1000) * 0.05;
    const hueOscillation = Math.sin(phase); // -1 ~ 1

    // Map -1..1 to -15..45
    // 중심값 15, 진폭 30
    const hue = 15 + (hueOscillation * 30);

    // 음수 Hue 처리 (예: -10 -> 350)
    const normalizedHue = hue < 0 ? 360 + hue : hue;

    // Saturation 95% (선명함), Lightness 55% (너무 어둡지 않게)
    return hslToHex(normalizedHue, 95, 55);
  };

  const heartColor = getHeartColor(profile?.heartCount || 0);

  // Lottie 소스 데이터 (색상 적용) - 웹 호환성을 위해 직접 수정
  const heartIdleData = colorizeLottie(require('../../assets/lottie/HeartIdle.json'), heartColor);
  const heartPopData = colorizeLottie(require('../../assets/lottie/HeartPop.json'), heartColor);

  // 하트 애니메이션 리셋 및 재생 통합 함수
  const playHeartPop = () => {
    setIsHeartPopping(true);
    heartAnimationRef.current?.reset();
    heartAnimationRef.current?.play();
  };

  // Bravo! 애니메이션 재생
  const playBravoAnimation = () => {
    setShowBravo(true);
    bravoOpacity.setValue(0);
    bravoScale.setValue(0.5);

    Animated.parallel([
      Animated.timing(bravoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(bravoScale, {
        toValue: 1.2,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(bravoOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => setShowBravo(false));
      }, 1500);
    });
  };

  // 하트 클릭 핸들러
  const handleHeartPress = async () => {
    const now = Date.now();
    if (now - lastHeartPressRef.current < 50) return;
    lastHeartPressRef.current = now;

    // 1. 애니메이션 재생
    playHeartPop();

    // 2. 1000회 도달 이벤트 (서프라이즈)
    const currentCount = profile?.heartCount || 0;
    if (currentCount === 999) {
      // 1000회 도달 시 배경 다크 + 눈내리기 자동 실행
      if (!isSnowing) {
        setIsSnowing(true);
        Animated.timing(darkBgOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }).start();
      }
      playBravoAnimation();

      // 기분 좋은 햅틱 피드백
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    // 3. 랜덤 사운드 재생
    const soundFiles = [
      require('../../assets/sounds/pop-01.mp3'),
      require('../../assets/sounds/pop-02.mp3'),
      require('../../assets/sounds/pop-03.mp3'),
      require('../../assets/sounds/pop-04.mp3'),
      require('../../assets/sounds/pop-05.mp3'),
    ];
    const randomIdx = Math.floor(Math.random() * soundFiles.length);

    try {
      const { sound } = await Audio.Sound.createAsync(soundFiles[randomIdx]);
      await sound.playAsync();
      // 재생 완료 후 소스 해제
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }

    // 3. 스토어 업데이트
    incrementHeartCount();
  };

  // 캡처용 Ref for Web
  const captureViewRef = useRef<any>(null);

  // 포토카드 공유 함수
  const sharePhotoCard = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      if (Platform.OS === 'web') {
        // Web: html2canvas + Static Image Overlay
        const html2canvas = (await import('html2canvas')).default;
        const element = captureViewRef.current; // View -> HTMLElement in RNW

        if (!element) {
          Alert.alert('오류', '캡처할 영역을 찾을 수 없습니다.');
          return;
        }

        // 1. Capture Card Background & Text
        let canvas = await html2canvas(element as any, {
          backgroundColor: null,
          scale: 2, // High resolution
          logging: false,
          useCORS: true,
          allowTaint: true,
        });

        // 2. Overlay Character Image (Static PNG)
        // WebGL canvas can't be captured by html2canvas reliably, so we use a pre-rendered PNG.
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const characterImg = new window.Image();
          characterImg.crossOrigin = 'anonymous';

          const charId = profile?.character || 'Female_1';
          const characterBase = charId.replace('.glb', '').replace('.gltf', '');

          characterImg.src = `/character-screenshots/${characterBase}.png?t=${new Date().getTime()}`;

          await new Promise((resolve, reject) => {
            characterImg.onload = () => {
              const actualScale = canvas.width / (element as unknown as HTMLElement).offsetWidth;

              // 캔버스 중앙 기준으로 계산 (화면 좌표 대신)
              const canvasCenterX = canvas.width / 2;

              // 1. Calculate aspect ratio and fit to box
              const imgAspectRatio = characterImg.width / characterImg.height;

              // Define a safe box for the character in the top half of the card
              // Profile Card is 320x480. We want character in the top ~250px area.
              const maxBoxWidth = 260 * actualScale; // slightly less than 320 full width
              const maxBoxHeight = 280 * actualScale;

              let targetWidth = maxBoxWidth;
              let targetHeight = maxBoxWidth / imgAspectRatio;

              if (targetHeight > maxBoxHeight) {
                targetHeight = maxBoxHeight;
                targetWidth = maxBoxHeight * imgAspectRatio;
              }

              const x = canvasCenterX - (targetWidth / 2);
              // Position y: Place it below header. 
              // Header ~60px. Let's start at 70px * scale.
              const y = 70 * actualScale;

              // IMPORTANT: Reset transform to ensure drawing in consistent pixel coordinates
              // html2canvas might have applied transforms relative to the element
              ctx.setTransform(1, 0, 0, 1, 0, 0);

              console.log('--- Web Share Debug Info ---');
              console.log('Canvas Size:', canvas.width, 'x', canvas.height);
              console.log('Element Width:', (element as unknown as HTMLElement).offsetWidth);
              console.log('Actual Scale:', actualScale);
              console.log('Image Aspect Ratio:', imgAspectRatio);
              console.log('Target Size:', targetWidth, 'x', targetHeight);
              console.log('Calculated Position (x, y):', x, y);
              console.log('Canvas Center X:', canvasCenterX);
              console.log('----------------------------');

              ctx.drawImage(characterImg, x, y, targetWidth, targetHeight);

              // 2. Apply Rounded Corners (Clipping)
              const finalCanvas = document.createElement('canvas');
              finalCanvas.width = canvas.width;
              finalCanvas.height = canvas.height;
              const fctx = finalCanvas.getContext('2d');

              if (fctx) {
                const radius = 24 * actualScale;
                fctx.beginPath();
                fctx.roundRect(0, 0, finalCanvas.width, finalCanvas.height, radius);
                fctx.clip();
                fctx.drawImage(canvas, 0, 0);

                // Use finalCanvas for download
                canvas = finalCanvas as any;
              }

              resolve(null);
            };
            characterImg.onerror = () => {
              console.warn('Character image load failed.');
              resolve(null);
            };
          });
        }

        // 3. Download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `career-compass-card-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            Alert.alert('성공', '포토카드가 저장되었습니다! 📸');
          }
        });

      } else {
        // Native: react-native-view-shot
        if (viewShotRef.current?.capture) {
          const uri = await viewShotRef.current.capture();
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
          } else {
            Alert.alert('오류', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
          }
        }
      }
    } catch (error) {
      console.error('Snapshot failed', error);
      Alert.alert('오류', '이미지 생성 중 문제가 발생했습니다.');
    } finally {
      setIsSharing(false);
      setShowShareModal(false);
    }
  };

  // 학교 타입 변경 시 학년 조정
  const handleSchoolTypeChange = (type: SchoolType) => {
    setEditSchoolType(type);
    const maxGrade = getMaxGrade(type);
    if (editGrade > maxGrade) {
      setEditGrade(maxGrade as GradeNumber);
    }
  };

  // 통계 계산
  const testCount = results.length;
  const lastTest = results.length > 0 ? results[0] : null;
  const lastTestDate = lastTest ? formatDate(lastTest.timestamp).split(' ')[0] : '-';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      {/* Dark Gradient Overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: darkBgOpacity,
            zIndex: 0,
            pointerEvents: 'none',
          }
        ]}
      >
        <LinearGradient
          colors={['#1a1f35', '#0b0e17']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.headerTitle,
              {
                color: darkBgOpacity.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [colors.text.primary, colors.text.primary, '#ffffff']
                })
              }
            ]}
          >
            내 정보
          </Animated.Text>
          <Pressable
            onPress={handleSnowToggle}
            hitSlop={10}
            style={{
              position: 'absolute',
              right: -10,
              width: 95,
              height: 95,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <LottieView
              source={require('../../assets/lottie/cloud-blue-snow.json')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
              autoPlay
              loop
            />
            <InteractionHint
              text="Snow?"
              visible={showCloudHint && !isSnowing}
              delay={2000}
              direction="left"
              style={{ position: 'absolute', top: 35, right: 80, width: 60 }}
            />
          </Pressable>
        </View>

        {/* 프로필 카드 */}
        <View style={[styles.profileCard, { backgroundColor: colors.background.primary }]}>
          <ProfileAvatar character={profile?.character || 'Female_1'} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Pressable
                onLongPress={() => {
                  if (Platform.OS === 'web') {
                    if (window.confirm('하트 개수를 0으로 초기화할까요?')) {
                      resetHeartCount();
                    }
                  } else {
                    Alert.alert('하트 초기화', '하트 개수를 0으로 초기화할까요?', [
                      { text: '취소', style: 'cancel' },
                      { text: '초기화', onPress: () => resetHeartCount(), style: 'destructive' }
                    ]);
                  }
                }}
                delayLongPress={3000} // 3초간 길게 누르면 초기화
              >
                <Text style={[styles.profileName, { color: colors.text.primary }]}>{profile?.nickname || '탐험가'}</Text>
              </Pressable>

              {/* Interactive Heart */}
              <Pressable
                onPress={handleHeartPress}
                style={styles.heartContainer}
              >
                {/* Bravo! Message */}
                {showBravo && (
                  <Animated.View style={[
                    styles.bravoContainer,
                    { opacity: bravoOpacity, transform: [{ scale: bravoScale }, { translateY: -40 }] }
                  ]}>
                    <Text style={styles.bravoText}>Bravo! 🎉</Text>
                  </Animated.View>
                )}

                {/* Heart Count Badge */}
                {profile?.heartCount && profile.heartCount > 0 ? (
                  <View style={[
                    styles.heartBadge,
                    {
                      backgroundColor: heartColor + '20', // Soft Pastel Background (15-20% opacity)
                      borderColor: heartColor + '30'      // Subtle border
                    }
                  ]}>
                    <Text style={[styles.heartBadgeText, { color: heartColor }]}>
                      {profile.heartCount}
                    </Text>
                  </View>
                ) : null}

                <LottieView
                  ref={heartAnimationRef}
                  key={`heart-${heartColor}-${isHeartPopping}`}
                  source={isHeartPopping ? heartPopData : heartIdleData}
                  style={styles.heartLottie}
                  autoPlay={!isHeartPopping}
                  loop={!isHeartPopping}
                  onAnimationFinish={() => {
                    if (isHeartPopping) setIsHeartPopping(false);
                  }}
                />
              </Pressable>
            </View>
            <Text style={[styles.profileGrade, { color: colors.text.secondary }]}>
              {profile ? getFullGradeLabel(profile.schoolType, profile.grade) : '초등학교 5학년'}
            </Text>
          </View>

          <Pressable style={styles.editButton} onPress={openEditModal}>
            <Text style={styles.editButtonText}>수정</Text>
          </Pressable>
        </View>

        {/* 통계 */}
        <View style={[styles.statsCard, { backgroundColor: colors.background.primary }]}>
          <View style={styles.statItemSmall}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{testCount}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>검사 횟수</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.gray[200] }]} />
          <View style={styles.statItemSmall}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{Math.min(testCount * 5, 25)}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>획득 배지</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.gray[200] }]} />
          <View style={styles.statItemLarge}>
            <Text style={[styles.statValueDate, { color: colors.text.primary }]}>{lastTestDate}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>최근 검사</Text>
          </View>
        </View>

        {/* Share Button (Photo Card Trigger) */}
        <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl }}>
          <Pressable
            style={({ pressed }) => [
              styles.shareButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
            onPress={() => setShowShareModal(true)}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shareButtonGradient}
            >
              <Text style={styles.shareButtonText}>📸 인증서 만들기</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* 메뉴 그룹 2 */}
        <View style={styles.menuGroup}>
          <Text style={[styles.menuGroupTitle, { color: colors.text.secondary }]}>정보</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.background.primary }]}>
            <MenuItem
              icon="❓"
              label="도움말"
              onPress={() => router.push('/help')}
              colors={colors}
            />
            <MenuItem
              icon="ℹ️"
              label="앱 정보"
              value="v1.0.0"
              onPress={() => Alert.alert('Career Compass', '버전 1.0.0\nbuild 2026.01.01')}
              colors={colors}
            />
            <MenuItem
              icon="🎮"
              label="Fun.Uncle 놀러가기"
              value=""
              onPress={() => Linking.openURL('https://fun.uncledison.com')}
              colors={colors}
              isSpecial={true}
            />
            <MenuItem
              icon="📜"
              label="이용약관"
              onPress={() => setShowTermsModal(true)}
              colors={colors}
            />
            <MenuItem
              icon="🔒"
              label="개인정보처리방침"
              onPress={() => setShowPrivacyModal(true)}
              colors={colors}
            />
          </View>
        </View>

        {/* 메뉴 그룹 3 */}
        <View style={styles.menuGroup}>
          <View style={[styles.menuCard, { backgroundColor: colors.background.primary }]}>
            <MenuItem
              icon="🗑️"
              label="데이터 초기화"
              onPress={handleReset}
              danger
              colors={colors}
            />
          </View>
        </View>
      </ScrollView>

      {/* Snow Overlay */}
      {isSnowing && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100, pointerEvents: 'none' }]}>
          <SnowOverlay />
        </View>
      )}

      {/* 편집 모달 */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>프로필 수정</Text>

            {/* 캐릭터 선택 (가장 상단 배치) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>캐릭터</Text>
              <View style={styles.characterRow}>
                {CHARACTER_OPTIONS.map((char) => (
                  <Pressable
                    key={char.id}
                    style={[
                      styles.characterOption,
                      editCharacter === char.id && styles.characterOptionSelected
                    ]}
                    onPress={() => setEditCharacter(char.id)}
                  >
                    <View style={[styles.characterPreview, { pointerEvents: 'none' }]}>
                      <ModelViewer3D
                        modelPath={`/models/characters/${char.id}.glb`}
                        animations={['Idle']}
                        width={60}
                        height={60}
                        autoRotate={false}
                        cameraDistance="10m"
                        cameraTarget="0m 0.9m 0m"
                        disableControls
                        backgroundColor="transparent"
                      />
                    </View>
                    {editCharacter === char.id && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 닉네임 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>닉네임</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text.primary, backgroundColor: colors.gray[100] }]}
                value={editNickname}
                onChangeText={setEditNickname}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* 학교급 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>학교</Text>
              <View style={styles.schoolTypeRow}>
                <SchoolTypeButton
                  type="elementary"
                  label="초등"
                  selected={editSchoolType === 'elementary'}
                  onPress={() => handleSchoolTypeChange('elementary')}
                />
                <SchoolTypeButton
                  type="middle"
                  label="중등"
                  selected={editSchoolType === 'middle'}
                  onPress={() => handleSchoolTypeChange('middle')}
                />
                <SchoolTypeButton
                  type="high"
                  label="고등"
                  selected={editSchoolType === 'high'}
                  onPress={() => handleSchoolTypeChange('high')}
                />
              </View>
            </View>

            {/* 학년 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>학년</Text>
              <View style={styles.gradeRow}>
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <GradeButton
                    key={g}
                    grade={g as GradeNumber}
                    selected={editGrade === g}
                    onPress={() => setEditGrade(g as GradeNumber)}
                    maxGrade={getMaxGrade(editSchoolType)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>저장</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>


      {/* 포토카드 공유 프리뷰 모달 */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.photoCardModalContent, { backgroundColor: 'transparent' }]}>
            {/* 실제 캡처될 뷰 (ViewShot) */}
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0 }}
              style={{ borderRadius: 24, overflow: 'hidden', ...Shadow.xl }}
            >
              <View ref={captureViewRef} collapsable={false}>
                <LinearGradient
                  colors={['#1a2a6c', '#b21f1f', '#fdbb2d']} // Magical Sunset Gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.photoCard}
                >
                  {/* Decorative Elements */}
                  <View style={styles.cardDecorationTop} />
                  <View style={styles.cardDecorationBottom} />

                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Career Compass</Text>
                    <Text style={styles.cardDate}>{formatDate(Date.now()).split(' ')[0]}</Text>
                  </View>

                  {/* Character */}
                  <View style={styles.cardCharacterContainer}>
                    <ModelViewer3D
                      modelPath={`/models/characters/${profile?.character || 'Female_1'}.glb`}
                      animations={['Jump', 'Wave']}
                      width={280}
                      height={280}
                      autoRotate={true}
                      cameraDistance="6m"
                      cameraTarget="0m 0.8m 0m"
                      borderRadius={0}
                      backgroundColor="transparent"
                      disableControls
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{profile?.nickname || '탐험가'}</Text>
                    <Text style={styles.cardGrade}>{getFullGradeLabel(profile?.schoolType || 'elementary', profile?.grade || 5)}</Text>

                    <View style={styles.cardHeartRow}>
                      <LottieView
                        source={require('../../assets/lottie/HeartIdle.json')}
                        colorFilters={[{ keypath: "**", color: heartColor }]}
                        style={{ width: 40, height: 40 }}
                        autoPlay
                        loop
                      />
                      <Text style={[styles.cardHeartCount, { color: heartColor }]}>
                        {profile?.heartCount || 0}
                      </Text>
                    </View>
                  </View>

                  {/* Footer Badge/Logo */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardFooterText}>나는야 미래의 꿈 탐험가!</Text>
                  </View>
                </LinearGradient>
              </View>
            </ViewShot>

            {/* Action Buttons */}
            <View style={styles.shareActionButtons}>
              <Pressable style={styles.closeShareButton} onPress={() => setShowShareModal(false)}>
                <Text style={styles.closeShareButtonText}>닫기</Text>
              </Pressable>
              <Pressable style={styles.doShareButton} onPress={sharePhotoCard}>
                <Text style={styles.doShareButtonText}>{isSharing ? '생성 중...' : '저장하기'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 이용약관 모달 */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.legalModalContent, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>이용약관</Text>
            <ScrollView style={styles.legalScrollView}>
              <Text style={[styles.legalText, { color: colors.text.secondary }]}>{TERMS_OF_SERVICE}</Text>
            </ScrollView>
            <Pressable style={styles.closeButton} onPress={() => setShowTermsModal(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 개인정보처리방침 모달 */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.legalModalContent, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>개인정보처리방침</Text>
            <ScrollView style={styles.legalScrollView}>
              <Text style={[styles.legalText, { color: colors.text.secondary }]}>{PRIVACY_POLICY}</Text>
            </ScrollView>
            <Pressable style={styles.closeButton} onPress={() => setShowPrivacyModal(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...TextStyle.title2,
    marginLeft: 24,
    color: Colors.text.primary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    ...TextStyle.title2,
    color: Colors.text.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heartContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
  },
  heartLottie: {
    width: 60,
    height: 60,
  },
  heartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(242, 242, 247, 0.9)', // Apple Silver Gray (Translucent)
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  heartBadgeText: {
    color: '#8E8E93', // Apple Medium Gray
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Apple SD Gothic Neo' : 'sans-serif-medium',
  },
  bravoContainer: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
    width: 100,
    zIndex: 20,
  },
  bravoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF2D55',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontStyle: 'italic',
  },
  profileGrade: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.main + '15',
    borderRadius: BorderRadius.full,
  },
  editButtonText: {
    ...TextStyle.footnote,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemSmall: {
    flex: 0.8,
    alignItems: 'center',
  },
  statItemLarge: {
    flex: 1.4,
    alignItems: 'center',
  },
  statValue: {
    ...TextStyle.title2,
    color: Colors.text.primary,
  },
  statValueDate: {
    ...TextStyle.title2,
    color: Colors.text.primary,
  },
  statLabel: {
    ...TextStyle.caption1,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.gray[200],
  },
  menuGroup: {
    marginBottom: Spacing.md,
  },
  menuGroupTitle: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray[200],
  },
  menuItemPressed: {
    backgroundColor: Colors.gray[50],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuItemIcon: {
    fontSize: 20,
  },
  menuItemLabel: {
    ...TextStyle.body,
    color: Colors.text.primary,
  },
  menuItemLabelDanger: {
    color: Colors.semantic.error,
  },
  menuItemValue: {
    ...TextStyle.body,
    color: Colors.text.secondary,
  },
  menuItemArrow: {
    ...TextStyle.title2,
    color: Colors.gray[400],
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.xxl,
  },
  modalTitle: {
    ...TextStyle.title2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...TextStyle.footnote,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  textInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...TextStyle.body,
    color: Colors.text.primary,
  },
  schoolTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  schoolTypeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  schoolTypeButtonSelected: {
    backgroundColor: Colors.primary.main,
  },
  schoolTypeButtonText: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
  },
  schoolTypeButtonTextSelected: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  gradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gradeButton: {
    width: 70,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  gradeButtonSelected: {
    backgroundColor: Colors.primary.main,
  },
  gradeButtonText: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
  },
  gradeButtonTextSelected: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    ...TextStyle.callout,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  // 테마 모달 스타일
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray[200],
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  themeOptionIcon: {
    fontSize: 24,
  },
  themeOptionLabel: {
    ...TextStyle.body,
    color: Colors.text.primary,
  },
  themeOptionSelected: {
    backgroundColor: Colors.primary.main + '10',
    borderRadius: BorderRadius.md,
  },
  themeRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRadioSelected: {
    borderColor: Colors.primary.main,
  },
  themeRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary.main,
  },
  closeButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    ...TextStyle.callout,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  // 법적 문서 모달 스타일
  legalModalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.xxl,
  },
  legalScrollView: {
    maxHeight: 400,
    marginVertical: Spacing.md,
  },
  legalText: {
    ...TextStyle.body,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  // Character Selection Styles
  characterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  characterOption: {
    alignItems: 'center',
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  characterOptionSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '10',
  },
  characterPreview: {
    width: 60,
    height: 60,
    backgroundColor: Colors.gray[100],
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  checkmark: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary.main,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background.primary,
  },
  checkmarkText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Share / PhotoCard Styles
  shareButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.md,
  },
  shareButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    ...TextStyle.callout,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  photoCardModalContent: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCard: {
    width: 320,
    height: 480, // 2:3 Ratio
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 30,
    position: 'relative',
  },
  cardDecorationTop: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardDecorationBottom: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    alignItems: 'center',
    zIndex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  cardCharacterContainer: {
    height: 250,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    width: '85%',
    ...Shadow.lg,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1f35',
    marginBottom: 4,
  },
  cardGrade: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardHeartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeartCount: {
    fontSize: 24,
    fontWeight: '900',
  },
  cardFooter: {
    marginTop: 10,
  },
  cardFooterText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  shareActionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 15,
    width: '100%',
    justifyContent: 'center',
  },
  closeShareButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  closeShareButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  doShareButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Shadow.md,
  },
  doShareButtonText: {
    color: '#1a2a6c',
    fontWeight: 'bold',
    fontSize: 16,
  },

});

// 이용약관 내용
const TERMS_OF_SERVICE = `
Career Compass 이용약관

제1조 (목적)
본 약관은 Career Compass(이하 "앱")가 제공하는 진로탐색 서비스의 이용조건 및 절차에 관한 사항을 규정합니다.

제2조 (서비스 내용)
1. 본 앱은 HOLLAND 직업흥미이론, 다중지능이론, 진로발달이론에 기반한 진로적성검사를 제공합니다.
2. 검사 결과는 참고용이며, 전문 상담사의 조언을 대체하지 않습니다.

제3조 (이용자의 의무)
1. 이용자는 본인의 정보를 정확하게 입력해야 합니다.
2. 검사는 솔직하게 응답해야 정확한 결과를 얻을 수 있습니다.

제4조 (서비스 변경 및 중단)
앱은 서비스 개선을 위해 사전 공지 후 서비스를 변경하거나 중단할 수 있습니다.

제5조 (면책조항)
1. 검사 결과에 따른 진로 결정은 이용자 본인의 책임입니다.
2. 앱은 검사 결과의 정확성을 보장하지 않습니다.

시행일: 2026년 1월 1일
`;

// 개인정보처리방침 내용
const PRIVACY_POLICY = `
Career Compass 개인정보처리방침

1. 수집하는 개인정보
- 닉네임, 학교급, 학년
- 검사 응답 및 결과 데이터
- 앱 사용 기록

2. 개인정보 수집 목적
- 맞춤형 진로 검사 서비스 제공
- 검사 결과 저장 및 히스토리 관리
- 서비스 개선을 위한 통계 분석

3. 개인정보 보관 기간
- 모든 데이터는 사용자 기기에만 저장됩니다.
- 앱 삭제 시 모든 데이터가 삭제됩니다.
- 데이터 초기화 기능으로 언제든 삭제 가능합니다.

4. 개인정보의 제3자 제공
- 사용자 동의 없이 개인정보를 외부에 제공하지 않습니다.

5. 개인정보 보호책임자
- 이메일: support@careercompass.app

6. 정보주체의 권리
- 개인정보 열람, 정정, 삭제를 요청할 수 있습니다.
- 앱 내 '데이터 초기화' 기능으로 직접 삭제 가능합니다.

시행일: 2026년 1월 1일
`;
