import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    ZoomIn,
    FadeOut,
    Easing,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, TextStyle } from '../constants';

interface InteractionHintProps {
    text: string;
    visible: boolean;
    delay?: number;
    style?: ViewStyle;
    direction?: 'left' | 'right' | 'top' | 'bottom';
}

export const InteractionHint = ({
    text,
    visible,
    delay = 2000,
    style,
    direction = 'left',
}: InteractionHintProps) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (visible) {
            // Pulse / Breathing animation (Apple style)
            scale.value = withDelay(
                delay,
                withRepeat(
                    withSequence(
                        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
                        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) })
                    ),
                    -1,
                    true
                )
            );
        }
    }, [visible, delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    if (!visible) return null;

    return (
        <Animated.View
            entering={ZoomIn.delay(delay).springify()}
            exiting={FadeOut}
            style={[
                styles.container,
                style,
                animatedStyle,
            ]}
        >
            <Text style={styles.text}>{text}</Text>
            <View style={[
                styles.pointer,
                direction === 'left' ? styles.pointerLeft :
                    direction === 'right' ? styles.pointerRight :
                        direction === 'bottom' ? styles.pointerBottom :
                            styles.pointerTop
            ]} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Apple-like translucent white
        paddingHorizontal: Spacing.md, // Slightly more padding
        paddingVertical: Spacing.sm, // Slightly more padding
        borderRadius: BorderRadius.full,
        zIndex: 100,
        borderWidth: 1, // Subtle border
        borderColor: 'rgba(255, 255, 255, 0.5)', // Lighter border
        // Shadow.sm removed for a flatter, modern look
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    text: {
        ...TextStyle.caption2,
        color: Colors.text.primary, // Darker text for contrast on light background
        fontWeight: 'bold',
    },
    pointer: {
        position: 'absolute',
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
    },
    pointerLeft: {
        right: -5,
        top: '50%',
        marginTop: -3,
        borderTopWidth: 3,
        borderRightWidth: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 5,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'rgba(255, 255, 255, 0.9)',
    },
    pointerRight: {
        left: -5,
        top: '50%',
        marginTop: -3,
        borderTopWidth: 3,
        borderRightWidth: 5,
        borderBottomWidth: 3,
        borderLeftWidth: 0,
        borderTopColor: 'transparent',
        borderRightColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    pointerBottom: {
        bottom: -5,
        left: '50%',
        marginLeft: -3,
        borderTopWidth: 5,
        borderRightWidth: 3,
        borderBottomWidth: 0,
        borderLeftWidth: 3,
        borderTopColor: 'rgba(255, 255, 255, 0.9)',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    pointerTop: {
        top: -5,
        left: '50%',
        marginLeft: -3,
        borderTopWidth: 0,
        borderRightWidth: 3,
        borderBottomWidth: 5,
        borderLeftWidth: 3,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'rgba(255, 255, 255, 0.9)',
        borderLeftColor: 'transparent',
    }
});
