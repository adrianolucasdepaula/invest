'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  isMounted: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Persist sidebar state in localStorage - only after mount to avoid hydration mismatch
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-open');
    if (savedState !== null) {
      setIsOpen(savedState === 'true');
    }
    setIsMounted(true);
  }, []);

  const toggle = () => {
    setIsOpen((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebar-open', String(newState));
      return newState;
    });
  };

  const open = () => {
    setIsOpen(true);
    localStorage.setItem('sidebar-open', 'true');
  };

  const close = () => {
    setIsOpen(false);
    localStorage.setItem('sidebar-open', 'false');
  };

  return (
    <SidebarContext.Provider value={{ isOpen, isMounted, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
