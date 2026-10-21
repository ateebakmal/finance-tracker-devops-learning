import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-bold transition active:scale-[0.99] disabled:cursor-not-allowed";

const variants = {
  primary:
    "rounded-2xl bg-accent px-5 py-4 text-[15px] text-white disabled:bg-[#C7CBF2]",
  secondary:
    "rounded-2xl border border-line bg-card px-5 py-4 text-[15px] text-ink",
  soft: "rounded-xl bg-accent-tint px-4 py-2 text-[13px] text-accent",
  icon: "h-9 w-9 rounded-xl border border-line bg-card text-muted",
};

export default function Button({
  variant = "primary",
  className,
  children,
  ...props
}) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
