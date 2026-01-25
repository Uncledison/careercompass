import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    withDelay,
    cancelAnimation,
} from 'react-native-reanimated';
import { Gyroscope } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const SNOWFLAKE_COUNT = 70;

const Snowflake = ({ index, gyroscopeData }: { index: number; gyroscopeData: { x: number; y: number; z: number } }) => {
    const startX = Math.random() * width;
    const startY = -50 - Math.random() * 500; // Start comfortably above screen
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
                -1, // Infinite repeat
                false // Do not reverse
            )
        );
    }, []);

    // Effect to handle gyroscope drift
    useEffect(() => {
        // Basic drift logic: adjust X based on gyroscope Y (tilt left/right usually affects X in portrait)
        // Adjust this mapping based on device orientation behavior
        if (gyroscopeData) {
            // Sensitivity factor
            const sensitive = 5;
            // If we tilt phone, gyroscopeData.y (or x depending on axis) changes.
            // Let's assume straight accumulation for a "wind" effect
            translateX.value = withTiming(translateX.value + gyroscopeData.y * sensitive, { duration: 100 });

            // Wrap around screen width
            if (translateX.value > width + 20) {
                translateX.value = -20;
            } else if (translateX.value < -20) {
                translateX.value = width + 20;
            }
        }
    }, [gyroscopeData]);

    const style = useAnimatedStyle(() => {
        // Continuous downward movement is handled by the initial loop.
        // We add the dynamic drift here if we wanted to simpler stateless approach, 
        // but mixing state-driven updates with reanimated loops can be tricky.
        // Instead, let's just let the 'translateX' be driven by the sensor updates above
        // and 'translateY' be the constant fall.
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
    const [gyroscopeData, setGyroscopeData] = useState({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        // Subscribe to gyroscope
        let subscription: any;
        const subscribe = async () => {
            const isAvailable = await Gyroscope.isAvailableAsync();
            if (isAvailable) {
                Gyroscope.setUpdateInterval(100);
                subscription = Gyroscope.addListener(data => {
                    setGyroscopeData(data);
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
                <Snowflake key={index} index={index} gyroscopeData={gyroscopeData} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999, // Ensure it sits on top
        elevation: 9999,
    },
});
