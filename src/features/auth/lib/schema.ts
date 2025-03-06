import * as yup from 'yup';

export const signUpWithBVN = yup.object().shape({
    bvn: yup
        .string()
        .min(15, 'BVN must be at least 15 digits')
        .required('BVN is required'),
});

export const OTPSchema = yup.object().shape({
    otp: yup
        .string()
        .min(6, {
            message: 'Your one-time password must be 5 characters.',
        })
        .required(),
});

export const signUpWithEmail = yup.object().shape({
    surname: yup.string().trim().required('Surname is required'),
    firstName: yup.string().trim().required('first name is required'),
    otherName: yup.string().trim().optional(),
    email: yup.string().email().trim().required(),
    phoneNumber: yup
        .string()
        .min(11, 'phone number must be 11 digits')
        .required('phone number is required'),

    password: yup
        .string()
        .trim()
        .required('Password is required')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/\d/, 'Password must contain at least one number')
        .matches(
            /[\W_]/,
            'Password must contain at least one special character'
        ),
    confirmPassword: yup
        .string()
        .trim()
        .oneOf([yup.ref('password')], 'Password should match')
        .required('Confirm password is required'),
    referral: yup.string().optional(),
});

export const loginSchema = yup.object().shape({
    email: yup
        .string()
        .email()
        .required('Email, user ID or phone number is required'),
    password: yup.string().required('Password is required'),
    stayLoggedIn: yup.boolean().optional(),
});

export const forgotPasswordSchema = yup.object().shape({
    email: yup.string().email().required(),
});

export const passwordResetSchema = yup.object().shape({
    email: yup.string().email().optional(),
    resetCode: yup.string().optional(),
    newPassword: yup
        .string()
        .trim()
        .required('Password is required')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/\d/, 'Password must contain at least one number')
        .matches(
            /[\W_]/,
            'Password must contain at least one special character'
        ),
    // confirmPassword: yup
    //     .string()
    //     .trim()
    //     .oneOf([yup.ref('password')], 'Password should match')
    //     .required('Confirm password is required'),
});
