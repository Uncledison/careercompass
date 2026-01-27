import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    ZoomIn,
    FadeOut,
    Easing,
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
    const rotation = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            // Wiggle/Shake animation
            rotation.value = withDelay(
                delay + 500, // Start shaking slightly after appearing
                withRepeat(
                    withSequence(
                        withTiming(-5, { duration: 100 }),
                        withTiming(5, { duration: 100 }),
                        withTiming(-3, { duration: 100 }),
                        withTiming(3, { duration: 100 }),
                        withTiming(0, { duration: 100 }),
                        withDelay(2000, withTiming(0, { duration: 0 })) // Pause between shakes
                    ),
                    -1, // Infinite repeat
                    false // No reverse
                )
            );

            // Gentle float/bobbing
            translateY.value = withDelay(
                delay,
                withRepeat(
                    withSequence(
                        withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
                        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) })
                    ),
                    -1,
                    true
                )
            );
        }
    }, [visible, delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { rotateZ: `${rotation.value}deg` },
            { translateY: translateY.value }
        ],
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
            {/* Little triangle pointer based on direction could be added here, 
          but keeping it simple (pill shape) for now as requested "Bubble" */}
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
        backgroundColor: Colors.primary.main,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        zIndex: 100,
        ...Shadow.sm,
    },
    text: {
        ...TextStyle.caption2,
        color: '#FFFFFF', // Keeping it white for contrast on Primary Blue
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
        right: -6,
        top: '50%',
        marginTop: -4,
        borderTopWidth: 4,
        borderRightWidth: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 6,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: Colors.primary.main,
    },
    pointerRight: {
        left: -6,
        top: '50%',
        marginTop: -4,
        borderTopWidth: 4,
        borderRightWidth: 6,
        borderBottomWidth: 4,
        borderLeftWidth: 0,
        borderTopColor: 'transparent',
        borderRightColor: Colors.primary.main,
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    pointerBottom: {
        bottom: -6,
        left: '50%',
        marginLeft: -4,
        borderTopWidth: 6,
        borderRightWidth: 4,
        borderBottomWidth: 0,
        borderLeftWidth: 4,
        borderTopColor: Colors.primary.main,
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    pointerTop: {
        top: -6,
        left: '50%',
        marginLeft: -4,
        borderTopWidth: 0,
        borderRightWidth: 4,
        borderBottomWidth: 6,
        borderLeftWidth: 4,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.primary.main,
        borderLeftColor: 'transparent',
    }
});
