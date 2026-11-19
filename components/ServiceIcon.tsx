import React from "react";
import {
  BedDouble,
  Footprints,
  PanelTop,
  Shirt,
  Sparkles,
  WashingMachine,
} from "lucide-react";

export function ServiceIcon({
  iconKey,
  className = "h-7 w-7",
}: {
  iconKey: string;
  className?: string;
}) {
  switch (iconKey) {
    case "washing-machine":
      return <WashingMachine className={className} aria-hidden="true" />;
    case "shirt":
      return <Shirt className={className} aria-hidden="true" />;
    case "bed":
      return <BedDouble className={className} aria-hidden="true" />;
    case "curtains":
      return <PanelTop className={className} aria-hidden="true" />;
    case "footprints":
      return <Footprints className={className} aria-hidden="true" />;
    case "sparkles":
      return <Sparkles className={className} aria-hidden="true" />;
    default:
      return <WashingMachine className={className} aria-hidden="true" />;
  }
}
