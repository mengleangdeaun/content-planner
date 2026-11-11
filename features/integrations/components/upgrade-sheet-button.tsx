"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import { UpgradeSheetDialog } from "./upgrade-sheet-dialog";
import { useAuth } from "@/context/auth-context";

interface UpgradeSheetButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function UpgradeSheetButton({
  variant = "outline",
  size = "sm",
  className = "",
  showIcon = true,
  label = "Upgrade Sheet Structure",
}: UpgradeSheetButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { can } = useAuth();

  if (!can("system.manage")) return null;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={`gap-1.5 text-xs font-medium border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0 whitespace-nowrap ${className}`}
      >
        {showIcon && <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
        <span>{label}</span>
      </Button>

      {isOpen && <UpgradeSheetDialog isOpen onOpenChange={setIsOpen} />}
    </>
  );
}
