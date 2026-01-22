import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Alert, Image, ImageSourcePropType } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    withSequence,
    withDelay
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../../src/constants';
import { useTheme } from '../../src/context/ThemeContext';
import { Audio } from 'expo-av';

const playSound = async (type: 'flip' | 'match' | 'mismatch' | 'success' | 'gameover') => {
    try {
        let source;
        switch (type) {
            case 'flip': source = require('../../assets/sounds/flip.mp3'); break;
            case 'match': source = require('../../assets/sounds/match.mp3'); break;
            case 'mismatch': source = require('../../assets/sounds/mismatch.mp3'); break;
            case 'success': source = require('../../assets/sounds/success.mp3'); break;
            case 'gameover': source = require('../../assets/sounds/gameover.mp3'); break;
        }

        // Use createAsync for one-shot playback. 
        // We don't await the unload because we want fire-and-forget for UI responsiveness.
        // However, for proper cleanup, usually we should unload. 
        // For simple UI sounds, letting basic garbage collection handle it is often 'good enough' for quick prototypes,
        // but explicit unload is better. 

        const { sound } = await Audio.Sound.createAsync(
            source,
            { shouldPlay: true }
        );

        // Optional: Unload from memory when finished
        sound.setOnPlaybackStatusUpdate(async (status) => {
            if (status.isLoaded && status.didJustFinish) {
                await sound.unloadAsync();
            }
        });

    } catch (error) {
        console.log('Sound playback failed', error);
    }
};

const CARD_PAIRS = [
    { id: 'science', image: require('../../assets/images/game/science.png'), name: '과학' },
    { id: 'art', image: require('../../assets/images/game/art.png'), name: '예술' },
    { id: 'law', image: require('../../assets/images/game/law.png'), name: '법률' },
    { id: 'medical', image: require('../../assets/images/game/medical.png'), name: '의료' },
    { id: 'engineering', image: require('../../assets/images/game/engineering.png'), name: '공학' },
    { id: 'sports', image: require('../../assets/images/game/sports.png'), name: '운동' },
    { id: 'music', image: require('../../assets/images/game/music.png'), name: '음악' },
    { id: 'cooking', image: require('../../assets/images/game/cooking.png'), name: '요리' },
    { id: 'space', image: require('../../assets/images/game/space.png'), name: '우주' },
    { id: 'coding', image: require('../../assets/images/game/coding.png'), name: '코딩' },
];

const CARD_BACK_IMAGE = require('../../assets/images/game/card_back_final.png');

const getLevelConfig = (level: number) => {
    if (level === 1) return { pairs: 6, time: null, cols: 3, label: '초급' };
    if (level === 2) return { pairs: 8, time: 60, cols: 4, label: '중급' };
    if (level === 3) return { pairs: 10, time: 50, cols: 4, label: '고급' };

    // Infinite Mode (Level 4+)
    const infiniteLevel = level - 3;
    const timeLimit = Math.max(15, 50 - (infiniteLevel * 5)); // Decrease 5s per level, min 15s
    return {
        pairs: 10,
        time: timeLimit,
        cols: 4,
        label: `무한 도전 Lv.${infiniteLevel}`
    };
};

interface Card {
    id: string; // Unique ID for key
    pairId: string; // ID to check match (e.g., 'science')
    image: ImageSourcePropType;
    isFlipped: boolean;
    isMatched: boolean;
    isMismatching?: boolean; // New state for shake animation
}

const CardItem = ({
    card,
    onPress,
    cardWidth
}: {
    card: Card;
    onPress: () => void;
    cardWidth: number;
}) => {
    const { colors } = useTheme();
    const rotation = useSharedValue(0);
    const shake = useSharedValue(0);

    useEffect(() => {
        rotation.value = withTiming(card.isFlipped || card.isMatched ? 180 : 0, { duration: 200 });
    }, [card.isFlipped, card.isMatched]);

    // Shake Effect Trigger
    useEffect(() => {
        if (card.isMismatching) {
            shake.value = withSequence(
                withTiming(10, { duration: 50 }),
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        }
    }, [card.isMismatching]);

    const frontStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotation.value, [0, 180], [0, 180]);
        return {
            transform: [
                { rotateY: `${rotateValue}deg` },
                { translateX: shake.value }
            ],
            zIndex: rotation.value < 90 ? 1 : 0,
        };
    });

    const backStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotation.value, [0, 180], [180, 360]);
        return {
            transform: [
                { rotateY: `${rotateValue}deg` },
                { translateX: shake.value }
            ],
            zIndex: rotation.value > 90 ? 1 : 0,
        };
    });

    return (
        <Pressable onPress={onPress} style={{ width: cardWidth, height: cardWidth * 1.35, margin: 5 }}>
            {/* Front (Hidden state - Question Mark / Card Back Image) */}
            {/* Note: In Memory Game terminology, "Front" usually refers to the face-down state (Question Mark), and "Back" is the revealed content. */}
            {/* However, the code naming here is reversed: */}
            {/* cardFront = Question Mark (Initial State) -> This should be the FULL BLEED CARD BACK IMAGE */}
            <Animated.View style={[styles.card, styles.cardFront, frontStyle]}>
                <Image source={CARD_BACK_IMAGE} style={styles.cardBackImage} resizeMode="cover" />
            </Animated.View>

            {/* Back (Revealed state - Item Image) -> This is the face-up state */}
            <Animated.View style={[styles.card, styles.cardBack, backStyle, { backgroundColor: '#FFFFFF', borderColor: colors.primary.main, borderWidth: 2 }]}>
                <Image source={card.image} style={styles.cardFrontImage} resizeMode="contain" />
            </Animated.View>
        </Pressable>
    );
};



