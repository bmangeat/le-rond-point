"use client";

import Image from "next/image";
import { cn, getInitials, getMemberColor } from "@/lib/utils";

interface AvatarProps {
  name: string;
  image?: string | null;
  memberColor?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-24 h-24 text-2xl",
};

const sizePx = { sm: 32, md: 40, lg: 48, xl: 96 } as const;

export function Avatar({ name, image, memberColor = 1, size = "md", className }: AvatarProps) {
  const color = getMemberColor(memberColor);
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "avatar rounded-full flex items-center justify-center font-semibold overflow-hidden flex-shrink-0",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          width={sizePx[size]}
          height={sizePx[size]}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
