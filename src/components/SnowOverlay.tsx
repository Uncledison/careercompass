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
                // We use a small factor because this runs every frame/update
                // Actually, useAnimatedReaction runs when wind.value changes. 
                // Since wind.value changes continuously from sensor, this is good.

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
    // We keep state only for Debug View (optional)
    const [debugX, setDebugX] = useState(0);

    // Core animation driver - bypasses React State for children
    const wind = useSharedValue(0);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMotion = (event: any) => {
                const acc = event.accelerationIncludingGravity;
                if (acc) {
                    const x = acc.x ? acc.x / 9.8 : 0;
                    // Update SharedValue (UI Thread accessible)
                    wind.value = x * 2; // Multiplier

                    // Throttle debug updates to avoid flickering UI
                    if (Math.random() > 0.95) setDebugX(x);
                }
            };
            window.addEventListener('devicemotion', handleMotion);
            return () => window.removeEventListener('devicemotion', handleMotion);
        } else {
            let subscription: any;
            const subscribe = async () => {
                const available = await Accelerometer.isAvailableAsync();
                if (available) {
                    Accelerometer.setUpdateInterval(50);
                    subscription = Accelerometer.addListener(data => {
                        wind.value = data.x * 2;
                        if (Math.random() > 0.95) setDebugX(data.x);
                    });
                }
            };
            subscribe();
            return () => subscription && subscription.remove();
        }
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS === 'web') {
            // @ts-ignore
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                try {
                    // @ts-ignore
                    const response = await DeviceMotionEvent.requestPermission();
                    if (response === 'granted') alert('Granted!');
                } catch (e: any) { alert(e.message); }
            }
        } else {
            Accelerometer.requestPermissionsAsync();
        }
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {Array.from({ length: SNOWFLAKE_COUNT }).map((_, index) => (
                    <Snowflake key={index} index={index} wind={wind} />
                ))}
            </View>

            {/* Debug Overlay - Minimal */}
            <View style={{ position: 'absolute', top: 120, left: 20, pointerEvents: 'auto' }}>
                <Pressable onPress={requestPermissions} style={{ opacity: 0.1, width: 50, height: 50, backgroundColor: 'blue' }}>
                </Pressable>
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
