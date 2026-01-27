"use client"
import { useEffect, useState } from 'react';

/**
 * Custom hook to check if animations should run
 * Animations will only run once per session
 */
export function useAnimateOnce(key = 'homepage-animated') {
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        // Check if animations have already been shown in this session
        const hasAnimated = sessionStorage.getItem(key);

        if (!hasAnimated) {
            setShouldAnimate(true);
            sessionStorage.setItem(key, 'true');
        }
    }, [key]);

    return shouldAnimate;
}
