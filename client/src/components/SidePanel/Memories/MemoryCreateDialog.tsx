/* Memory Create Dialog - Hidden for business context */
import React from 'react';

interface MemoryCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  triggerRef?: React.MutableRefObject<HTMLButtonElement | null>;
}

export default function MemoryCreateDialog({
  open,
  onOpenChange,
  children,
  triggerRef,
}: MemoryCreateDialogProps) {
  return null;
}