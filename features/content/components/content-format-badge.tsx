"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Video, Image as ImageIcon } from "lucide-react";

interface ContentFormatBadgeProps {
  isPoster?: boolean;
  isVideo?: boolean;
}

export function ContentFormatBadge({ isPoster, isVideo }: ContentFormatBadgeProps) {
  if (isPoster && isVideo) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="secondary" className="text-xs gap-1 font-medium">
          <ImageIcon className="h-3 w-3 text-primary" />
          <span>Poster</span>
        </Badge>
        <Badge variant="secondary" className="text-xs gap-1 font-medium">
          <Video className="h-3 w-3 text-primary" />
          <span>Video</span>
        </Badge>
      </div>
    );
  }

  if (isPoster) {
    return (
      <Badge variant="outline" className="text-xs gap-1 font-medium">
        <ImageIcon className="h-3 w-3 text-primary" />
        <span>Poster</span>
      </Badge>
    );
  }

  if (isVideo) {
    return (
      <Badge variant="outline" className="text-xs gap-1 font-medium">
        <Video className="h-3 w-3 text-primary" />
        <span>Video</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      Standard
    </Badge>
  );
}

