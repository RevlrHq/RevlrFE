import {
    validateEmail,
    validatePhoneNumber,
    validateName,
    validateUrl,
    validatePassword,
} from '../utils/validation';

describe('Validation Utils', () => {
    describe('validateEmail', () => {
        it('returns null for valid emails', () => {
            expect(validateEmail('test@example.com')).toBeNull();
            expect(validateEmail('user.name+tag@domain.co.uk')).toBeNull();
        });

        it('returns error for invalid emails', () => {
            expect(validateEmail('invalid')).toBe(
                'Please enter a valid email address'
            );
            expect(validateEmail('test@')).toBe(
                'Please enter a valid email address'
            );
            expect(validateEmail('@domain.com')).toBe(
                'Please enter a valid email address'
            );
        });

        it('returns null for empty string', () => {
            expect(validateEmail('')).toBeNull();
        });
    });

    describe('validatePhoneNumber', () => {
        it('returns null for valid phone numbers', () => {
            expect(validatePhoneNumber('1234567890')).toBeNull();
            expect(validatePhoneNumber('+1 (555) 123-4567')).toBeNull();
            expect(validatePhoneNumber('555.123.4567')).toBeNull();
        });

        it('returns error for too short numbers', () => {
            expect(validatePhoneNumber('123456789')).toBe(
                'Phone number must be at least 10 digits'
            );
        });

        it('returns error for too long numbers', () => {
            expect(validatePhoneNumber('1234567890123456')).toBe(
                'Phone number cannot exceed 15 digits'
            );
        });

        it('returns null for empty string', () => {
            expect(validatePhoneNumber('')).toBeNull();
        });
    });

    describe('validateName', () => {
        it('returns null for valid names', () => {
            expect(validateName('John')).toBeNull();
            expect(validateName('Mary-Jane')).toBeNull();
            expect(validateName("O'Connor")).toBeNull();
            expect(validateName('Jean Pierre')).toBeNull();
        });

        it('returns error for too short names', () => {
            expect(validateName('A')).toBe(
                'Name must be at least 2 characters long'
            );
        });

        it('returns error for too long names', () => {
            const longName = 'A'.repeat(51);
            expect(validateName(longName)).toBe(
                'Name cannot exceed 50 characters'
            );
        });

        it('returns error for invalid characters', () => {
            expect(validateName('John123')).toBe(
                'Name can only contain letters, spaces, hyphens, and apostrophes'
            );
            expect(validateName('John@Doe')).toBe(
                'Name can only contain letters, spaces, hyphens, and apostrophes'
            );
        });

        it('returns null for empty string', () => {
            expect(validateName('')).toBeNull();
        });
    });

    describe('validateUrl', () => {
        it('returns null for valid URLs', () => {
            expect(validateUrl('https://example.com')).toBeNull();
            expect(validateUrl('http://subdomain.example.com/path')).toBeNull();
            expect(
                validateUrl('https://example.com:8080/path?query=value')
            ).toBeNull();
        });

        it('returns error for invalid URLs', () => {
            expect(validateUrl('not-a-url')).toBe('Please enter a valid URL');
            expect(validateUrl('ftp://example.com')).toBeNull(); // URL constructor accepts ftp
            expect(validateUrl('example.com')).toBe('Please enter a valid URL');
        });

        it('returns null for empty string', () => {
            expect(validateUrl('')).toBeNull();
        });
    });

    describe('validatePassword', () => {
        it('returns null for valid passwords', () => {
            expect(validatePassword('Password123!')).toBeNull();
            expect(validatePassword('MySecure@Pass1')).toBeNull();
        });

        it('returns error for too short passwords', () => {
            expect(validatePassword('Pass1!')).toBe(
                'Password must be at least 8 characters long'
            );
        });

        it('returns error for too long passwords', () => {
            const longPassword = 'A'.repeat(129);
            expect(validatePassword(longPassword)).toBe(
                'Password cannot exceed 128 characters'
            );
        });

        it('returns error for missing requirements', () => {
            const errorMessage =
                'Password must contain uppercase, lowercase, number, and special character';

            expect(validatePassword('password123!')).toBe(errorMessage); // no uppercase
            expect(validatePassword('PASSWORD123!')).toBe(errorMessage); // no lowercase
            expect(validatePassword('Password!')).toBe(errorMessage); // no number
            expect(validatePassword('Password123')).toBe(errorMessage); // no special char
        });

        it('returns null for empty string', () => {
            expect(validatePassword('')).toBeNull();
        });
    });
});
