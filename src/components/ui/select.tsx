'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@lib/utils';

export interface SelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}

export interface SelectItemProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

const SelectContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}>({
    isOpen: false,
    setIsOpen: () => {},
});

const Select: React.FC<SelectProps> = ({
    value,
    onValueChange,
    // placeholder: _placeholder,
    // disabled: _disabled = false,
    className,
    children,
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <SelectContext.Provider
            value={{ value, onValueChange, isOpen, setIsOpen }}
        >
            <div className={cn('relative', className)}>{children}</div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { placeholder?: string }
>(({ className, placeholder, children, ...props }, ref) => {
    const {
        // value: _value,
        isOpen,
        setIsOpen,
    } = React.useContext(SelectContext);

    return (
        <button
            ref={ref}
            type='button'
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        >
            <span>{children || placeholder}</span>
            <ChevronDown className='size-4 opacity-50' />
        </button>
    );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
    const { value } = React.useContext(SelectContext);
    return <>{value || placeholder}</>;
};

const SelectContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { isOpen } = React.useContext(SelectContext);

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className={cn(
                'absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & SelectItemProps
>(({ className, value, children, ...props }, ref) => {
    const { onValueChange, setIsOpen } = React.useContext(SelectContext);

    const handleClick = () => {
        onValueChange?.(value);
        setIsOpen(false);
    };

    return (
        <div
            ref={ref}
            onClick={handleClick}
            className={cn(
                'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