export default function MemoryGameScreen() {
    const router = useRouter();
    const { colors } = useTheme();

    const [level, setLevel] = useState<number>(1);
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matches, setMatches] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [gameState, setGameState] = useState<'playing' | 'level_complete' | 'game_over'>('playing');
    const [isSoundOn, setIsSoundOn] = useState(true);

    const toggleSound = () => {
        setIsSoundOn(!isSoundOn);
    };

    // Initialize Game
    useEffect(() => {
        startNewGame(1);
    }, []);

    // Timer Logic
    useEffect(() => {
        let interval: any;

        if (gameState === 'playing' && timeLeft !== null && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === 1) {
                        clearInterval(interval);
                        handleGameOver();
                        return 0;
                    }
                    return prev! - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [gameState, timeLeft]);

    const startNewGame = (targetLevel: number = 1) => {
        setLevel(targetLevel);
        setGameState('playing');
        const config = getLevelConfig(targetLevel);
        const selectedPairs = CARD_PAIRS.slice(0, config.pairs);

        const duplicatedPairs = [...selectedPairs, ...selectedPairs].map((item, index) => ({
            ...item,
            id: `card-${index}`,
            pairId: item.id,
            isFlipped: false,
            isMatched: false,
        }));

        // Shuffle
        const shuffled = duplicatedPairs.sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setFlippedIndices([]);
        setMatches(0);
        setAttempts(0);
        setIsLocked(false);
        setTimeLeft(config.time);
    };

    const handleGameOver = () => {
        playSound('gameover');
        setGameState('game_over');
        setIsLocked(true);
    };

    const handleLevelComplete = () => {
        playSound('success');
        setGameState('level_complete');
    };

    const handleCardPress = (index: number) => {
        if (isLocked || cards[index].isFlipped || cards[index].isMatched || gameState !== 'playing') return;

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);
        playSound('flip');

        const newFlippedIndices = [...flippedIndices, index];
        setFlippedIndices(newFlippedIndices);

        if (newFlippedIndices.length === 2) {
            setIsLocked(true);
            setAttempts(prev => prev + 1);
            checkForMatch(newFlippedIndices, newCards);
        }
    };

    const checkForMatch = (indices: number[], currentCards: Card[]) => {
        const [index1, index2] = indices;
        const card1 = currentCards[index1];
        const card2 = currentCards[index2];

        if (card1.pairId === card2.pairId) {
            // Match!
            playSound('match');
            setTimeout(() => {
                const newCards = [...currentCards];
                newCards[index1].isMatched = true;
                newCards[index2].isMatched = true;
                setCards(newCards);
                setFlippedIndices([]);
                setIsLocked(false);

                const newMatches = matches + 1;
                setMatches(newMatches);

                if (newMatches === getLevelConfig(level).pairs) {
                    handleLevelComplete();
                }
            }, 500);
        } else {
            // No Match
            playSound('mismatch');
            // Trigger Shake
            const shakeCards = [...currentCards];
            shakeCards[index1].isMismatching = true;
            shakeCards[index2].isMismatching = true;
            setCards(shakeCards);

            setTimeout(() => {
                const newCards = [...shakeCards];
                newCards[index1].isFlipped = false;
                newCards[index2].isFlipped = false;
                newCards[index1].isMismatching = false; // Reset shake
                newCards[index2].isMismatching = false;
                setCards(newCards);
                setFlippedIndices([]);
                setIsLocked(false);
            }, 1000);
        }
    };

    const screenWidth = Dimensions.get('window').width;
    const config = getLevelConfig(level);
    const cardWidth = (screenWidth - (Spacing.md * 2) - (config.cols * 10)) / config.cols;

    // Game Result Modal Content
    const renderGameResult = () => {
        if (gameState === 'playing') return null;

        let title = '';
        let message = '';
        let buttonText = '';
        let onButtonPress = () => { };
        let secondaryButtonText = '그만하기';

        switch (gameState) {
            case 'level_complete':
                title = '레벨 클리어! 🎉';
                const nextLevel = level + 1;
                const nextConfig = getLevelConfig(nextLevel);
                message = `${config.label} 통과!\n다음은 '${nextConfig.label}' 입니다.\n(제한시간: ${nextConfig.time ? nextConfig.time + '초' : '없음'})`;
                buttonText = '다음 레벨 도전';
                onButtonPress = () => startNewGame(nextLevel);
                break;
            case 'game_over':
                title = '시간 초과 ⏰';
                message = '아쉽네요! 다시 도전해보세요.';
                buttonText = '다시 시도';
                onButtonPress = () => startNewGame(level);
                break;
        }

        return (
            <View style={[styles.resultOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                <View style={[styles.resultCard, { backgroundColor: colors.background.primary }]}>
                    <Text style={[styles.resultTitle, { color: colors.text.primary }]}>{title}</Text>
                    <Text style={[styles.resultMessage, { color: colors.text.secondary }]}>{message}</Text>

                    <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary.main }]} onPress={onButtonPress}>
                        <Text style={styles.primaryButtonText}>{buttonText}</Text>
                    </Pressable>

                    <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
                        <Text style={[styles.secondaryButtonText, { color: colors.text.secondary }]}>{secondaryButtonText}</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.closeButton}>
                    <Text style={[styles.closeButtonText, { color: colors.text.secondary }]}>✕</Text>
                </Pressable>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: colors.text.primary }]}>미니 게임</Text>
                    <Text style={[styles.subtitle, { color: colors.primary.main }]}>{config.label} (Lv.{level})</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable onPress={toggleSound} style={styles.soundButton}>
                        <Text style={{ fontSize: 20 }}>{isSoundOn ? '🔊' : '🔇'}</Text>
                    </Pressable>
                    <View style={styles.scoreContainer}>
                        {timeLeft !== null && (
                            <Text style={[styles.timerText, { color: timeLeft <= 10 ? Colors.semantic.error : colors.text.primary }]}>
                                ⏳ {timeLeft}초
                            </Text>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.gridContainer}>
                {cards.map((card, index) => (
                    <CardItem
                        key={card.id}
                        card={card}
                        onPress={() => handleCardPress(index)}
                        cardWidth={cardWidth}
                    />
                ))}
            </View>

            <View style={styles.footer}>
                <Text style={[styles.attemptText, { color: colors.text.secondary }]}>시도 횟수: {attempts}</Text>
                <Pressable style={[styles.resetButton, { backgroundColor: colors.gray[200] }]} onPress={() => startNewGame(level)}>
                    <Text style={[styles.resetButtonText, { color: colors.text.primary }]}>현재 레벨 재시작</Text>
                </Pressable>
            </View>

            {renderGameResult()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    closeButton: {
        padding: Spacing.sm,
    },
    closeButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        ...TextStyle.title3,
        fontWeight: 'bold',
    },
    subtitle: {
        ...TextStyle.caption1,
        fontWeight: '600',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    soundButton: {
        padding: Spacing.sm,
    },
    scoreContainer: {
        padding: Spacing.sm,
        width: 80,
        alignItems: 'flex-end',
    },
    timerText: {
        ...TextStyle.body,
        fontWeight: 'bold',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: Spacing.sm,
        marginTop: Spacing.lg,
    },
    card: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden',
        ...Shadow.sm,
        overflow: 'hidden',
    },
    cardFront: {
        backgroundColor: 'transparent',
    },
    cardBack: {
        borderWidth: 2,
    },
    cardBackImage: {
        width: '100%',
        height: '100%',
    },
    cardFrontImage: {
        width: '80%',
        height: '80%',
    },
    footer: {
        padding: Spacing.lg,
        alignItems: 'center',
        gap: Spacing.md,
        marginTop: 'auto', // Push to bottom
    },
    attemptText: {
        ...TextStyle.body,
    },
    resetButton: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
    },
    resetButtonText: {
        ...TextStyle.callout,
        fontWeight: '600',
    },
    // Result Modal Styles
    resultOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    resultCard: {
        width: '85%',
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        ...Shadow.lg,
    },
    resultTitle: {
        ...TextStyle.title2,
        fontWeight: 'bold',
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    resultMessage: {
        ...TextStyle.body,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 24,
    },
    primaryButton: {
        width: '100%',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    primaryButtonText: {
        ...TextStyle.callout,
        color: 'white',
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: Spacing.sm,
    },
    secondaryButtonText: {
        ...TextStyle.body,
        textDecorationLine: 'underline',
    },
});

