// BaseUI Component Exports
// Organized by category for better code organization

// Button Component
export { Button, buttonVariants } from "./button";

// Input Components
export { Input } from "./input";
export { Textarea } from "./textarea";

// Card Components
export {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "./card";

// Modal/Dialog Components
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
} from "./modal";

// Select Components
export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
} from "./select";

// Form Components
export { Label } from "./label";

// Badge/Chip Component
export { Badge, badgeVariants } from "./badge";

// Progress Component
export { Progress } from "./progress";

// Separator Component
export { Separator } from "./separator";

// Tabs Components
export {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "./tabs";

// Toast Components
export {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
    useToast,
} from "./toast";

// Table Components
export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
} from "./table";

// Pagination Component
export { Pagination } from "./pagination";

// Sheet Component (Slide-over panel)
export {
    Sheet,
    SheetPortal,
    SheetOverlay,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
} from "./sheet";

// Utility functions for component composition
export { cn } from "@/lib/utils";

// Type exports for better TypeScript support
import type { ButtonProps } from "./button";
import type { InputProps } from "./input";
import type { TextareaProps } from "./textarea";
import type { CardProps } from "./card";
import type { ModalProps } from "./modal";
import type { SelectProps } from "./select";
import type { LabelProps } from "./label";
import type { BadgeProps } from "./badge";
import type { ProgressProps } from "./progress";
import type { SeparatorProps } from "./separator";
import type { TabsProps } from "./tabs";
import type { TableProps } from "./table";
import type { PaginationProps } from "./pagination";
import type { SheetProps } from "./sheet";

// Re-export types for convenience
export type {
    ButtonProps,
    InputProps,
    TextareaProps,
    CardProps,
    ModalProps,
    SelectProps,
    LabelProps,
    BadgeProps,
    ProgressProps,
    SeparatorProps,
    TabsProps,
    TableProps,
    PaginationProps,
    SheetProps,
};

// Custom hooks
export { useFormField } from "./form";
