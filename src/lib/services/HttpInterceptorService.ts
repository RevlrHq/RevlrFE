import axios, {
    AxiosError,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';
import { AuthService } from './AuthService';

/**
 * HTTP Interceptor Service that handles automatic token refresh
 */
export class HttpInterceptorService {
    private static initialized = false;
    private static isRefreshing = false;
    private static failedQueue: Array<{
        resolve: (value?: any) => void;
        reject: (error?: any) => void;
    }> = [];

    /**
     * Initialize HTTP interceptors
     */
    static initialize(): void {
        if (this.initialized) return;

        // Request interceptor to add token and check expiration
        axios.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                // Check if token needs refresh before making the request
                await AuthService.refreshTokenIfNeeded();
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor to handle 401 errors
        axios.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            async (error: AxiosError) => {
                const originalRequest =
                    error.config as InternalAxiosRequestConfig & {
                        _retry?: boolean;
                    };

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        // If already refreshing, queue the request
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject });
                        })
                            .then(() => {
                                return axios(originalRequest);
                            })
                            .catch((err) => {
                                return Promise.reject(err);
                            });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        const refreshed = await AuthService.refreshToken();

                        if (refreshed) {
                            // Process all queued requests
                            this.processQueue(null);

                            // Retry the original request
                            return axios(originalRequest);
                        } else {
                            // Refresh failed, handle auth error
                            this.processQueue(error);
                            await AuthService.handleAuthError();
                            return Promise.reject(error);
                        }
                    } catch (refreshError) {
                        this.processQueue(refreshError);
                        await AuthService.handleAuthError();
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );

        this.initialized = true;
    }

    /**
     * Process the queue of failed requests
     */
    private static processQueue(error: any): void {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });

        this.failedQueue = [];
    }

    /**
     * Reset the interceptor state
     */
    static reset(): void {
        this.initialized = false;
        this.isRefreshing = false;
        this.failedQueue = [];
    }
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
    HttpInterceptorService.initialize();
}
