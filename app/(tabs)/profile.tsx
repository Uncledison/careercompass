/**
 * 프로필 화면
 * 사용자 정보 표시 및 편집
 */

import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import {
  useProfileStore,
  SchoolType,
  GradeNumber,
  getFullGradeLabel,
} from '../../src/stores/profileStore';
import { useHistoryStore, formatDate } from '../../src/stores/historyStore';
import { ModelViewer3D } from '../../src/components/character/ModelViewer3D';

import { useTheme } from '../../src/context/ThemeContext';

const CHARACTER_OPTIONS = [
  { id: 'Female_1', name: '캐릭터 1' },
  { id: 'Female_2', name: '캐릭터 2' },
  { id: 'Male_1', name: '캐릭터 3' },
  { id: 'Male_2', name: '캐릭터 4' },
];

const THEME_STORAGE_KEY = 'careercompass_theme';

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

const ProfileAvatar = ({ character }: { character: string }) => (
  <View style={profileAvatarStyles.container}>
    <ModelViewer3D
      modelPath={`/models/characters/${character}.gltf`}
      animations={['Wave', 'Yes']}
      width={100}
      height={100}
      autoRotate={false}
      cameraDistance="13.5m"
      cameraTarget="0.5m 1m 0m"
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
  colors?: any; // Temporarily any to avoid import cycles or complex types
}

const MenuItem = ({ icon, label, value, onPress, danger, colors }: MenuItemProps) => (
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
      <Text style={[
        styles.menuItemLabel,
        { color: colors?.text.primary || Colors.text.primary },
        danger && styles.menuItemLabelDanger
      ]}>
        {label}
      </Text>
    </View>
    {value ? (
      <Text style={[styles.menuItemValue, { color: colors?.text.secondary }]}>{value}</Text>
    ) : (
      <Text style={[styles.menuItemArrow, { color: colors?.gray[400] }]}>›</Text>
    )}
  </Pressable>
);

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
  const { profile, loadProfile, updateProfile, clearProfile } = useProfileStore();
  const { results, loadHistory } = useHistoryStore();
  const { colors, isDarkMode } = useTheme();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [editNickname, setEditNickname] = useState('');
  const [editSchoolType, setEditSchoolType] = useState<SchoolType>('elementary');
  const [editGrade, setEditGrade] = useState<GradeNumber>(5);
  const [editCharacter, setEditCharacter] = useState('Female_1');

  // 데이터 로드
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
      // Native alert
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>내 정보</Text>
        </View>

        {/* 프로필 카드 */}
        <View style={[styles.profileCard, { backgroundColor: colors.background.primary }]}>
          <ProfileAvatar character={profile?.character || 'Female_1'} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text.primary }]}>{profile?.nickname || '탐험가'}</Text>
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



        {/* 메뉴 그룹 2 */}
        <View style={styles.menuGroup}>
          <Text style={[styles.menuGroupTitle, { color: colors.text.secondary }]}>정보</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.background.primary }]}>
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
            <MenuItem
              icon="ℹ️"
              label="앱 버전"
              value="1.0.0"
              onPress={() => { }}
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
                    <View style={styles.characterPreview} pointerEvents="none">
                      <ModelViewer3D
                        modelPath={`/models/characters/${char.id}.gltf`}
                        animations={['Idle']}
                        width={60}
                        height={60}
                        autoRotate={false}
                        cameraDistance="5m"
                        cameraTarget="0m 1.0m 0m"
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
  },
  headerTitle: {
    ...TextStyle.largeTitle,
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
});
