import IconChip from "@/components/IconChip";
import { ChevronRightIcon } from "@/components/icons";

export default function SettingsRow({ icon: Icon, label, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="active:bg-bg flex w-full items-center gap-3 px-4 py-3.5 text-left transition"
    >
      <IconChip tone="neutral">
        <Icon className="h-5 w-5" />
      </IconChip>
      <span className="text-ink flex-1 font-sans text-[14.5px] font-bold">
        {label}
      </span>
      {value ? (
        <span className="text-faint text-[13px] font-semibold">{value}</span>
      ) : null}
      <ChevronRightIcon className="text-faint h-4 w-4" />
    </button>
  );
}
