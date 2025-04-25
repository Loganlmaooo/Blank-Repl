
import { useEffect, useState } from 'react';

export function useShimmerEffect(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      const x = (e.clientX - left) / width;
      const y = (e.clientY - top) / height;
      
      element.style.setProperty('--mouse-x', `${x * 100}%`);
      element.style.setProperty('--mouse-y', `${y * 100}%`);
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    return () => element.removeEventListener('mousemove', handleMouseMove);
  }, [ref]);
}

export function useParallaxEffect(ref: React.RefObject<HTMLElement>, intensity = 20) {
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / intensity;
      const y = (e.clientY - top - height / 2) / intensity;
      
      element.style.transform = `translate(${x}px, ${y}px)`;
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    return () => element.removeEventListener('mousemove', handleMouseMove);
  }, [ref, intensity]);
}

export function useFloatingEffect(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    let offset = 0;
    
    const animate = () => {
      offset += 0.02;
      const y = Math.sin(offset) * 10;
      element.style.transform = `translateY(${y}px)`;
      requestAnimationFrame(animate);
    };
    
    const animation = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animation);
  }, [ref]);
}

import { useEffect, useState } from "react";

interface AnimationOptions {
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
  type?: "fade" | "slide" | "scale" | "rotate";
  ease?: string;
}

export function useAnimationOnScroll(options: AnimationOptions = {}) {
  const {
    delay = 0,
    duration = 600,
    direction = "up",
    type = "fade",
    ease = "ease-out",
  } = options;
  
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "0px",
        threshold: 0.1,
      }
    );
    
    observer.observe(ref);
    
    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref]);
  
  const getAnimationClass = () => {
    if (!isVisible) return "";
    
    const directionMap = {
      up: "translate-y-8",
      down: "-translate-y-8",
      left: "translate-x-8",
      right: "-translate-x-8",
    };
    
    // Use fixed animation classes to avoid template string issues
    let animationClass = `transform ${isVisible ? "opacity-100" : "opacity-0"}`;
    
    // Add appropriate transforms based on animation type
    if (type === "slide" && !isVisible) {
      animationClass += ` ${directionMap[direction]}`;
    }
    
    if (type === "scale" && !isVisible) {
      animationClass += " scale-95";
    }
    
    if (type === "rotate" && !isVisible) {
      animationClass += " rotate-3";
    }
    
    // Add transition properties
    animationClass += ` transition-all ${ease}`;
    
    // Use standard tailwind classes for duration and delay
    if (duration === 600) {
      animationClass += " duration-600";
    } else {
      animationClass += " duration-500";
    }
    
    if (delay === 0) {
      // No delay class needed
    } else if (delay <= 100) {
      animationClass += " delay-100";
    } else if (delay <= 200) {
      animationClass += " delay-200";
    } else if (delay <= 300) {
      animationClass += " delay-300";
    } else if (delay <= 500) {
      animationClass += " delay-500";
    } else {
      animationClass += " delay-700";
    }
    
    return animationClass;
  };
  
  return { ref: setRef, isVisible, animationClass: getAnimationClass() };
}

export function usePremiumParticles() {
  useEffect(() => {
    // Implementation would go here in a real app
    // This would integrate with a particle library
    console.log("Premium particles initialized");
    
    return () => {
      console.log("Premium particles destroyed");
    };
  }, []);
}

export function useGlassReflection(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      const xPercent = Math.round((x / width) * 100);
      const yPercent = Math.round((y / height) * 100);
      
      element.style.backgroundImage = `radial-gradient(circle at ${xPercent}% ${yPercent}%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)`;
    };
    
    element.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
    };
  }, [ref]);
}

export function useParallax() {
  useEffect(() => {
    const handleScroll = () => {
      const parallaxElements = document.querySelectorAll(".parallax");
      const scrollY = window.scrollY;
      
      parallaxElements.forEach((element) => {
        const speed = parseFloat((element as HTMLElement).dataset.speed || "0.5");
        const rotation = parseFloat((element as HTMLElement).dataset.rotate || "0");
        const scale = parseFloat((element as HTMLElement).dataset.scale || "1");
        
        const translateY = scrollY * speed;
        const rotateZ = scrollY * rotation;
        const scaleValue = 1 + (scrollY * scale / 1000);
        
        (element as HTMLElement).style.transform = 
          `translateY(${translateY}px) rotateZ(${rotateZ}deg) scale(${scaleValue})`;
      });
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}

export function useAdvancedParticles(type: 'gold' | 'dust' | 'shimmer' | 'sparkle') {
  useEffect(() => {
    const container = document.createElement('div');
    container.className = 'particles-container';
    document.body.appendChild(container);

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = `particle ${type}-particle`;
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.animationDuration = `${2 + Math.random() * 3}s`;
      container.appendChild(particle);

      particle.addEventListener('animationend', () => {
        particle.remove();
      });
    };

    const interval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        createParticle();
      }
    }, 200);

    return () => {
      clearInterval(interval);
      container.remove();
    };
  }, [type]);
}

export function useGlowEffect(ref: React.RefObject<HTMLElement>, color: string = '#ffd700') {
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      
      // Calculate relative position as percentage
      const xPercent = (x / width) * 100;
      const yPercent = (y / height) * 100;
      
      element.style.setProperty('--glow-x', `${xPercent}%`);
      element.style.setProperty('--glow-y', `${yPercent}%`);
      element.style.setProperty('--glow-color', color);
      element.style.setProperty('--glow-opacity', '1');
    };
    
    const handleMouseLeave = () => {
      element.style.setProperty('--glow-opacity', '0');
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, color]);
}

export function useTypewriterEffect(ref: React.RefObject<HTMLElement>, text: string, speed: number = 50) {
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        element.textContent = text.slice(0, index + 1);
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [ref, text, speed]);
}

export function useMagneticEffect(ref: React.RefObject<HTMLElement>, intensity: number = 1) {
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      const x = e.clientX - left - width / 2;
      const y = e.clientY - top - height / 2;
      
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = Math.sqrt(width * width + height * height) / 2;
      const force = (1 - distance / maxDistance) * intensity;
      
      if (force > 0) {
        element.style.transform = `translate(${x * force}px, ${y * force}px)`;
      } else {
        element.style.transform = '';
      }
    };
    
    const handleMouseLeave = () => {
      element.style.transform = '';
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, intensity]);
}

export function useGoldParticles(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref.current) return;
    
    // This would integrate with a particle library in a real implementation
    console.log("Gold particles initialized on element");
    
    return () => {
      console.log("Gold particles destroyed");
    };
  }, [ref]);
}

export function useCustomCursor() {
  useEffect(() => {
    // Implementation would go here in a real app
    console.log("Custom cursor initialized");
    
    return () => {
      console.log("Custom cursor destroyed");
    };
  }, []);
}
