import { useState, useEffect, useRef } from 'react';

export default function useCountdown() {
    const [countdown, setCountdown] = useState<string>('');
    const [isCountingDown, setIsCountingDown] = useState<boolean>(true);
    const countdownInterval = useRef<NodeJS.Timeout | null>(null);

    const startTimer = (durationInSeconds: number) => {
        let remainingTime = durationInSeconds;

        countdownInterval.current = setInterval(() => {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;

            setCountdown(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
            remainingTime--;

            if (remainingTime < 0) {
                clearInterval(countdownInterval.current as NodeJS.Timeout);
                countdownInterval.current = null;
                setIsCountingDown(false);
            }
        }, 1000);
    };

    // Cleanup interval on component unmount
    useEffect(() => {
        return () => {
            if (countdownInterval.current) {
                clearInterval(countdownInterval.current);
            }
        };
    }, []);

    return {
        countdown,
        isCountingDown,
        startTimer,
    };
}
