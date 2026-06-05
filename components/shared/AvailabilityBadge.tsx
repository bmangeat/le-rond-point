import { cn } from "@/lib/utils";

type Availability = "OPEN" | "BUSY";

interface AvailabilityBadgeProps {
  availability: Availability;
  className?: string;
}

const config = {
  OPEN: {
    label: "Ouvert aux retrouvailles",
    className: "badge-available",
    dot: "bg-available",
  },
  BUSY: {
    label: "Passage rapide",
    className: "badge-busy",
    dot: "bg-busy",
  },
};

export function AvailabilityBadge({ availability, className }: AvailabilityBadgeProps) {
  const { label, className: badgeClass, dot } = config[availability];
  return (
    <span className={cn(badgeClass, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
