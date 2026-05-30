import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

interface PopoverProps {
  children: ReactNode;
}

export function Popover({ children }: PopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('PopoverTrigger must be used within a Popover component');
  }

  const { open, setOpen } = context;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(!open),
    });
  }

  return (
    <button onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

// NOTE: `side` and `align` props are accepted but not yet honored by this
// hand-rolled popover — kept in the type for API parity with Radix Popover.
// If positioning logic is needed, switch to `@radix-ui/react-popover` (already
// in deps) rather than extending this stub.
export function PopoverContent({ children, className }: PopoverContentProps) {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('PopoverContent must be used within a Popover component');
  }

  const { open, setOpen } = context;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      // DESIGN.md: floating-modal elevation on canvas + hairline border
      className={cn(
        'z-50 w-72 rounded-lg border border-hairline bg-popover p-md text-popover-foreground shadow-floating outline-none',
        className,
      )}
    >
      {children}
    </div>
  );
}
