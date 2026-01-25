import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Platform, Text, Pressable } from 'react-native';
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

    useEffect(() => {
        if (!sensorData) return;
        const drift = sensorData.x * 50;
        translateX.value = withTiming(translateX.value - drift, { duration: 100 });

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
        let subscription: any;
        const subscribe = async () => {
            const available = await Accelerometer.isAvailableAsync();
            setIsAvailable(available);

            if (available) {
                if (Platform.OS !== 'web') {
                    Accelerometer.setUpdateInterval(100);
                }

                subscription = Accelerometer.addListener(data => {
                    setSensorData(data);
                });
            } else {
                if (Platform.OS === 'web') {
                    subscription = Accelerometer.addListener(data => {
                        setSensorData(data);
                    });
                }
            }
        };

        subscribe();

        return () => {
            subscription && subscription.remove();
        };
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS === 'web') {
            // @ts-ignore
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                try {
                    // @ts-ignore
                    const response = await DeviceMotionEvent.requestPermission();
                    if (response === 'granted') {
                        alert('Sensor permission granted! Accelerometer should work now.');
                    } else {
                        alert('Sensor permission denied');
                    }
                } catch (e: any) {
                    alert('Error calling requestPermission: ' + e.message);
                }
            } else {
                alert('DeviceMotionEvent.requestPermission is not a function. Check browser settings or https.');
            }
        } else {
            const { status } = await Accelerometer.requestPermissionsAsync();
            alert('Native Permission: ' + status);
        }
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Pointer events 'box-none' allows clicking through to underlying views, 
                BUT we need to capture clicks for our debug button. 
                So the container should technically let clicks pass through (none) 
                but the debug button needs to catch them. 
                'box-none' means "I don't catch clicks, but my children do". 
            */}

            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {Array.from({ length: SNOWFLAKE_COUNT }).map((_, index) => (
                    <Snowflake key={index} index={index} sensorData={sensorData} />
                ))}
            </View>

            {/* Debug Overlay - Temporary */}
            <View style={{ position: 'absolute', top: 120, left: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 15, borderRadius: 8 }}>
                <Text style={{ color: 'white', fontSize: 14, marginBottom: 4 }}>
                    Avail: {isAvailable === null ? 'Checking...' : isAvailable.toString()}
                </Text>
                <Text style={{ color: 'white', fontSize: 14, marginBottom: 10 }}>
                    Sensor X: {sensorData.x.toFixed(2)}
                </Text>

                <Pressable onPress={requestPermissions} style={{ backgroundColor: '#007AFF', padding: 8, borderRadius: 4 }}>
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                        [Enable Sensors]
                    </Text>
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
