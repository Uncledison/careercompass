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
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Almost opaque for crispness
        paddingHorizontal: 12, // Slimmer horizontal
        paddingVertical: 6,  // Slimmer vertical
        borderRadius: BorderRadius.full,
        zIndex: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05, // Very subtle shadow
        shadowRadius: 3,
        elevation: 2,
    },
    text: {
        ...TextStyle.caption2,
        color: Colors.text.primary,
        fontWeight: 'bold',
        fontSize: 11, // Slightly smaller text for slim look
    },
    pointer: {
        position: 'absolute',
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
    },
    // Sharp Long Pointers
    pointerLeft: {
        right: -8, // Longer reach
        top: '50%',
        marginTop: -4,
        borderTopWidth: 4,     // Narrower base
        borderRightWidth: 0,
        borderBottomWidth: 4,  // Narrower base
        borderLeftWidth: 8,    // Longer tip
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'rgba(255, 255, 255, 0.95)',
    },
    pointerRight: {
        left: -8,
        top: '50%',
        marginTop: -4,
        borderTopWidth: 4,
        borderRightWidth: 8,
        borderBottomWidth: 4,
        borderLeftWidth: 0,
        borderTopColor: 'transparent',
        borderRightColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    pointerBottom: {
        bottom: -8,
        left: '50%',
        marginLeft: -4,
        borderTopWidth: 8,    // Longer tip
        borderRightWidth: 4,  // Narrower base
        borderBottomWidth: 0,
        borderLeftWidth: 4,   // Narrower base
        borderTopColor: 'rgba(255, 255, 255, 0.95)',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    pointerTop: {
        top: -8,
        left: '50%',
        marginLeft: -4,
        borderTopWidth: 0,
        borderRightWidth: 4,
        borderBottomWidth: 8,
        borderLeftWidth: 4,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'rgba(255, 255, 255, 0.95)',
        borderLeftColor: 'transparent',
    }
});
