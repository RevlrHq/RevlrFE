/**
 * @jest-environment jsdom
 */

import { SignalRCircuitBreaker } from '@/lib/utils/signalr-circuit-breaker';

describe('SignalRCircuitBreaker', () => {
    let circuitBreaker: SignalRCircuitBreaker;

    beforeEach(() => {
        circuitBreaker = new SignalRCircuitBreaker({
            maxFailures: 3,
            resetTimeoutMs: 1000, // 1 second for testing
        });
    });

    describe('initial state', () => {
        it('should start in closed state', () => {
            expect(circuitBreaker.canAttemptConnection()).toBe(true);

            const state = circuitBreaker.getState();
            expect(state.isOpen).toBe(false);
            expect(state.consecutiveFailures).toBe(0);
        });

        it('should have healthy status message', () => {
            const message = circuitBreaker.getStatusMessage();
            expect(message).toContain('healthy');
        });
    });

    describe('failure recording', () => {
        it('should track consecutive failures', () => {
            circuitBreaker.recordFailure();

            const state = circuitBreaker.getState();
            expect(state.consecutiveFailures).toBe(1);
            expect(state.isOpen).toBe(false);
            expect(circuitBreaker.canAttemptConnection()).toBe(true);
        });

        it('should open circuit after max failures', () => {
            // Record 3 failures (max)
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();

            const state = circuitBreaker.getState();
            expect(state.isOpen).toBe(true);
            expect(state.consecutiveFailures).toBe(3);
            expect(circuitBreaker.canAttemptConnection()).toBe(false);
        });

        it('should update status message when open', () => {
            // Open the circuit
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();

            const message = circuitBreaker.getStatusMessage();
            expect(message).toContain('Circuit breaker open');
            expect(message).toContain('will retry');
        });
    });

    describe('success recording', () => {
        it('should reset failures on success', () => {
            // Record some failures
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();

            // Record success
            circuitBreaker.recordSuccess();

            const state = circuitBreaker.getState();
            expect(state.consecutiveFailures).toBe(0);
            expect(state.isOpen).toBe(false);
            expect(circuitBreaker.canAttemptConnection()).toBe(true);
        });

        it('should reset open circuit on success', () => {
            // Open the circuit
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();

            expect(circuitBreaker.canAttemptConnection()).toBe(false);

            // Record success
            circuitBreaker.recordSuccess();

            expect(circuitBreaker.canAttemptConnection()).toBe(true);
            const state = circuitBreaker.getState();
            expect(state.isOpen).toBe(false);
        });
    });

    describe('timeout behavior', () => {
        it('should reset circuit after timeout', async () => {
            // Open the circuit
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();

            expect(circuitBreaker.canAttemptConnection()).toBe(false);

            // Wait for timeout (1 second + buffer)
            await new Promise((resolve) => setTimeout(resolve, 1100));

            // Should be able to attempt connection again
            expect(circuitBreaker.canAttemptConnection()).toBe(true);

            const state = circuitBreaker.getState();
            expect(state.isOpen).toBe(false);
            expect(state.consecutiveFailures).toBe(0);
        });

        it('should calculate time until reset correctly', () => {
            // Open the circuit
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();

            const state = circuitBreaker.getState();
            expect(state.timeUntilReset).toBeGreaterThan(0);
            expect(state.timeUntilReset).toBeLessThanOrEqual(1000);
        });
    });

    describe('manual reset', () => {
        it('should reset circuit manually', () => {
            // Open the circuit
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();

            expect(circuitBreaker.canAttemptConnection()).toBe(false);

            // Manual reset
            circuitBreaker.reset();

            expect(circuitBreaker.canAttemptConnection()).toBe(true);
            const state = circuitBreaker.getState();
            expect(state.isOpen).toBe(false);
            expect(state.consecutiveFailures).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('should handle rapid successive failures', () => {
            // Record failures rapidly
            for (let i = 0; i < 5; i++) {
                circuitBreaker.recordFailure();
            }

            const state = circuitBreaker.getState();
            expect(state.isOpen).toBe(true);
            expect(state.consecutiveFailures).toBe(5);
            expect(circuitBreaker.canAttemptConnection()).toBe(false);
        });

        it('should handle success after circuit is open', () => {
            // Open circuit
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();
            circuitBreaker.recordFailure();

            // Try to record success while open
            circuitBreaker.recordSuccess();

            // Should be reset
            expect(circuitBreaker.canAttemptConnection()).toBe(true);
            const state = circuitBreaker.getState();
            expect(state.isOpen).toBe(false);
        });
    });

    describe('configuration', () => {
        it('should respect custom max failures', () => {
            const customBreaker = new SignalRCircuitBreaker({
                maxFailures: 2,
                resetTimeoutMs: 1000,
            });

            // Should open after 2 failures instead of 3
            customBreaker.recordFailure();
            expect(customBreaker.canAttemptConnection()).toBe(true);

            customBreaker.recordFailure();
            expect(customBreaker.canAttemptConnection()).toBe(false);
        });

        it('should respect custom timeout', async () => {
            const customBreaker = new SignalRCircuitBreaker({
                maxFailures: 1,
                resetTimeoutMs: 500, // 0.5 seconds
            });

            // Open circuit
            customBreaker.recordFailure();
            expect(customBreaker.canAttemptConnection()).toBe(false);

            // Wait for custom timeout
            await new Promise((resolve) => setTimeout(resolve, 600));

            expect(customBreaker.canAttemptConnection()).toBe(true);
        });
    });
});
