import { render, screen } from '@testing-library/react';
import {
    SettingsCard,
    SettingsSection,
    SaveButton,
    LoadingSpinner,
    ErrorMessage,
} from '../components';

describe('Settings Shared Components', () => {
    describe('SettingsCard', () => {
        it('renders with title and children', () => {
            render(
                <SettingsCard title='Test Card'>
                    <div>Test content</div>
                </SettingsCard>
            );

            expect(screen.getByText('Test Card')).toBeInTheDocument();
            expect(screen.getByText('Test content')).toBeInTheDocument();
        });

        it('renders with description', () => {
            render(
                <SettingsCard title='Test Card' description='Test description'>
                    <div>Test content</div>
                </SettingsCard>
            );

            expect(screen.getByText('Test description')).toBeInTheDocument();
        });
    });

    describe('SettingsSection', () => {
        it('renders children without title', () => {
            render(
                <SettingsSection>
                    <div>Section content</div>
                </SettingsSection>
            );

            expect(screen.getByText('Section content')).toBeInTheDocument();
        });

        it('renders with title', () => {
            render(
                <SettingsSection title='Section Title'>
                    <div>Section content</div>
                </SettingsSection>
            );

            expect(screen.getByText('Section Title')).toBeInTheDocument();
        });
    });

    describe('SaveButton', () => {
        it('renders with default text', () => {
            render(<SaveButton />);
            expect(screen.getByText('Save Changes')).toBeInTheDocument();
        });

        it('renders with custom text', () => {
            render(<SaveButton>Custom Save</SaveButton>);
            expect(screen.getByText('Custom Save')).toBeInTheDocument();
        });

        it('shows loading state', () => {
            render(<SaveButton isLoading>Save</SaveButton>);
            expect(screen.getByRole('button')).toBeDisabled();
        });
    });

    describe('LoadingSpinner', () => {
        it('renders spinner', () => {
            render(<LoadingSpinner />);
            expect(screen.getByRole('generic')).toBeInTheDocument();
        });

        it('renders with text', () => {
            render(<LoadingSpinner text='Loading...' />);
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
    });

    describe('ErrorMessage', () => {
        it('renders error message', () => {
            render(<ErrorMessage message='Test error' />);
            expect(screen.getByText('Test error')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });

        it('renders dismiss button when onDismiss provided', () => {
            const onDismiss = jest.fn();
            render(<ErrorMessage message='Test error' onDismiss={onDismiss} />);
            expect(screen.getByLabelText('Dismiss error')).toBeInTheDocument();
        });
    });
});
