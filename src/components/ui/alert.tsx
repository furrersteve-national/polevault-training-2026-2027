import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-0.5 rounded-lg border px-4 py-3 text-sm [&>svg]:size-5 [&>svg]:translate-y-0.5', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      info: 'border-navy-200 bg-navy-50 text-navy-800',
      warning: 'border-warning/30 bg-warning-soft text-warning',
      destructive: 'border-destructive/30 bg-destructive-soft text-destructive',
      success: 'border-success/30 bg-success-soft text-success',
    },
  },
  defaultVariants: { variant: 'default' },
});

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}
const AlertTitle = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cn('col-start-2 font-medium', className)} {...props} />;
const AlertDescription = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cn('col-start-2 text-sm opacity-90', className)} {...props} />;

export { Alert, AlertTitle, AlertDescription };
