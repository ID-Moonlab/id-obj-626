import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "bg-black text-white hover:bg-black/90",
                destructive: "bg-black text-white hover:bg-black/90",
                outline:
                    "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
                secondary: "bg-gray-100 text-gray-900 hover:bg-gray/90",
                ghost: "hover:bg-gray-100",
                link: "text-gray-900 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
    startContent?: React.ReactNode;
    endContent?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            loading = false,
            startContent,
            endContent,
            disabled,
            children,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : "button";
        const isDisabled = disabled || loading;

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isDisabled}
                {...props}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {children}
                    </>
                ) : startContent || endContent ? (
                    <>
                        {startContent && (
                            <span className="flex-shrink-0">
                                {startContent}
                            </span>
                        )}
                        {children}
                        {endContent && (
                            <span className="flex-shrink-0">{endContent}</span>
                        )}
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };
