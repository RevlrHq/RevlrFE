'use client';

import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule<T> {
    field: keyof T;
    validator: (value: any, data: T) => string | null;
    required?: boolean;
}

export type ValidationErrors<T> = {
    [K in keyof T]?: string;
};

interface UseSettingsValidationOptions<T> {
    rules: ValidationRule<T>[];
    validateOnChange?: boolean;
}

interface UseSettingsValidationReturn<T> {
    errors: ValidationErrors<T>;
    isValid: boolean;
    validate: (data: T) => boolean;
    validateField: (field: keyof T, value: any, data: T) => string | null;
    clearErrors: () => void;
    clearFieldError: (field: keyof T) => void;
    hasFieldError: (field: keyof T) => boolean;
}

export function useSettingsValidation<T extends Record<string, any>>({
    rules,
    validateOnChange = true,
}: UseSettingsValidationOptions<T>): UseSettingsValidationReturn<T> {
    const [errors, setErrors] = useState<ValidationErrors<T>>({});

    const validateField = useCallback(
        (field: keyof T, value: any, data: T): string | null => {
            const rule = rules.find((r) => r.field === field);
            if (!rule) return null;

            // Check required validation
            if (
                rule.required &&
                (value === null || value === undefined || value === '')
            ) {
                return `${String(field)} is required`;
            }

            // Skip other validations if field is empty and not required
            if (
                !rule.required &&
                (value === null || value === undefined || value === '')
            ) {
                return null;
            }

            return rule.validator(value, data);
        },
        [rules]
    );

    const validate = useCallback(
        (data: T): boolean => {
            const newErrors: ValidationErrors<T> = {};
            let hasErrors = false;

            rules.forEach((rule) => {
                const value = data[rule.field];
                const error = validateField(rule.field, value, data);
                if (error) {
                    newErrors[rule.field] = error;
                    hasErrors = true;
                }
            });

            setErrors(newErrors);
            return !hasErrors;
        },
        [rules, validateField]
    );

    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    const clearFieldError = useCallback((field: keyof T) => {
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }, []);

    const hasFieldError = useCallback(
        (field: keyof T): boolean => {
            return Boolean(errors[field]);
        },
        [errors]
    );

    const isValid = useMemo(() => {
        return Object.keys(errors).length === 0;
    }, [errors]);

    return {
        errors,
        isValid,
        validate,
        validateField,
        clearErrors,
        clearFieldError,
        hasFieldError,
    };
}
