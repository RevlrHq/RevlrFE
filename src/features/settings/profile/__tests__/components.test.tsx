import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from '../components/ProfileForm';
import { AvatarUpload } from '../components/AvatarUpload';
import { ContactInformation } from '../components/ContactInformation';
import { PersonalDetails } from '../components/PersonalDetails';

// Mock the profile store
jest.mock('../../stores/profileStore', () => ({
    useProfileStore: () => ({
        updateProfile: jest.fn(),
        isUpdating: false,
        validationErrors: {},
        setDirty: jest.fn(),
    }),
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
    Input: ({ className, ...props }: any) => (
        <input className={className} {...props} />
    ),
}));

jest.mock('@/components/ui/label', () => ({
    Label: ({ children, ...props }: any) => (
        <label {...props}>{children}</label>
    ),
}));

jest.mock('@/components/ui/textarea', () => ({
    Textarea: ({ className, ...props }: any) => (
        <textarea className={className} {...props} />
    ),
}));

jest.mock('@/components/ui/card', () => ({
    Card: ({ children, className }: any) => (
        <div className={className}>{children}</div>
    ),
    CardContent: ({ children, className }: any) => (
        <div className={className}>{children}</div>
    ),
}));

jest.mock('@/components/ui/alert', () => ({
    Alert: ({ children, variant, className }: any) => (
        <div className={`alert ${variant} ${className}`}>{children}</div>
    ),
    AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('lucide-react', () => ({
    AlertCircle: () => <div data-testid='alert-circle' />,
    Upload: () => <div data-testid='upload-icon' />,
    X: () => <div data-testid='x-icon' />,
    User: () => <div data-testid='user-icon' />,
}));

describe('Profile Components', () => {
    describe('ProfileForm', () => {
        const defaultProps = {
            organizationData: {
                organizationName: 'Test Org',
                organizationWebsite: 'https://test.com',
            },
        };

        it('renders with organization data', () => {
            render(<ProfileForm {...defaultProps} />);

            expect(screen.getByDisplayValue('Test Org')).toBeInTheDocument();
            expect(
                screen.getByDisplayValue('https://test.com')
            ).toBeInTheDocument();
        });

        it('renders empty form when no organization data', () => {
            render(<ProfileForm organizationData={{}} />);

            const nameInput = screen.getByPlaceholderText(
                'Enter your organization name'
            );
            const websiteInput = screen.getByPlaceholderText(
                'https://example.com'
            );

            expect(nameInput).toHaveValue('');
            expect(websiteInput).toHaveValue('');
        });

        it('validates organization name length', async () => {
            const user = userEvent.setup();
            render(<ProfileForm organizationData={{}} />);

            const nameInput = screen.getByPlaceholderText(
                'Enter your organization name'
            );
            const longName = 'A'.repeat(101);

            await user.type(nameInput, longName);
            await user.tab(); // Trigger validation

            await waitFor(() => {
                expect(
                    screen.getByText(
                        'Organization name must be less than 100 characters'
                    )
                ).toBeInTheDocument();
            });
        });

        it('validates website URL format', async () => {
            const user = userEvent.setup();
            render(<ProfileForm organizationData={{}} />);

            const websiteInput = screen.getByPlaceholderText(
                'https://example.com'
            );

            await user.type(websiteInput, 'invalid-url');
            await user.tab(); // Trigger validation

            await waitFor(() => {
                expect(
                    screen.getByText('Please enter a valid website URL')
                ).toBeInTheDocument();
            });
        });

        it('accepts valid website URLs', async () => {
            const user = userEvent.setup();
            render(<ProfileForm organizationData={{}} />);

            const websiteInput = screen.getByPlaceholderText(
                'https://example.com'
            );

            await user.type(websiteInput, 'https://valid-site.com');
            await user.tab();

            // Should not show validation error
            expect(
                screen.queryByText('Please enter a valid website URL')
            ).not.toBeInTheDocument();
        });

        it('shows save button only when form has changes', async () => {
            const user = userEvent.setup();
            render(<ProfileForm {...defaultProps} />);

            // Initially no save button
            expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();

            // Make a change
            const nameInput = screen.getByDisplayValue('Test Org');
            await user.clear(nameInput);
            await user.type(nameInput, 'Updated Org');

            await waitFor(() => {
                expect(screen.getByText('Save Changes')).toBeInTheDocument();
            });
        });

        it('handles form submission', async () => {
            const user = userEvent.setup();
            const mockUpdateProfile = jest.fn();

            // Mock the store with our mock function
            jest.doMock('../../stores/profileStore', () => ({
                useProfileStore: () => ({
                    updateProfile: mockUpdateProfile,
                    isUpdating: false,
                    validationErrors: {},
                    setDirty: jest.fn(),
                }),
            }));

            render(<ProfileForm organizationData={{}} />);

            const nameInput = screen.getByPlaceholderText(
                'Enter your organization name'
            );
            await user.type(nameInput, 'New Org');

            const form = nameInput.closest('form');
            if (form) {
                fireEvent.submit(form);
            }

            await waitFor(() => {
                expect(mockUpdateProfile).toHaveBeenCalledWith({
                    organization: 'New Org',
                    website: '',
                });
            });
        });
    });

    describe('AvatarUpload', () => {
        const defaultProps = {
            currentAvatar: 'https://example.com/avatar.jpg',
            onUpload: jest.fn(),
            onRemove: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders current avatar when provided', () => {
            render(<AvatarUpload {...defaultProps} />);

            const avatar = screen.getByRole('img');
            expect(avatar).toHaveAttribute(
                'src',
                'https://example.com/avatar.jpg'
            );
        });

        it('renders placeholder when no avatar', () => {
            render(
                <AvatarUpload {...defaultProps} currentAvatar={undefined} />
            );

            expect(screen.getByTestId('user-icon')).toBeInTheDocument();
        });

        it('handles file upload', async () => {
            const user = userEvent.setup();
            const mockOnUpload = jest.fn().mockResolvedValue('new-avatar-url');

            render(<AvatarUpload {...defaultProps} onUpload={mockOnUpload} />);

            const fileInput = screen.getByLabelText(/upload avatar/i);
            const file = new File(['avatar'], 'avatar.jpg', {
                type: 'image/jpeg',
            });

            await user.upload(fileInput, file);

            expect(mockOnUpload).toHaveBeenCalledWith(file);
        });

        it('shows loading state during upload', () => {
            render(<AvatarUpload {...defaultProps} isLoading={true} />);

            expect(screen.getByText('Uploading...')).toBeInTheDocument();
        });

        it('handles avatar removal', async () => {
            const user = userEvent.setup();
            const mockOnRemove = jest.fn();

            render(<AvatarUpload {...defaultProps} onRemove={mockOnRemove} />);

            const removeButton = screen.getByLabelText(/remove avatar/i);
            await user.click(removeButton);

            expect(mockOnRemove).toHaveBeenCalled();
        });

        it('validates file type', async () => {
            const user = userEvent.setup();
            const mockOnUpload = jest.fn();

            render(<AvatarUpload {...defaultProps} onUpload={mockOnUpload} />);

            const fileInput = screen.getByLabelText(/upload avatar/i);
            const file = new File(['document'], 'document.pdf', {
                type: 'application/pdf',
            });

            await user.upload(fileInput, file);

            expect(
                screen.getByText(/please select a valid image file/i)
            ).toBeInTheDocument();
            expect(mockOnUpload).not.toHaveBeenCalled();
        });

        it('validates file size', async () => {
            const user = userEvent.setup();
            const mockOnUpload = jest.fn();

            render(<AvatarUpload {...defaultProps} onUpload={mockOnUpload} />);

            const fileInput = screen.getByLabelText(/upload avatar/i);
            // Create a large file (> 5MB)
            const largeFile = new File(
                ['x'.repeat(6 * 1024 * 1024)],
                'large.jpg',
                {
                    type: 'image/jpeg',
                }
            );

            await user.upload(fileInput, largeFile);

            expect(
                screen.getByText(/file size must be less than 5mb/i)
            ).toBeInTheDocument();
            expect(mockOnUpload).not.toHaveBeenCalled();
        });
    });

    describe('ContactInformation', () => {
        const defaultProps = {
            contactData: {
                email: 'test@example.com',
                phoneNumber: '+1234567890',
            },
            onSave: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders contact information', () => {
            render(<ContactInformation {...defaultProps} />);

            expect(
                screen.getByDisplayValue('test@example.com')
            ).toBeInTheDocument();
            expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
        });

        it('validates email format', async () => {
            const user = userEvent.setup();
            render(<ContactInformation {...defaultProps} />);

            const emailInput = screen.getByDisplayValue('test@example.com');
            await user.clear(emailInput);
            await user.type(emailInput, 'invalid-email');
            await user.tab();

            await waitFor(() => {
                expect(
                    screen.getByText(/please enter a valid email address/i)
                ).toBeInTheDocument();
            });
        });

        it('validates phone number format', async () => {
            const user = userEvent.setup();
            render(<ContactInformation {...defaultProps} />);

            const phoneInput = screen.getByDisplayValue('+1234567890');
            await user.clear(phoneInput);
            await user.type(phoneInput, '123');
            await user.tab();

            await waitFor(() => {
                expect(
                    screen.getByText(/phone number must be at least 10 digits/i)
                ).toBeInTheDocument();
            });
        });

        it('handles form submission', async () => {
            const user = userEvent.setup();
            const mockOnSave = jest.fn();

            render(
                <ContactInformation {...defaultProps} onSave={mockOnSave} />
            );

            const emailInput = screen.getByDisplayValue('test@example.com');
            await user.clear(emailInput);
            await user.type(emailInput, 'new@example.com');

            const saveButton = screen.getByText('Save Changes');
            await user.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith({
                email: 'new@example.com',
                phoneNumber: '+1234567890',
            });
        });
    });

    describe('PersonalDetails', () => {
        const defaultProps = {
            personalData: {
                firstName: 'John',
                lastName: 'Doe',
                bio: 'Test bio',
            },
            onSave: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders personal details', () => {
            render(<PersonalDetails {...defaultProps} />);

            expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
        });

        it('validates required fields', async () => {
            const user = userEvent.setup();
            render(<PersonalDetails {...defaultProps} />);

            const firstNameInput = screen.getByDisplayValue('John');
            await user.clear(firstNameInput);
            await user.tab();

            await waitFor(() => {
                expect(
                    screen.getByText(/first name is required/i)
                ).toBeInTheDocument();
            });
        });

        it('validates name length', async () => {
            const user = userEvent.setup();
            render(<PersonalDetails {...defaultProps} />);

            const firstNameInput = screen.getByDisplayValue('John');
            await user.clear(firstNameInput);
            await user.type(firstNameInput, 'A'.repeat(51));
            await user.tab();

            await waitFor(() => {
                expect(
                    screen.getByText(/name cannot exceed 50 characters/i)
                ).toBeInTheDocument();
            });
        });

        it('validates bio length', async () => {
            const user = userEvent.setup();
            render(<PersonalDetails {...defaultProps} />);

            const bioInput = screen.getByDisplayValue('Test bio');
            await user.clear(bioInput);
            await user.type(bioInput, 'A'.repeat(501));
            await user.tab();

            await waitFor(() => {
                expect(
                    screen.getByText(/bio cannot exceed 500 characters/i)
                ).toBeInTheDocument();
            });
        });

        it('handles form submission', async () => {
            const user = userEvent.setup();
            const mockOnSave = jest.fn();

            render(<PersonalDetails {...defaultProps} onSave={mockOnSave} />);

            const firstNameInput = screen.getByDisplayValue('John');
            await user.clear(firstNameInput);
            await user.type(firstNameInput, 'Jane');

            const saveButton = screen.getByText('Save Changes');
            await user.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith({
                firstName: 'Jane',
                lastName: 'Doe',
                bio: 'Test bio',
            });
        });
    });
});
