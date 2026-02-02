import React from 'react';
import { View, StyleSheet, Platform, ViewProps } from 'react-native';
import { Colors } from '../../constants';

interface ContainerProps extends ViewProps {
    maxWidth?: number;
    center?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
    children,
    maxWidth = 500, // Mobile app simulation width
    center = true,
    style,
    ...props
}) => {
    // Mobile: pass through
    if (Platform.OS !== 'web') {
        return <View style={style} {...props}>{children}</View>;
    }

    // Web: constrain width
    return (
        <View style={[
            styles.webBackground,
            style,
            Platform.OS === 'web' && {
                position: 'fixed' as any,
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                height: 'auto' as any,
                zIndex: 9999, // Ensure it's on top of everything
            }
        ]} {...props}>
            <View style={[
                styles.container,
                { maxWidth },
                center && styles.center
            ]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    webBackground: {
        flex: 1,
        backgroundColor: '#f0f2f5', // Neutral background for outside area
        alignItems: 'center', // Center the content
        width: '100%',
        height: '100%',
    },
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.background.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        overflow: 'hidden', // Contain children
    },
    center: {
        alignSelf: 'center',
    }
});
