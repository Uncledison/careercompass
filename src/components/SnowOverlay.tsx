import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Platform, Text, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    withDelay,
    useAnimatedReaction,
    runOnJS,
} from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const SNOWFLAKE_COUNT = 70;

// SharedValue passed as prop does not trigger re-render
const Snowflake = React.memo(({ index, wind }: { index: number; wind: Animated.SharedValue<number> }) => {
    const startX = Math.random() * width;
    const startY = -50 - Math.random() * 500;
    const duration = 3000 + Math.random() * 5000;
    const size = 3 + Math.random() * 5;
    const opacity = 0.5 + Math.random() * 0.5;

    const translateY = useSharedValue(startY);
    const translateX = useSharedValue(startX);

    useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
        };
    });

    useEffect(() => {
        translateY.value = withDelay(
            Math.random() * 2000,
            withRepeat(
                withTiming(height + 100, {
                    duration: duration,
                    easing: Easing.linear,
                }),
                -1,
                false
            )
        );
    }, []);

    // Respond to wind changes on UI thread without React logic
    useAnimatedReaction(
        () => wind.value,
        (currentWind) => {
            if (currentWind !== 0) {
                // Apply wind force
                const drift = currentWind * 5;
                translateX.value = withTiming(translateX.value - drift, { duration: 100 });

                // Wrap around
                if (translateX.value > width + 50) {
                    translateX.value = -50;
                } else if (translateX.value < -50) {
                    translateX.value = width + 50;
                }
            }
        }
    );

    const style = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'white',
            opacity: opacity,
            transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
        };
    });

    return <Animated.View style={style} />;
});

export const SnowOverlay = () => {
    // Core animation driver - bypasses React State for children
    const wind = useSharedValue(0);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMotion = (event: any) => {
                const acc = event.accelerationIncludingGravity;
                if (acc) {
                    const x = acc.x ? acc.x / 9.8 : 0;
                    // Extreme High sensitivity: x (approx 0 to 1) * 30
                    // This means tilting phone 45 degrees might send snowflakes flying sideways fast
                    wind.value = x * 30;
                }
            };
            window.addEventListener('devicemotion', handleMotion);
            return () => window.removeEventListener('devicemotion', handleMotion);
        } else {
            let subscription: any;
            const subscribe = async () => {
                const available = await Accelerometer.isAvailableAsync();
                if (available) {
                    Accelerometer.setUpdateInterval(20); // Very fast updates
                    subscription = Accelerometer.addListener(data => {
                        // Extreme High sensitivity for Native
                        wind.value = data.x * 30;
                    });
                }
            };
            subscribe();
            return () => subscription && subscription.remove();
        }
    }, []);

    return (
        <View style={styles.container} pointerEvents="none">
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {Array.from({ length: SNOWFLAKE_COUNT }).map((_, index) => (
                    <Snowflake key={index} index={index} wind={wind} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
    },
});
