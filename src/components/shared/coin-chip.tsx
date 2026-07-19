import { Coins } from "lucide-react";
import { cn, formatCoins } from "@/lib/utils";

export function CoinChip({
  amount,
  className,
  prefix,
}: {
  amount: number;
  className?: string;
  prefix?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400",
        className
      )}
    >
      <Coins className="h-3.5 w-3.5" />
      {prefix}
      {formatCoins(amount)}
    </span>
  );
}
