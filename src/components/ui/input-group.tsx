"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputGroupProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    startContent?: React.ReactNode;
    endContent?: React.ReactNode;
    classNames?: {
        base?: string;
        input?: string;
        inputWrapper?: string;
    };
}

const InputGroup = React.forwardRef<HTMLInputElement, InputGroupProps>(
    (
        {
            className,
            type,
            startContent,
            endContent,
            classNames,
            ...props
        },
        ref,
    ) => {
        return (
            <div
                className={cn(
                    "relative flex items-center w-full",
                    classNames?.base,
                    className,
                )}
            >
                {startContent && (
                    <div className="absolute left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {startContent}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                        startContent && "pl-10",
                        endContent && "pr-10",
                        classNames?.input,
                        classNames?.inputWrapper,
                    )}
                    ref={ref}
                    {...props}
                />
                {endContent && (
                    <div className="absolute right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                        {endContent}
                    </div>
                )}
            </div>
        );
    },
);
InputGroup.displayName = "InputGroup";

export { InputGroup };
