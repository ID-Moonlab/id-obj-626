/**
 * MUI BaseUI Component Library
 *
 * A comprehensive, accessible component library following MUI BaseUI design principles.
 * Built on top of Radix UI primitives with Tailwind CSS styling.
 */

// Core components
export { Button, ContainedButton, OutlinedButton, TextButton, IconButton, buttonVariants, type ButtonProps } from './Button/Button';
export { Input, Textarea, inputVariants, type InputProps, type TextareaProps } from './Input/Input';
export { Card, CardHeader, CardContent, CardFooter, cardVariants, type CardProps } from './Card/Card';
export { Badge, badgeVariants, type BadgeProps } from './Badge/Badge';

// Modal/Dialog components
export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalBody,
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
  type ModalProps,
  type DialogProps
} from './Modal/Modal';

// Form components
export { FormControl, FormLabel, FormHelperText, FormErrorMessage, type FormControlProps, type FormLabelProps, type FormHelperTextProps } from './Form/FormControl';
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, selectVariants, type SelectProps } from './Select/Select';
export { Label, type LabelProps } from './Label/Label';
export { Checkbox, type CheckboxProps } from './Checkbox/Checkbox';
export { RadioGroup, RadioGroupItem, type RadioGroupProps } from './Radio/Radio';

// Navigation components
export { Tabs, TabsList, TabsTrigger, TabsContent, tabVariants, type TabsProps } from './Tabs/Tabs';
export { Menu, MenuItem, MenuButton, MenuDivider, type MenuProps, type MenuItemProps } from './Menu/Menu';

// Feedback components
export { Progress, LinearProgress, type ProgressProps } from './Progress/Progress';
export { Skeleton, type SkeletonProps } from './Skeleton/Skeleton';
export { Backdrop, type BackdropProps } from './Backdrop/Backdrop';

// Layout components
export { Box, Flex, Grid, Stack, type BoxProps, type FlexProps, type GridProps, type StackProps } from './Layout/Layout';
export { Paper, paperVariants, type PaperProps } from './Paper/Paper';
export { Divider, type DividerProps } from './Divider/Divider';
export { Typography, type TypographyProps } from './Typography/Typography';

// Surface components
export { AppBar, AppBarTitle, AppBarSection, type AppBarProps } from './AppBar/AppBar';
export { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, type DrawerProps } from './Drawer/Drawer';

// Utility functions and types
export { cn } from '@/lib/utils';
export { createCssLayout } from './utils/layout';
export { useControlled, useUncontrolled, useId } from './utils/hooks';

// Type exports
export type { ComponentProps, HTMLAttributes, ReactNode, Ref, ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent, TouchEvent } from 'react';

// Default export - includes all components
export default {
  // Core
  Button,
  ContainedButton,
  OutlinedButton,
  TextButton,
  IconButton,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,

  // Modal
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalBody,

  // Form
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Checkbox,
  RadioGroup,
  RadioGroupItem,

  // Navigation
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Menu,
  MenuItem,
  MenuButton,
  MenuDivider,

  // Feedback
  Progress,
  LinearProgress,
  Skeleton,
  Backdrop,

  // Layout
  Box,
  Flex,
  Grid,
  Stack,
  Paper,
  Divider,
  Typography,

  // Surface
  AppBar,
  AppBarTitle,
  AppBarSection,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
};
