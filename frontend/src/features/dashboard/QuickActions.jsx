import IconChip from "@/components/IconChip";
import {
  PlusIcon,
  // TransferIcon,
  TargetIcon,
  RepeatIcon,
} from "@/components/icons";
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "Add", icon: PlusIcon, tone: "accent", to: "/add-transaction" },
  // { label: "Transfer", icon: TransferIcon, tone: "neutral" },
  { label: "Budgets", icon: TargetIcon, tone: "neutral" },
  { label: "Recurring", icon: RepeatIcon, tone: "neutral" },
];

function ActionTile({ label, icon: Icon, tone, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="border-line bg-card flex flex-1 flex-col items-center gap-2 rounded-[18px] border py-4 transition active:scale-[0.98]"
    >
      <IconChip tone={tone}>
        <Icon className="h-5 w-5" />
      </IconChip>
      <span className="text-ink font-sans text-[12px] font-semibold">
        {label}
      </span>
    </button>
  );
}

export default function QuickActions() {
  return (
    <div className="mt-5 flex gap-3 px-5">
      {actions.map((a) => (
        <ActionTile key={a.label} {...a} />
      ))}
    </div>
  );
}
