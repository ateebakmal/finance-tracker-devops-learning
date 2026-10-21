import { cn } from "@/lib/utils";

export default function ProfileRow({ name, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
        active ? "border-accent bg-accent-tint" : "border-line bg-card",
      )}
    >
      <div
        className={cn(
          "font-numeric grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] text-base font-semibold",
          active ? "bg-accent text-white" : "bg-[#F3F4F7] text-[#4A4F63]",
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <p className="text-ink min-w-0 flex-1 truncate font-sans text-[15px] font-bold">
        {name}
      </p>
      <span
        className={cn(
          "font-sans text-[12px] font-bold",
          active ? "text-pos" : "text-faint",
        )}
      >
        {active ? "Active" : "Switch"}
      </span>
    </button>
  );
}
