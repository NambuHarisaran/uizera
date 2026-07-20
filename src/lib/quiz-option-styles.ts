import { Circle, Diamond, Square, Triangle } from "lucide-react";

/** Kahoot/Menti-style shape + color per option index, shared by every live-quiz screen. */
export const OPTION_STYLES = [
  { icon: Triangle, bg: "bg-red-500", text: "text-white", border: "border-red-500" },
  { icon: Diamond, bg: "bg-uipath-blue", text: "text-white", border: "border-uipath-blue" },
  { icon: Circle, bg: "bg-amber-400", text: "text-black", border: "border-amber-400" },
  { icon: Square, bg: "bg-emerald-500", text: "text-white", border: "border-emerald-500" },
] as const;

export function optionStyleFor(index: number) {
  return OPTION_STYLES[index % OPTION_STYLES.length]!;
}
