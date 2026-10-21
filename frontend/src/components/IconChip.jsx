import { cn } from "@/lib/utils";

const tones = {
  income: "bg-[#E7F5EF] text-pos", // income transactions
  neutral: "bg-[#F3F4F7] text-[#4A4F63]", // expense / neutral
  accent: "bg-accent-tint text-accent", // primary action
};

export default function IconChip({ tone = "neutral", className, children }) {
  return (
    <div
      className={cn(
        "grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px]",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
