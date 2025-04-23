import React from 'react';
import Signin from '@features/auth/Signin';

const page = () => {
    return (
        <div className='flex flex-col'>
            <div className='bg-white p-8 shadow-md'>
                <h2 className='mx-4 font-montserrat text-2xl font-extrabold text-[#0066FF]'>
                    ✨REVLR
                </h2>
            </div>
            <Signin />
        </div>
    );
};

export default page;
