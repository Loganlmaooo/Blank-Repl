import { forwardRef, HTMLAttributes, ReactNode, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGlassReflection } from "@/lib/animation";

export interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "gold" | "dark";
  glassEffect?: boolean;
  hoverEffect?: boolean;
  animation?: "fade" | "slide" | "scale" | "none";
  animationDelay?: number;
}

const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ 
    children, 
    className, 
    variant = "default", 
    glassEffect = true, 
    hoverEffect = true, 
    animation = "none", 
    animationDelay = 0,
    ...props 
  }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    
    // Apply glass reflection effect
    useEffect(() => {
      if (glassEffect && cardRef.current) {
        useGlassReflection({ current: cardRef.current });
      }
    }, [glassEffect]);
    
    // Determine variant classes
    const variantClasses = {
      default: "glass",
      gold: "glass-gold",
      dark: "bg-zinc-900/90 border border-zinc-800",
    };
    
    // Determine hover effect classes
    const hoverClasses = hoverEffect ? "hover-gold" : "";
    
    // Determine animation variants
    const animationVariants = {
      fade: {
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { 
            duration: 0.6,
            delay: animationDelay / 1000,
          }
        }
      },
      slide: {
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { 
            duration: 0.6,
            delay: animationDelay / 1000,
          }
        }
      },
      scale: {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
          opacity: 1, 
          scale: 1,
          transition: { 
            duration: 0.6,
            delay: animationDelay / 1000,
          }
        }
      },
      none: {
        hidden: {},
        visible: {}
      }
    };
    
    // If no animation, render a regular div
    if (animation === "none") {
      return (
        <div
          ref={(node) => {
            // Forward the ref to the parent component
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            // Store the ref locally to use with glass effect
            if (cardRef) {
              cardRef.current = node;
            }
          }}
          className={cn(
            "rounded-xl overflow-hidden",
            variantClasses[variant],
            hoverClasses,
            className
          )}
          {...props}
        >
          {children}
        </div>
      );
    }
    
    // Otherwise use motion.div for animations
    return (
      <motion.div
        ref={(node) => {
          // Forward the ref to the parent component
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          // Store the ref locally to use with glass effect
          if (cardRef) {
            cardRef.current = node;
          }
        }}
        className={cn(
          "rounded-xl overflow-hidden",
          variantClasses[variant],
          hoverClasses,
          className
        )}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={animationVariants[animation]}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";

export { PremiumCard };
