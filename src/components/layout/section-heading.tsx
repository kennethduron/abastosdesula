import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  inverse?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverse = false,
}: SectionHeadingProps) {
  return (
    <div
      className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}
    >
      {eyebrow && (
        <p
          className={cn(
            "mb-3 text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase",
            inverse && "text-brand-green-light",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "text-3xl leading-tight font-extrabold tracking-[-0.035em] text-brand-navy sm:text-4xl",
          inverse && "text-white",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-7 text-slate-600 sm:text-lg",
            inverse && "text-slate-300",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
