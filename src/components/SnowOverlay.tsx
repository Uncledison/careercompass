import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    useAnimatedReaction,
    SharedValue,
    cancelAnimation,
} from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const SNOWFLAKE_COUNT = 150; // Constant heavy density

const Snowflake = React.memo(({ index, wind }: { index: number; wind: SharedValue<number> }) => {
    // Spreading startX wider to cover potential drift areas
    const startX = Math.random() * width;

    // Spread initial Y from way above (-height) to bottom (height) 
    // This creates an "already raining" effect immediately on mount.
    const initialY = Math.random() * (height * 2) - height;

    // Duration: 7s to 12s (Slow & Peaceful)
    const duration = 7000 + Math.random() * 5000;
    const size = 3 + Math.random() * 5;
    const opacity = 0.4 + Math.random() * 0.6;

    const translateY = useSharedValue(initialY);
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
        // First run: from current random position to end
        const distanceRemaining = height + 100 - initialY;
        const speed = (height + 150) / duration; // pixels per ms
        const firstDuration = distanceRemaining / speed;

        translateY.value = withTiming(height + 100, {
            duration: firstDuration,
            easing: Easing.linear,
        }, (finished) => {
            if (finished) {
                // Reset to top and loop normally
                translateY.value = -50;
                translateY.value = withRepeat(
                    withTiming(height + 100, {
                        duration: duration,
                        easing: Easing.linear,
                    }),
                    -1,
                    false
                );
            }
        });

        return () => cancelAnimation(translateY);
    }, []);

    useAnimatedReaction(
        () => wind.value,
        (currentWind) => {
            if (currentWind !== 0) {
                // Smooth drift. Note: currentWind is already dampened/multiplied.
                // We add to X.
                const drift = currentWind;
                translateX.value = withTiming(translateX.value - drift, { duration: 150 });

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
    const wind = useSharedValue(0);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMotion = (event: any) => {
                const acc = event.accelerationIncludingGravity;
                if (acc) {
                    const x = acc.x ? acc.x / 9.8 : 0;
                    // Calibrated sensitivity: 8
                    wind.value = x * 8;
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
                        wind.value = data.x * 8;
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
