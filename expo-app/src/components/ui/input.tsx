import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '../../lib/styles';

export interface InputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <View className="w-full">
        {label && (
          <Text className="text-sm font-medium text-foreground mb-2">
            {label}
          </Text>
        )}
        <View className={cn(
          'flex-row items-center border border-input bg-background rounded-md',
          error && 'border-destructive',
          className
        )}>
          {leftIcon && (
            <View className="pl-3">
              {leftIcon}
            </View>
          )}
          <TextInput
            ref={ref}
            className={cn(
              'flex-1 h-10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground',
              leftIcon && 'pl-1',
              rightIcon && 'pr-1'
            )}
            placeholderTextColor="hsl(var(--muted-foreground))"
            {...props}
          />
          {rightIcon && (
            <View className="pr-3">
              {rightIcon}
            </View>
          )}
        </View>
        {error && (
          <Text className="text-sm text-destructive mt-1">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };