import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation,
    runOnJS,
    useAnimatedReaction
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InfiniteMarqueeProps {
    speed?: number; // pixels per second
    children: React.ReactNode;
    style?: any;
}

export const InfiniteMarquee = ({
    speed = 30, // Default speed
    children,
    style
}: InfiniteMarqueeProps) => {
    // We measure the width of the children content
    const [contentWidth, setContentWidth] = useState(0);
    const translateX = useSharedValue(0);
    const isInteracting = useSharedValue(false);

    // Context for gesture
    const startX = useSharedValue(0);

    // Loop animation
    useEffect(() => {
        if (contentWidth > 0 && !isInteracting.value) {
            // Calculate duration based on distance and speed
            // Distance is contentWidth (one full cycle)
            const duration = (contentWidth / speed) * 1000;

            translateX.value = withRepeat(
                withTiming(-contentWidth, {
                    duration: duration,
                    easing: Easing.linear,
                }),
                -1, // Infinite
                false // No reverse
            );
        }
    }, [contentWidth, speed]);

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            isInteracting.value = true;
            cancelAnimation(translateX);
            startX.value = translateX.value;
        })
        .onUpdate((event) => {
            translateX.value = startX.value + event.translationX;
        })
        .onEnd((event) => {
            isInteracting.value = false;

            // Resume physics or just resume loop?
            // User might have flung it.
            // For Marquee, usually we just resume the flow.
            // But we need to handle the modulo logic manually if we disrupted standard loop.

            // Simplest logic: Resume loop from current position to nearest end
            // But withRepeat expects a clean start/end.

            // We'll rely on the React Effect to restart via state change or 
            // manually trigger runOnJS to restarting the loop logic?
            // Actually, we can just restart the animation from current `translateX.value` 
            // to `-contentWidth` (or `-(contentWidth * 2)` if we are far left).

            // Let's use `runOnJS` to trigger a re-sync if needed, or simply strictly define the animation here.

            // Calculate proper target
            // Current position is `translateX.value`.
            // We want to go left.

            // Safe Reset logic: 
            // We use the modulo in style, so `translateX` allows going heavily negative.
            // But `withRepeat` is rigid.

            // Better Infinite Marquee approach with Reanimated:
            // Just animate 0 -> -contentWidth forever.
            // If gesture interrupts, we stop.
            // On release, we calculate `distanceRemaining` to `-contentWidth` (modulo).
        })
        .onFinalize(() => {
            // To keep it simple and robust:
            // We won't support high-fidelity fling for now, just drag and resume.
            // On release, we need to restart the loop.
            runOnJS(resumeAnimation)();
        });

    const resumeAnimation = () => {
        // Resetting animation is tricky because `translateX` might be arbitrary.
        // A common trick: Reset translateX to `translateX % contentWidth` (instant), then animate to `-contentWidth`.
        // But need to be careful of sign.

        // Let's defer to a simpler logic: 
        // Just force a re-render or similar? No.

        // Logic:
        // 1. Normalize current X to range [0, -contentWidth]
        // 2. Set translateX.value to that.
        // 3. Start timing to -contentWidth.
        // 4. Then loop 0 -> -contentWidth.

        let current = translateX.value % contentWidth;
        if (current > 0) current -= contentWidth; // Should be negative

        translateX.value = current;

        const distRemaining = -contentWidth - current; // negative number
        const duration = (Math.abs(distRemaining) / speed) * 1000;

        translateX.value = withTiming(-contentWidth, {
            duration: duration,
            easing: Easing.linear
        }, (finished) => {
            if (finished) {
                translateX.value = 0;
                translateX.value = withRepeat(
                    withTiming(-contentWidth, {
                        duration: (contentWidth / speed) * 1000,
                        easing: Easing.linear
                    }),
                    -1,
                    false
                );
            }
        });
    };

    const animatedStyle = useAnimatedStyle(() => {
        // We render two copies. 
        // We translate the container.
        // We use modulo to wrap visually if we used a huge number, but here we reset.
        return {
            transform: [{ translateX: translateX.value }],
            flexDirection: 'row',
        };
    });

    return (
        <View style={[styles.container, style]}>
            {/* Content Wrapper to measure */}
            <GestureHandlerRootView>
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={animatedStyle}>
                        <View
                            style={{ flexDirection: 'row' }}
                            onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
                        >
                            {children}
                        </View>
                        {/* Duplicate for loop */}
                        {contentWidth > 0 && (
                            <>
                                <View style={{ flexDirection: 'row' }}>{children}</View>
                                <View style={{ flexDirection: 'row' }}>{children}</View>
                                <View style={{ flexDirection: 'row' }}>{children}</View>
                            </>
                        )}
                        {/* 3 Copies minimum to cover screen + extra drag safety */}
                    </Animated.View>
                </GestureDetector>
            </GestureHandlerRootView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
    },
});
