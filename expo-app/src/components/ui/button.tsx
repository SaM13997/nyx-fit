import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/styles';
import { useHapticFeedback } from '../../lib/haptics';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ComponentProps<typeof TouchableOpacity>,
    VariantProps<typeof buttonVariants> {
  title: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  ({ className, variant, size, title, loading, leftIcon, rightIcon, disabled, onPress, ...props }, ref) => {
    const haptics = useHapticFeedback();

    const handlePress = (event: any) => {
      if (!disabled && !loading) {
        haptics.light();
        onPress?.(event);
      }
    };

    return (
      <TouchableOpacity
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        onPress={handlePress}
        activeOpacity={0.7}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color="currentColor" />
        ) : (
          <>
            {leftIcon}
            <Text className={cn(
              'font-medium',
              variant === 'default' && 'text-primary-foreground',
              variant === 'destructive' && 'text-destructive-foreground',
              variant === 'outline' && 'text-foreground',
              variant === 'secondary' && 'text-secondary-foreground',
              variant === 'ghost' && 'text-foreground',
              variant === 'link' && 'text-primary',
              leftIcon && 'ml-2',
              rightIcon && 'mr-2'
            )}>
              {title}
            </Text>
            {rightIcon}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };