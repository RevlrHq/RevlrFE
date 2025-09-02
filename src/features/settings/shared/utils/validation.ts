// Email validation
export const validateEmail = (email: string): string | null => {
    if (!email) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }

    return null;
};

// Phone number validation
export const validatePhoneNumber = (phone: string): string | null => {
    if (!phone) return null;

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
        return 'Phone number must be at least 10 digits';
    }

    if (digitsOnly.length > 15) {
        return 'Phone number cannot exceed 15 digits';
    }

    return null;
};

// Name validation
export const validateName = (name: string): string | null => {
    if (!name) return null;

    if (name.length < 2) {
        return 'Name must be at least 2 characters long';
    }

    if (name.length > 50) {
        return 'Name cannot exceed 50 characters';
    }

    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name)) {
        return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }

    return null;
};

// URL validation
export const validateUrl = (url: string): string | null => {
    if (!url) return null;

    try {
        new URL(url);
        return null;
    } catch {
        return 'Please enter a valid URL';
    }
};

// Password validation with enhanced security checks
export const validatePassword = (password: string): string | null => {
    if (!password) return null;

    if (password.length < 8) {
        return 'Password must be at least 8 characters long';
    }

    if (password.length > 128) {
        return 'Password cannot exceed 128 characters';
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        return 'Password must contain uppercase, lowercase, number, and special character';
    }

    // Check for common weak patterns
    const weakPatterns = [
        /(.)\1{2,}/, // Repeated characters (aaa, 111)
        /123456|654321|qwerty|password|admin/i, // Common sequences
        /^[a-z]+$/i, // Only letters
        /^\d+$/, // Only numbers
    ];

    if (weakPatterns.some((pattern) => pattern.test(password))) {
        return 'Password contains weak patterns. Please choose a stronger password';
    }

    return null;
};

// Enhanced input validation with security checks
export const validateSecureInput = (
    input: string,
    maxLength: number = 255
): string | null => {
    if (!input) return null;

    // Check for malicious patterns
    const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /eval\(/i,
        /expression\(/i,
        /vbscript:/i,
        /data:text\/html/i,
    ];

    if (maliciousPatterns.some((pattern) => pattern.test(input))) {
        return 'Input contains potentially malicious content';
    }

    if (input.length > maxLength) {
        return `Input cannot exceed ${maxLength} characters`;
    }

    return null;
};

// Validate file uploads for security
export const validateFileUpload = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        return 'Only JPEG, PNG, GIF, and WebP images are allowed';
    }

    if (file.size > maxSize) {
        return 'File size cannot exceed 5MB';
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
        /\.php$/i,
        /\.exe$/i,
        /\.bat$/i,
        /\.cmd$/i,
        /\.scr$/i,
        /\.js$/i,
        /\.html$/i,
        /\.htm$/i,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
        return 'File type not allowed for security reasons';
    }

    return null;
};
