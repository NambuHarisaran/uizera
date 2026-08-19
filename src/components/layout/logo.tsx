import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  alt?: string;
}

export function Logo({
  className,
  imgClassName,
  width = 160,
  height = 90,
  priority = false,
  alt = "UiZera Logo",
}: LogoProps) {
  return (
    <span className={cn("relative inline-flex items-center select-none", className)}>
      {/* Light Theme Logo */}
      <Image
        src="/UiZera logo 1.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "h-9 w-auto object-contain dark:hidden mix-blend-multiply",
          imgClassName
        )}
      />
      {/* Dark Theme Logo */}
      <Image
        src="/UiZera logo 2.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "h-9 w-auto object-contain hidden dark:block mix-blend-screen",
          imgClassName
        )}
      />
    </span>
  );
}
