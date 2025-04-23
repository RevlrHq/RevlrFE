import React from 'react';
import Login from '@features/auth/Login';

const page = () => {
    return (
        <div className='flex flex-col'>
            <div className='bg-white p-8 shadow-md'>
                <h2 className='mx-4 font-montserrat text-2xl font-extrabold text-revlr-primary-blue'>
                    ✨REVLR
                </h2>
            </div>
            <Login />
        </div>
    );
};

export default page;
