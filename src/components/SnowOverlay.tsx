import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Platform, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    withDelay,
} from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const SNOWFLAKE_COUNT = 70;

const Snowflake = ({ index, sensorData }: { index: number; sensorData: { x: number; y: number; z: number } }) => {
    const startX = Math.random() * width;
    const startY = -50 - Math.random() * 500;
    const duration = 3000 + Math.random() * 5000;
    const size = 3 + Math.random() * 5;
    const opacity = 0.5 + Math.random() * 0.5;

    // Use shared values for high performance loop
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
        // Continuous falling animation
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

    // Effect to handle drift (Wind/Gravity)
    useEffect(() => {
        if (!sensorData) return;

        // Accelerometer X:
        // 0 = Flat
        // >0 = Tilted Right (in some frames, but let's test. Usually tilting phone left/down makes X change).
        // On Android/iOS:
        // Holding portrait upright: X ~ 0.
        // Tilting Left (top goes left): X becomes positive (gravity vector projection).
        // We want snow to fall LEFT when tilted LEFT.
        // So we SUBTRACT X from Position? or ADD?
        // Let's assume drift proportional to X.

        // Accumulate drift:
        const drift = sensorData.x * 50; // Increased sensitivity for visibility

        // We update translateX slightly.
        translateX.value = withTiming(translateX.value - drift, { duration: 100 });

        // Wrap around logic handled by visual clipping usually, but we can reset if way off screen
        if (translateX.value > width + 50) {
            translateX.value = -50;
        } else if (translateX.value < -50) {
            translateX.value = width + 50;
        }

    }, [sensorData]);

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
};

export const SnowOverlay = () => {
    const [sensorData, setSensorData] = useState({ x: 0, y: 0, z: 0 });
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        // Accelerometer not supported on web in the same way, disable for now
        if (Platform.OS === 'web') return;

        let subscription: any;
        const subscribe = async () => {
            const available = await Accelerometer.isAvailableAsync();
            setIsAvailable(available);
            if (available) {
                Accelerometer.setUpdateInterval(100);
                subscription = Accelerometer.addListener(data => {
                    setSensorData(data);
                });
            }
        };

        subscribe();

        return () => {
            subscription && subscription.remove();
        };
    }, []);

    return (
        <View style={styles.container} pointerEvents="none">
            {Array.from({ length: SNOWFLAKE_COUNT }).map((_, index) => (
                <Snowflake key={index} index={index} sensorData={sensorData} />
            ))}

            {/* Debug Overlay - Temporary */}
            <View style={{ position: 'absolute', top: 100, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10 }}>
                <Text style={{ color: 'red', fontSize: 16 }}>
                    Avail: {isAvailable === null ? 'Checking...' : isAvailable.toString()}
                </Text>
                <Text style={{ color: 'red', fontSize: 16 }}>
                    Sensor X: {sensorData.x.toFixed(2)}
                </Text>
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
