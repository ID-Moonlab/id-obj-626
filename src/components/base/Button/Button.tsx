"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Button variants following MUI BaseUI design system
const buttonVariants = cva(
    // Base styles
    [
        "inline-flex items-center justify-center",
        "whitespace-nowrap text-sm font-medium",
        "ring-offset-white transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Icon styles
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
    ].join(" "),
    {
        variants: {
            variant: {
                // Primary contained button (MUI default)
                contained:
                    "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950",
                // Secondary contained button
                containedSecondary:
                    "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
                // Outlined button
                outlined:
                    "border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100",
                // Text button (no background)
                text: "text-gray-900 hover:bg-gray-100 active:bg-gray-200",
                // Danger/Destructive button
                danger:
                    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
                // Ghost button (transparent)
                ghost: "hover:bg-gray-100 active:bg-gray-200",
                // Link button
                link: "text-gray-900 underline-offset-4 hover:underline",
            },
            size: {
                // MUI default sizes
                small: "h-8 px-3 rounded",
                medium: "h-10 px-4 rounded-md",
                large: "h-12 px-6 rounded-md",
                // Custom sizes
                xs: "h-7 px-2 rounded text-xs",
                xl: "h-14 px-8 rounded-lg text-base",
                iconSmall: "h-8 w-8 rounded",
                iconMedium: "h-10 w-10 rounded-md",
                iconLarge: "h-12 w-12 rounded-md",
            },
            disableElevation: {
                true: "shadow-none",
                false: "shadow-sm hover:shadow-md",
            },
            fullWidth: {
                true: "w-full",
                false: "",
            },
        },
        defaultVariants: {
            variant: "contained",
            size: "medium",
            disableElevation: false,
            fullWidth: false,
        },
        compoundVariants: [
            // Contained button with elevation (default MUI behavior)
            {
                variant: "contained",
                disableElevation: false,
                className: "shadow-sm hover:shadow-md",
            },
            // Outlined button never has elevation
            {
                variant: "outlined",
                disableElevation: true,
            },
        ],
    }
);

// Extended props interface for MUI BaseUI compatibility
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    /**
     * If true, the button will show a loading spinner and be disabled
     */
    loading?: boolean;
    /**
     * The content to show while loading
     */
    loadingText?: string;
    /**
     * The icon to show while loading
     */
    loadingIndicator?: React.ReactNode;
    /**
     * Start icon
     */
    startIcon?: React.ReactNode;
    /**
     * End icon
     */
    endIcon?: React.ReactNode;
    /**
     * If true, the button will take up the full width of its container
     */
    fullWidth?: boolean;
    /**
     * If true, the button will not have elevation (shadow)
     */
    disableElevation?: boolean;
    /**
     * The component to render as
     * @default "button"
     */
    component?: React.ElementType;
    /**
     * If true, the button will be centered in its container
     */
    centered?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            loading = false,
            loadingText,
            loadingIndicator,
            startIcon,
            endIcon,
            fullWidth,
            disableElevation,
            component,
            centered,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const Comp = component
            ? (component as React.ElementType)
            : "button";

        const isDisabled = disabled || loading;

        // Determine the icon to show during loading
        const defaultLoadingIndicator = (
            <Loader2 className="animate-spin" />
        );

        return (
            <Comp
                className={cn(
                    buttonVariants({
                        variant,
                        size,
                        fullWidth,
                        disableElevation,
                        className,
                    }),
                    centered && "mx-auto",
                    // Loading state styles
                    loading && "cursor-wait",
                    // Gap between icon and text
                    (startIcon || endIcon || loading) && "gap-1.5"
                )}
                ref={ref}
                disabled={isDisabled}
                {...props}
            >
                {loading ? (
                    <>
                        {loadingIndicator ?? defaultLoadingIndicator}
                        {loadingText && (
                            <span className="sr-only">{loadingText}</span>
                        )}
                        {loadingText || children}
                    </>
                ) : (
                    <>
                        {startIcon && (
                            <span className="shrink-0 [&>svg]:size-[1em]">
                                {startIcon}
                            </span>
                        )}
                        {children}
                        {endIcon && (
                            <span className="shrink-0 [&>svg]:size-[1em]">
                                {endIcon}
                            </span>
                        )}
                    </>
                )}
            </Comp>
        );
    }
);

Button.displayName = "Button";

// Convenience sub-components for specific use cases
const ContainedButton = React.forwardRef<
    HTMLButtonElement,
    Omit<ButtonProps, "variant">
>((props, ref) => (
    <Button ref={ref} variant="contained" {...props} />
));
ContainedButton.displayName = "ContainedButton";

const OutlinedButton = React.forwardRef<
    HTMLButtonElement,
    Omit<ButtonProps, "variant">
>((props, ref) => (
    <Button ref={ref} variant="outlined" {...props} />
));
OutlinedButton.displayName = "OutlinedButton";

const TextButton = React.forwardRef<
    HTMLButtonElement,
    Omit<ButtonProps, "variant">
>((props, ref) => <Button ref={ref} variant="text" {...props} />);
TextButton.displayName = "TextButton";

const IconButton = React.forwardRef<
    HTMLButtonElement,
    Omit<ButtonProps, "size" | "variant"> & {
        size?: "small" | "medium" | "large";
        "aria-label": string;
    }
>(({ size = "medium", "aria-label": ariaLabel, children, ...props }, ref) => {
    const sizeClass =
        {
            small: "h-8 w-8",
            medium: "h-10 w-10",
            large: "h-12 w-12",
        }[size] || "h-10 w-10";

    return (
        <Button
            ref={ref}
            variant="text"
            size="icon"
            className={cn(sizeClass, "rounded-full")}
            aria-label={ariaLabel}
            {...props}
        >
            {children}
        </Button>
    );
});
IconButton.displayName = "IconButton";

// Export all button variants and utilities
export {
    Button,
    ContainedButton,
    OutlinedButton,
    TextButton,
    IconButton,
    buttonVariants,
};

export type { ButtonProps };
