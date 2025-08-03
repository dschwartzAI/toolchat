/* Memory Edit Dialog - Hidden for business context */
import React from 'react';
import type { TUserMemory } from 'librechat-data-provider';

interface MemoryEditDialogProps {
  memory: TUserMemory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  triggerRef?: React.MutableRefObject<HTMLButtonElement | null>;
}

export default function MemoryEditDialog({
  memory,
  open,
  onOpenChange,
  children,
  triggerRef,
}: MemoryEditDialogProps) {
  return null;
}