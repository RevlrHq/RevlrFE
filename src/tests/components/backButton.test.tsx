import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { render } from '../test-utils';
import BackButton from '@features/auth/components/bvn/BackButton';

describe('BackButton', () => {
    const mockOnGoBack = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the back button with icon and text', () => {
        render(<BackButton onGoBack={() => mockOnGoBack()} />);

        expect(screen.getByTestId('lucide-arrow-left')).toBeInTheDocument();

        expect(screen.getByText('Back', { exact: false })).toBeInTheDocument();
    });

    it('calls onGoBack when clicked', () => {
        render(<BackButton onGoBack={mockOnGoBack} />);

        const button = screen.getByRole('button', { name: /back/i });
        fireEvent.click(button);

        expect(mockOnGoBack).toHaveBeenCalledTimes(1);
    });
});
