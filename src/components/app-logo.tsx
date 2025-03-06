import Image from 'next/image';
import Link from 'next/link';

import ChitLogo from '~/public/chit.svg';
import ChitIcon from '~/public/chit-icon.svg';

interface IAppLogoProps {
    isIcon?: boolean;
}
export default function AppLogo({ isIcon }: IAppLogoProps) {
    return (
        <Link href='/' aria-label='link to homepage'>
            <Image
                priority
                src={isIcon ? ChitIcon : ChitLogo}
                alt={isIcon ? 'Chit brand icon' : 'Chit brand logo'}
                className={`${isIcon ? 'w-12' : 'w-28 lg:w-36'}`}
            />
        </Link>
    );
}
