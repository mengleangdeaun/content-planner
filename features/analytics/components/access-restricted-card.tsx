"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export function AccessRestrictedCard() {
  return (
    <Card className="max-w-md mx-auto my-12 text-center p-6 shadow-sm">
      <CardHeader className="p-0">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardTitle className="text-base font-semibold">
          You don&apos;t have access to this page
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          Ask an admin to add the &quot;View metrics&quot; permission to your role.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
