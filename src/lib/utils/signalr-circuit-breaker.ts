/**
 * SignalR Circuit Breaker Utility
 *
 * Provides utilities for monitoring and managing SignalR connection circuit breaker state
 */

export interface CircuitBreakerState {
    isOpen: boolean;
    consecutiveFailures: number;
    lastFailureTime: number;
    timeUntilReset: number;
}

export interface CircuitBreakerConfig {
    maxFailures: number;
    resetTimeoutMs: number;
}

export class SignalRCircuitBreaker {
    private consecutiveFailures = 0;
    private lastFailureTime = 0;
    private isOpen = false;

    constructor(
        private config: CircuitBreakerConfig = {
            maxFailures: 3,
            resetTimeoutMs: 60000, // 1 minute
        }
    ) {}

    /**
     * Check if the circuit breaker allows connection attempts
     */
    canAttemptConnection(): boolean {
        if (!this.isOpen) {
            return true;
        }

        const now = Date.now();
        const timeSinceLastFailure = now - this.lastFailureTime;

        if (timeSinceLastFailure >= this.config.resetTimeoutMs) {
            this.reset();
            return true;
        }

        return false;
    }

    /**
     * Record a connection failure
     */
    recordFailure(): void {
        this.consecutiveFailures++;
        this.lastFailureTime = Date.now();

        if (this.consecutiveFailures >= this.config.maxFailures) {
            this.isOpen = true;
            console.warn(
                `SignalR Circuit Breaker: Opened after ${this.consecutiveFailures} consecutive failures`
            );
        }
    }

    /**
     * Record a successful connection
     */
    recordSuccess(): void {
        this.reset();
    }

    /**
     * Reset the circuit breaker
     */
    reset(): void {
        this.consecutiveFailures = 0;
        this.lastFailureTime = 0;
        this.isOpen = false;
    }

    /**
     * Get current circuit breaker state
     */
    getState(): CircuitBreakerState {
        const now = Date.now();
        const timeSinceLastFailure = now - this.lastFailureTime;
        const timeUntilReset = this.isOpen
            ? Math.max(0, this.config.resetTimeoutMs - timeSinceLastFailure)
            : 0;

        return {
            isOpen: this.isOpen,
            consecutiveFailures: this.consecutiveFailures,
            lastFailureTime: this.lastFailureTime,
            timeUntilReset,
        };
    }

    /**
     * Get human-readable status
     */
    getStatusMessage(): string {
        const state = this.getState();

        if (!state.isOpen) {
            return state.consecutiveFailures > 0
                ? `Circuit breaker closed (${state.consecutiveFailures} recent failures)`
                : 'Circuit breaker closed (healthy)';
        }

        const secondsUntilReset = Math.ceil(state.timeUntilReset / 1000);
        return `Circuit breaker open - will retry in ${secondsUntilReset} seconds`;
    }
}

/**
 * Global circuit breaker instance for SignalR connections
 */
export const signalRCircuitBreaker = new SignalRCircuitBreaker();

/**
 * Hook to monitor circuit breaker state
 */
export function useSignalRCircuitBreakerState(): CircuitBreakerState & {
    statusMessage: string;
    canConnect: boolean;
} {
    const state = signalRCircuitBreaker.getState();

    return {
        ...state,
        statusMessage: signalRCircuitBreaker.getStatusMessage(),
        canConnect: signalRCircuitBreaker.canAttemptConnection(),
    };
}
