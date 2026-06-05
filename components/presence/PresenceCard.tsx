"use client";

import Link from "next/link";
import { Avatar } from "@/components/shared/Avatar";
import { AvailabilityBadge } from "@/components/shared/AvailabilityBadge";
import { formatDateRange } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface PresenceCardProps {
  presence: {
    id: string;
    startDate: Date;
    endDate: Date;
    note?: string | null;
    availability: "OPEN" | "BUSY";
    user: {
      id: string;
      name: string;
      image?: string | null;
      city?: string | null;
      memberColor: number;
    };
  };
  currentUserId?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PresenceCard({ presence, currentUserId, onEdit, onDelete }: PresenceCardProps) {
  const { user, startDate, endDate, note, availability } = presence;
  const isOwn = user.id === currentUserId;

  return (
    <div className="card flex gap-3">
      <Link href={`/membres/${user.id}`} className="flex-shrink-0">
        <Avatar
          name={user.name}
          image={user.image}
          memberColor={user.memberColor}
          size="md"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/membres/${user.id}`} className="text-body-strong font-semibold text-foreground hover:underline">
              {user.name}
            </Link>
            {user.city && (
              <p className="text-caption flex items-center gap-0.5 mt-0.5">
                <MapPin className="w-3 h-3" />
                {user.city}
              </p>
            )}
          </div>
          {isOwn && (
            <div className="flex gap-1 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(presence.id)}
                  className="text-xs text-primary font-medium px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Modifier
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(presence.id)}
                  className="text-xs text-destructive font-medium px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-foreground mt-1">
          {formatDateRange(new Date(startDate), new Date(endDate))}
        </p>
        {note && (
          <p className="text-caption mt-1 line-clamp-2">{note}</p>
        )}
        <div className="mt-2">
          <AvailabilityBadge availability={availability} />
        </div>
      </div>
    </div>
  );
}
