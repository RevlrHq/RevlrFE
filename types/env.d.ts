// types/env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
        NEXT_PUBLIC_API_URL: string;
        NEXT_PUBLIC_POSTHOG_KEY: string;
        NEXT_PUBLIC_POSTHOG_HOST: string;
        NEXT_PUBLIC_SIGNALR_HUB_URL: string;
    }
}
