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
    SharedValue,
} from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';

const { width, height } = Dimensions.get('window');

const Snowflake = React.memo(({ index, wind }: { index: number; wind: SharedValue<number> }) => {
    const startX = Math.random() * width;
    const startY = -50 - Math.random() * 500;
    // Slower speed: 6000ms base + 5000ms random variation
    const duration = 6000 + Math.random() * 5000;
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

    useAnimatedReaction(
        () => wind.value,
        (currentWind) => {
            if (currentWind !== 0) {
                // Reduced sensitivity factor (was 5 in reaction, driven by 30 in sensor)
                // Now driving factor is 12, keep reaction factor same or tweak.
                const drift = currentWind * 3;
                translateX.value = withTiming(translateX.value - drift, { duration: 100 });

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

export const SnowOverlay = ({ mode = 'normal' }: { mode?: 'normal' | 'heavy' }) => {
    const wind = useSharedValue(0);
    const snowflakeCount = mode === 'heavy' ? 150 : 50;

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMotion = (event: any) => {
                const acc = event.accelerationIncludingGravity;
                if (acc) {
                    const x = acc.x ? acc.x / 9.8 : 0;
                    // Moderate sensitivity: x * 12 (Use to be 30)
                    wind.value = x * 12;
                }
            };
            window.addEventListener('devicemotion', handleMotion);
            return () => window.removeEventListener('devicemotion', handleMotion);
        } else {
            let subscription: any;
            const subscribe = async () => {
                const available = await Accelerometer.isAvailableAsync();
                if (available) {
                    Accelerometer.setUpdateInterval(30);
                    subscription = Accelerometer.addListener(data => {
                        // Moderate sensitivity for Native
                        wind.value = data.x * 12;
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
                {Array.from({ length: snowflakeCount }).map((_, index) => (
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
