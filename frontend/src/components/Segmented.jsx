import { cn } from "@/lib/utils";

// options: [{ value, label }]
export default function Segmented({ options, value, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl bg-[#EFEFF3] p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-[9px] py-2 font-sans text-[14px] font-bold transition",
              active
                ? "bg-card text-ink shadow-[0_1px_2px_rgba(20,23,51,0.09)]"
                : "text-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
