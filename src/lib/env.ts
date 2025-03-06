// we will validate .env against the env type in /types/env.d.ts
import * as yup from 'yup';

const envSchema = yup
    .object({
        NEXT_PUBLIC_POSTHOG_KEY: yup.string().required(),
        NEXT_PUBLIC_POSTHOG_HOST: yup.string().url().required(),
        NEXT_PUBLIC_SIGNALR_HUB_URL: yup.string().url().required(),
    })
    .required();

export const validateEnv = () => {
    try {
        envSchema.validateSync(process.env);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('❌ Invalid environment variables:', error.message);
        } else {
            console.error('❌ Invalid environment variables:', error);
        }
        process.exit(1);
    }
};
