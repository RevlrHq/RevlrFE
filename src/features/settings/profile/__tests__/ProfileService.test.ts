import { ProfileService } from '../../services/ProfileService';

describe('ProfileService', () => {
    let profileService: ProfileService;

    beforeEach(() => {
        profileService = new ProfileService();
    });

    describe('validateProfileUpdate', () => {
        it('should validate first name correctly', () => {
            expect(() => {
                (profileService as any).validateProfileUpdate({
                    firstName: '',
                });
            }).toThrow('Validation failed');
        });

        it('should validate last name correctly', () => {
            expect(() => {
                (profileService as any).validateProfileUpdate({
                    lastName: 'a',
                });
            }).toThrow('Validation failed');
        });

        it('should validate phone number correctly', () => {
            expect(() => {
                (profileService as any).validateProfileUpdate({
                    phoneNumber: '123',
                });
            }).toThrow('Validation failed');
        });

        it('should validate bio length', () => {
            expect(() => {
                (profileService as any).validateProfileUpdate({
                    bio: 'a'.repeat(501),
                });
            }).toThrow('Validation failed');
        });

        it('should validate organization name length', () => {
            expect(() => {
                (profileService as any).validateProfileUpdate({
                    organizationName: 'a'.repeat(101),
                });
            }).toThrow('Validation failed');
        });

        it('should validate website URL', () => {
            expect(() => {
                (profileService as any).validateProfileUpdate({
                    organizationWebsite: 'not a url at all',
                });
            }).toThrow('Validation failed');
        });

        it('should pass valid data', () => {
            expect(() => {
                (profileService as any).validateProfileUpdate({
                    firstName: 'John',
                    lastName: 'Doe',
                    phoneNumber: '1234567890',
                    bio: 'Valid bio',
                    organizationName: 'Valid Org',
                    organizationWebsite: 'https://example.com',
                });
            }).not.toThrow();
        });
    });

    describe('validateAvatarFile', () => {
        it('should validate file type', () => {
            const invalidFile = new File([''], 'test.txt', {
                type: 'text/plain',
            });

            expect(() => {
                (profileService as any).validateAvatarFile(invalidFile);
            }).toThrow('Please upload a JPEG, PNG, or WebP image');
        });

        it('should validate file size', () => {
            const largeFile = new File(
                ['x'.repeat(6 * 1024 * 1024)],
                'test.jpg',
                {
                    type: 'image/jpeg',
                }
            );

            expect(() => {
                (profileService as any).validateAvatarFile(largeFile);
            }).toThrow('Image must be smaller than 5MB');
        });

        it('should validate empty file', () => {
            const emptyFile = new File([''], 'test.jpg', {
                type: 'image/jpeg',
            });

            expect(() => {
                (profileService as any).validateAvatarFile(emptyFile);
            }).toThrow('Please select a valid image file');
        });

        it('should pass valid file', () => {
            const validFile = new File(['valid content'], 'test.jpg', {
                type: 'image/jpeg',
            });

            expect(() => {
                (profileService as any).validateAvatarFile(validFile);
            }).not.toThrow();
        });
    });
});
