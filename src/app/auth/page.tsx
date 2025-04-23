import React from 'react';
import Auth from '@features/auth/Auth';

const page = () => {
    return (
        <div className='flex flex-col'>
            <div className='bg-white p-8 shadow-md'>
                <h2 className='mx-4 font-montserrat text-2xl font-extrabold text-[#0066FF]'>
                    ✨REVLR
                </h2>
            </div>
            <Auth />
        </div>
    );
};

export default page;
