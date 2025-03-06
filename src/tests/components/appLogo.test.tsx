import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { render } from '../test-utils';
import AppLogo from '@components/app-logo';

jest.mock('next/link', () => {
    return ({
        children,
        href,
    }: {
        children: React.ReactNode;
        href: string;
    }) => <a href={href}>{children}</a>;
});

jest.mock(
    'next/image',
    () => (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        // const { ...rest } = props;
        return <img {...props} />;
    }
);

describe('AppLogo', () => {
    it('renders the logo', () => {
        const { container } = render(<AppLogo />);
        const logo = screen.getByAltText('Chit brand logo');

        expect(logo).toBeInTheDocument();

        expect(container).toMatchSnapshot();
    });

    it('renders the icon when isIcon is true', () => {
        render(<AppLogo isIcon={true} />);

        const icon = screen.getByAltText('Chit brand icon');
        expect(icon).toBeInTheDocument();
    });

    it("wraps the image in a link pointing to '/'", async () => {
        render(<AppLogo />);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/');
    });
});
