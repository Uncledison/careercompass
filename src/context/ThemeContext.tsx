import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as LightColors } from '../constants/colors';

// Define Dark Colors based on Light Colors structure
const DarkColors = {
    ...LightColors,
    background: {
        primary: '#1C1C1E',
        secondary: '#2C2C2E',
        tertiary: '#3A3A3C',
    },
    text: {
        primary: '#FFFFFF',
        secondary: '#EBEBF5',
        tertiary: '#98989D',
        inverse: '#1C1C1E',
    },
    gray: {
        50: '#1C1C1E',
        100: '#2C2C2E',
        200: '#3A3A3C',
        300: '#48484A',
        400: '#636366',
        500: '#8E8E93',
        600: '#AEAEB2',
        700: '#D1D1D6',
        800: '#E5E5EA',
        900: '#F2F2F7',
    },
    // Adjust semantic colors for dark mode visibility if needed
    // Keeping brand colors same for now, or slightly adjusting brightness
};

type ThemeType = typeof LightColors;

interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
    setTheme: (mode: 'light' | 'dark') => void;
    colors: ThemeType;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'careercompass_theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const systemScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 테마 기능을 삭제했으므로 항상 라이트 모드로 고정합니다.
        setIsDarkMode(false);
        setIsLoaded(true);
    }, []);

    const toggleTheme = () => {
        // 기능 삭제됨
    };

    const setTheme = (mode: 'light' | 'dark') => {
        // 기능 삭제됨
    };

    const themeValues: ThemeContextType = {
        isDarkMode,
        toggleTheme,
        setTheme,
        colors: isDarkMode ? DarkColors : LightColors,
    };

    if (!isLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <ThemeContext.Provider value={themeValues}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
