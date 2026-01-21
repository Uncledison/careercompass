import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Alert } from 'react-native';
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

const CARD_PAIRS = [
    { id: 'science', icon: '🔬', name: '과학' },
    { id: 'art', icon: '🎨', name: '예술' },
    { id: 'law', icon: '⚖️', name: '법률' },
    { id: 'medical', icon: '🩺', name: '의료' },
    { id: 'engineering', icon: '🤖', name: '공학' },
    { id: 'sports', icon: '⚽', name: '운동' },
];

interface Card {
    id: string; // Unique ID for key
    pairId: string; // ID to check match (e.g., 'science')
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
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

    useEffect(() => {
        rotation.value = withTiming(card.isFlipped || card.isMatched ? 180 : 0, { duration: 300 });
    }, [card.isFlipped, card.isMatched]);

    const frontStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotation.value, [0, 180], [0, 180]);
        return {
            transform: [{ rotateY: `${rotateValue}deg` }],
            zIndex: rotation.value < 90 ? 1 : 0,
        };
    });

    const backStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotation.value, [0, 180], [180, 360]);
        return {
            transform: [{ rotateY: `${rotateValue}deg` }],
            zIndex: rotation.value > 90 ? 1 : 0,
        };
    });

    return (
        <Pressable onPress={onPress} style={{ width: cardWidth, height: cardWidth * 1.2, margin: 5 }}>
            {/* Front (Hidden state - Question Mark) */}
            <Animated.View style={[styles.card, styles.cardFront, frontStyle, { backgroundColor: colors.primary.main }]}>
                <Text style={styles.cardQuestion}>?</Text>
            </Animated.View>

            {/* Back (Revealed state - Icon) */}
            <Animated.View style={[styles.card, styles.cardBack, backStyle, { backgroundColor: colors.background.primary, borderColor: colors.primary.main }]}>
                <Text style={styles.cardIcon}>{card.icon}</Text>
            </Animated.View>
        </Pressable>
    );
};

export default function MemoryGameScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matches, setMatches] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    // Initialize Game
    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
        const duplicatedPairs = [...CARD_PAIRS, ...CARD_PAIRS].map((item, index) => ({
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
    };

    const handleCardPress = (index: number) => {
        if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

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
            setTimeout(() => {
                const newCards = [...currentCards];
                newCards[index1].isMatched = true;
                newCards[index2].isMatched = true;
                setCards(newCards);
                setFlippedIndices([]);
                setIsLocked(false);
                setMatches(prev => prev + 1);

                if (matches + 1 === CARD_PAIRS.length) {
                    Alert.alert("축하합니다!", `모든 카드를 찾으셨습니다!\n시도 횟수: ${attempts + 1}`, [
                        { text: "다시 하기", onPress: startNewGame },
                        { text: "나가기", onPress: () => router.back() }
                    ]);
                }
            }, 500);
        } else {
            // No Match
            setTimeout(() => {
                const newCards = [...currentCards];
                newCards[index1].isFlipped = false;
                newCards[index2].isFlipped = false;
                setCards(newCards);
                setFlippedIndices([]);
                setIsLocked(false);
            }, 1000);
        }
    };

    const screenWidth = Dimensions.get('window').width;
    const cardWidth = (screenWidth - (Spacing.md * 2) - 40) / 4; // 4 columns with padding

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.closeButton}>
                    <Text style={[styles.closeButtonText, { color: colors.text.secondary }]}>✕</Text>
                </Pressable>
                <Text style={[styles.title, { color: colors.text.primary }]}>미니 게임</Text>
                <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreLabel, { color: colors.text.secondary }]}>시도: {attempts}</Text>
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

            <Pressable style={[styles.resetButton, { backgroundColor: colors.primary.main }]} onPress={startNewGame}>
                <Text style={styles.resetButtonText}>다시 시작</Text>
            </Pressable>
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
    title: {
        ...TextStyle.title3,
        fontWeight: 'bold',
    },
    scoreContainer: {
        padding: Spacing.sm,
    },
    scoreLabel: {
        ...TextStyle.body,
        fontWeight: '600',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: Spacing.sm,
        marginTop: Spacing.xl,
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
    },
    cardFront: {
        // Background color set dynamically
    },
    cardBack: {
        borderWidth: 2,
    },
    cardQuestion: {
        fontSize: 32,
        color: 'white',
        fontWeight: 'bold',
    },
    cardIcon: {
        fontSize: 32,
    },
    resetButton: {
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        ...Shadow.md,
    },
    resetButtonText: {
        ...TextStyle.callout,
        color: 'white',
        fontWeight: 'bold',
    },
});
