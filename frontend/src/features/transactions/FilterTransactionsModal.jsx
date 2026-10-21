import { useState } from "react";
import { cn } from "@/lib/utils";
import RangeCalendar from "./RangeCalender.jsx";

const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
};
const firstOfMonthISO = () => {
  const d = new Date();
  d.setDate(1);
  return toISO(d);
};
const yearStartISO = () => `${new Date().getFullYear()}-01-01`;
const fmt = (v) =>
  v
    ? new Date(v + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Any";

export default function FilterTransactionsModal({
  value = {},
  onApply,
  onClose,
}) {
  const today = toISO(new Date());
  const monthStart = firstOfMonthISO();

  const [from, setFrom] = useState(value.date_from ?? monthStart);
  const [to, setTo] = useState(value.date_to ?? today);
  const [target, setTarget] = useState("from");

  const presets = [
    { key: "all", label: "All time", from: "2000-01-01", to: today },
    { key: "month", label: "This month", from: monthStart, to: today },
    { key: "30", label: "Last 30 days", from: daysAgoISO(29), to: today },
    { key: "year", label: "This year", from: yearStartISO(), to: today },
  ];
  const activePreset = presets.find((p) => p.from === from && p.to === to)?.key;

  function pick(cell) {
    if (target === "from") {
      setFrom(cell);
      if (to && cell > to) setTo(cell);
      setTarget("to");
    } else {
      setTo(cell);
      if (from && cell < from) setFrom(cell);
      setTarget("from");
    }
  }

  function apply() {
    // this-month == backend default -> send empty so it reads as the clean default
    if (from === monthStart && to === today) onApply({});
    else onApply({ date_from: from, date_to: to });
    onClose();
  }

  function clear() {
    setFrom(monthStart);
    setTo(today);
    setTarget("from");
  }

  const field = (label, val, which) => (
    <button
      type="button"
      onClick={() => setTarget(which)}
      className={cn(
        "flex-1 rounded-2xl border p-3 text-left transition",
        target === which
          ? "border-accent bg-accent-tint"
          : "border-line bg-card",
      )}
    >
      <p className="text-faint text-[10px] font-bold tracking-[0.1em] uppercase">
        {label}
      </p>
      <p className="text-ink font-numeric mt-0.5 text-[14px] font-semibold">
        {fmt(val)}
      </p>
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted mb-2 text-[12px] font-bold">Date range</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setFrom(p.from);
                setTo(p.to);
                setTarget("from");
              }}
              className={cn(
                "rounded-full px-3.5 py-2 font-sans text-[13px] font-bold transition",
                activePreset === p.key
                  ? "bg-accent text-white"
                  : "border-line bg-card text-ink border",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {field("From", from, "from")}
        {field("To", to, "to")}
      </div>

      <RangeCalendar
        from={from}
        to={to}
        target={target}
        max={today}
        onPick={pick}
      />

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={clear}
          className="border-line bg-card text-ink rounded-2xl border px-5 py-3.5 font-sans text-[14px] font-bold"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={apply}
          className="bg-accent flex-1 rounded-2xl py-3.5 font-sans text-[15px] font-bold text-white"
        >
          Apply filter
        </button>
      </div>
    </div>
  );
}
