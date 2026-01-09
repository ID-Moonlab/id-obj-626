"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

// HeroUI-compatible Modal component
interface ModalProps {
    isOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onClose?: () => void;
    children?: React.ReactNode;
    [key: string]: any;
}

const Modal = ({
    isOpen,
    open = isOpen,
    onOpenChange,
    onClose,
    children,
    ...props
}: ModalProps) => {
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && onClose) {
            onClose();
        }
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
            {children}
        </DialogPrimitive.Root>
    );
};

const ModalTrigger = DialogPrimitive.Trigger;

const ModalPortal = DialogPrimitive.Portal;

const ModalClose = DialogPrimitive.Close;

const ModalOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
        variant?: "default" | "destructive";
    }
>(({ className, variant = "default", ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 backdrop-blur-md transition-all duration-300",
            variant === "destructive" ? "bg-red-900/40" : "bg-gray-900/70",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className,
        )}
        {...props}
    />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ModalContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
        size?: "sm" | "md" | "lg" | "xl" | "full";
        showClose?: boolean;
    }
>(({ className, children, size = "md", showClose = true, ...props }, ref) => {
    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[90vw]",
    };

    return (
        <ModalPortal>
            <ModalOverlay />
            <DialogPrimitive.Content
                ref={ref}
                className={cn(
                    // 核心居中定位
                    "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
                    // 尺寸和样式
                    sizeClasses[size],
                    "rounded-3xl bg-white border border-gray-200 shadow-2xl",
                    // 动画效果
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
                    "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
                    // 过渡动画
                    "transition-all duration-300 ease-out",
                    className,
                )}
                {...props}
            >
                {children}
                {showClose && (
                    <DialogPrimitive.Close
                        className={cn(
                            "absolute right-4 top-4 z-10 rounded-xl p-2",
                            "text-gray-400 hover:text-gray-600",
                            "hover:bg-gray-100 transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
                            "disabled:pointer-events-none",
                        )}
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">关闭</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </ModalPortal>
    );
});
ModalContent.displayName = DialogPrimitive.Content.displayName;

const ModalHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("flex flex-col space-y-2 px-8 pt-8", className)}
        {...props}
    />
);
ModalHeader.displayName = "ModalHeader";

const ModalBody = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-8 py-6", className)} {...props} />
);
ModalBody.displayName = "ModalBody";

const ModalFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 px-8 py-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl",
            className,
        )}
        {...props}
    />
);
ModalFooter.displayName = "ModalFooter";

const ModalTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            "text-xl font-bold text-gray-900 tracking-tight",
            className,
        )}
        {...props}
    />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

const ModalDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("text-sm text-gray-500 mt-1", className)}
        {...props}
    />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

// Convenience components for common patterns
const ModalWithHeader = ({
    title,
    description,
    children,
    open,
    onOpenChange,
    size = "md",
    ...props
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}) => (
    <Modal open={open} onOpenChange={onOpenChange}>
        <ModalContent size={size} {...props}>
            <ModalHeader>
                <ModalTitle>{title}</ModalTitle>
                {description && (
                    <ModalDescription>{description}</ModalDescription>
                )}
            </ModalHeader>
            <ModalBody>{children}</ModalBody>
        </ModalContent>
    </Modal>
);

const ModalWithFooter = ({
    title,
    description,
    children,
    footer,
    open,
    onOpenChange,
    size = "md",
    ...props
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    footer: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}) => (
    <Modal open={open} onOpenChange={onOpenChange}>
        <ModalContent size={size} {...props}>
            <ModalHeader>
                <ModalTitle>{title}</ModalTitle>
                {description && (
                    <ModalDescription>{description}</ModalDescription>
                )}
            </ModalHeader>
            <ModalBody>{children}</ModalBody>
            <ModalFooter>{footer}</ModalFooter>
        </ModalContent>
    </Modal>
);

export {
    Modal,
    ModalPortal,
    ModalOverlay,
    ModalClose,
    ModalTrigger,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalTitle,
    ModalDescription,
    ModalBody,
    ModalWithHeader,
    ModalWithFooter,
};
