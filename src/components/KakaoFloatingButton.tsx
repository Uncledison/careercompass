import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Platform, View, Image } from 'react-native';
import { Colors } from '../constants';
import { Ionicons } from '@expo/vector-icons';

declare global {
    interface Window {
        Kakao: any;
    }
}

export const KakaoFloatingButton = () => {
    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
            script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2txfDWp1Ps941 +mRun4UmP';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                if (!window.Kakao.isInitialized()) {
                    window.Kakao.init('8e68190d1ba932955a557fbf0ae0b659');
                }
            };
            document.head.appendChild(script);
        }
    }, []);

    const handleShare = () => {
        if (Platform.OS === 'web' && window.Kakao) {
            if (!window.Kakao.isInitialized()) {
                window.Kakao.init('8e68190d1ba932955a557fbf0ae0b659');
            }

            window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: 'CareerCompass - 나의 진로 찾기',
                    description: 'AI가 분석해주는 나만의 맞춤형 진로! 지금 바로 확인해보세요.',
                    imageUrl: 'https://fun.uncledison.com/assets/career_banner.png', // Fallback image setup
                    link: {
                        mobileWebUrl: 'https://careercompass-jobs.vercel.app',
                        webUrl: 'https://careercompass-jobs.vercel.app',
                    },
                },
                buttons: [
                    {
                        title: '검사하러 가기',
                        link: {
                            mobileWebUrl: 'https://careercompass-jobs.vercel.app',
                            webUrl: 'https://careercompass-jobs.vercel.app',
                        },
                    },
                ],
            });
        } else {
            // Native fallback (Using Expo Sharing if needed, but primary request is Web logic)
            alert('카카오톡 공유는 웹 환경에서 최적화되어 있습니다.');
        }
    };

    if (Platform.OS !== 'web') return null; // Web only for this implementation

    return (
        <View style={styles.positionContainer}>
            <TouchableOpacity
                style={styles.button}
                onPress={handleShare}
                activeOpacity={0.7}
            >
                <Ionicons name="chatbubble-ellipses" size={24} color="#3C1E1E" style={{ marginLeft: 1, marginTop: 1 }} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    positionContainer: {
        position: 'absolute',
        bottom: 90, // TabBar Height (approx 60-80) + padding
        right: 16,
        zIndex: 9999,
    },
    button: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FAE100', // Kakao Yellow with slight transparency
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
        opacity: 0.9, // Minimalist/Transparent feel requested
    },
});
