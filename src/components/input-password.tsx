import { useState, forwardRef, ChangeEventHandler } from 'react';

import { EyeIcon, EyeOff } from 'lucide-react';

import { Input } from '@components/ui/input';

interface IPasswordInputProps {
    placeholder: string;
    onChange?: ChangeEventHandler<HTMLInputElement>;
}

const InputPassword = forwardRef<HTMLInputElement, IPasswordInputProps>(
    ({ placeholder, onChange, ...props }, ref) => {
        const [isVisible, setIsVisible] = useState<boolean>(false);

        const toggleVisibility = () => setIsVisible(!isVisible);

        return (
            <div className='relative'>
                <Input
                    type={isVisible ? 'text' : 'password'}
                    placeholder={placeholder}
                    onChange={onChange}
                    {...props}
                    ref={ref}
                />
                {isVisible ? (
                    <EyeIcon
                        className='absolute right-4 top-1/2 ml-auto size-5 -translate-y-1/2 cursor-pointer text-[#ACACAC]'
                        onClick={toggleVisibility}
                    />
                ) : (
                    <EyeOff
                        className='absolute right-4 top-1/2 ml-auto size-5 -translate-y-1/2 cursor-pointer text-[#ACACAC]'
                        onClick={toggleVisibility}
                    />
                )}
            </div>
        );
    }
);
InputPassword.displayName = 'InputPassword';

export default InputPassword;
