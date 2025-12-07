'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  targetId: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Skip Link Component for Accessibility (WCAG 2.4.1)
 *
 * Allows keyboard users to skip directly to main content,
 * bypassing repetitive navigation elements.
 *
 * Usage:
 * - Placed at the top of the page
 * - Hidden by default, visible on focus (Tab key)
 * - Links to #main-content or other target IDs
 */
export function SkipLink({
  targetId,
  className,
  children = 'Pular para o conteúdo principal'
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Hidden by default, shown on focus
        'sr-only focus:not-sr-only',
        // Positioning when visible
        'focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
        // Styling when visible
        'focus:block focus:rounded-md focus:bg-primary focus:px-4 focus:py-2',
        'focus:text-primary-foreground focus:font-medium focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Animation
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
}
