import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const goldButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "gold-gradient text-black font-bold hover:opacity-90",
        outline: "bg-transparent border border-primary text-primary hover:bg-primary/10",
        ghost: "bg-transparent text-primary hover:bg-primary/10",
        premium: "bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 text-black font-bold hover:opacity-90 shadow-md hover:shadow-lg transition-shadow",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      animation: {
        none: "",
        pulse: "animate-pulse-gold",
        shine: "overflow-hidden relative [&:after]:absolute [&:after]:inset-0 [&:after]:translate-x-[-100%] [&:after]:bg-gradient-to-r [&:after]:from-transparent [&:after]:via-white/20 [&:after]:to-transparent [&:after]:transition-transform [&:after]:duration-[1.5s] [&:after]:ease-in-out hover:[&:after]:translate-x-[100%]",
      },
      glow: {
        true: "shadow-[0_0_10px_2px_rgba(212,175,55,0.5)]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
      glow: false,
    },
  }
);

export interface GoldButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof goldButtonVariants> {
  children: ReactNode;
  motionEffect?: boolean;
  animationDelay?: number;
}

const GoldButton = forwardRef<HTMLButtonElement, GoldButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation, 
    glow,
    motionEffect = false,
    animationDelay = 0,
    children, 
    ...props 
  }, ref) => {
    if (motionEffect) {
      return (
        <motion.button
          ref={ref}
          className={cn(goldButtonVariants({ variant, size, animation, glow, className }))}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { 
              delay: animationDelay / 1000,
              duration: 0.5
            }
          }}
          {...props}
        >
          {children}
        </motion.button>
      );
    }
    
    return (
      <button
        ref={ref}
        className={cn(goldButtonVariants({ variant, size, animation, glow, className }))}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GoldButton.displayName = "GoldButton";

export { GoldButton, goldButtonVariants };
