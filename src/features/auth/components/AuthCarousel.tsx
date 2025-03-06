'use client';

import { useState, useEffect } from 'react';

import SignUpPhoto from '~/public/assets/images/sign-up.svg';

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselApi,
} from '@components/ui/carousel';
import Image from 'next/image';

const SLIDES = [
    {
        title: 'Aggregated Banking',
        illustration: SignUpPhoto,
        description:
            'Connect all your bank accounts, mobile money services, and other financial accounts in one place.',
    },
    {
        title: 'Slide 2',
        illustration: SignUpPhoto,
        description: 'Second slide content',
    },
    {
        title: 'Slide 3',
        illustration: SignUpPhoto,
        description: 'Third slide content',
    },
];

export default function AuthCarousel() {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!api) {
            return;
        }

        setCurrent(api.selectedScrollSnap() + 1);

        api.on('select', () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const scrollToIndex = (index: number) => {
        api?.scrollTo(index);
    };

    return (
        <Carousel
            setApi={setApi}
            opts={{
                loop: true,
            }}
            className='w-full max-w-xs'
        >
            <CarouselContent>
                {SLIDES.map(({ title, illustration, description }, index) => (
                    <CarouselItem key={index}>
                        <div className='space-y-5 p-1'>
                            <div className='flex items-center justify-center'>
                                <Image
                                    src={illustration}
                                    alt='a phone screen screen showing a list of banks'
                                    className='h-[282px] w-[213px] sm:w-full'
                                />
                            </div>
                            {/* Navigation dots */}
                            <div className='mt-4 flex items-center justify-center space-x-2'>
                                {SLIDES.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-2 rounded-xl transition-all duration-300 ${
                                            current === index + 1
                                                ? 'w-10 bg-[#8D7BE0]'
                                                : 'w-2.5 bg-chit-milk-white'
                                        }`}
                                        onClick={() => scrollToIndex(index)}
                                    />
                                ))}
                            </div>
                            <Card className='border-none bg-transparent text-chit-milk-white shadow-none'>
                                <CardHeader className='space-y-3 p-0 text-center'>
                                    <CardTitle className='text-lg font-medium'>
                                        {title}
                                    </CardTitle>
                                    <CardDescription className='text-sm font-normal text-chit-link-water'>
                                        {description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
