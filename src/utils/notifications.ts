import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * 3개월 후 재검사 알림 예약
 */
export const scheduleRetestReminder = async () => {
    if (Platform.OS === 'web') return; // 웹에서는 Expo Notification 제한적

    try {
        // 권한 확인
        const settings = await Notifications.getPermissionsAsync();
        let finalStatus = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

        if (!finalStatus) {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status === 'granted';
        }

        if (!finalStatus) {
            console.log('Notification permissions not granted');
            return;
        }

        // 기존 알림 취소 (중복 방지)
        await Notifications.cancelAllScheduledNotificationsAsync();

        // 3개월 후 날짜 계산
        const date = new Date();
        date.setMonth(date.getMonth() + 3);
        // 테스트용: 10초 후
        // date.setSeconds(date.getSeconds() + 10);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "진로 탐험을 다시 해볼까요?",
                body: "지난 검사로부터 3개월이 지났어요! 그동안 나의 흥미가 어떻게 변했는지 확인해보세요. 🚀",
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: date,
            },
        });

        console.log('Retest reminder scheduled for:', date);
    } catch (error) {
        console.error('Failed to schedule notification:', error);
    }
};
