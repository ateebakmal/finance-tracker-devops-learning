import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const iso = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function RangeCalendar({ from, to, target, max, onPick }) {
  const base = (target === "to" && to ? to : from) ?? max;
  const [view, setView] = useState({
    y: Number(base.slice(0, 4)),
    m: Number(base.slice(5, 7)) - 1,
  });
  const { y, m } = view;

  const firstWeekday = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const maxY = Number(max.slice(0, 4)),
    maxM = Number(max.slice(5, 7)) - 1;
  const canNext = y < maxY || (y === maxY && m < maxM);

  return (
    <div className="border-line bg-card rounded-2xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setView({ y: m === 0 ? y - 1 : y, m: (m + 11) % 12 })}
          className="border-line text-muted grid h-8 w-8 place-items-center rounded-lg border"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <p className="text-ink font-sans text-[14.5px] font-bold">
          {MONTHS[m]} {y}
        </p>
        <button
          disabled={!canNext}
          onClick={() =>
            canNext && setView({ y: m === 11 ? y + 1 : y, m: (m + 1) % 12 })
          }
          className={cn(
            "border-line grid h-8 w-8 place-items-center rounded-lg border",
            canNext ? "text-muted" : "text-faint/40",
          )}
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="text-faint py-1 text-center font-sans text-[11px] font-bold"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />;
          const cell = iso(y, m, d);
          const disabled = cell > max;
          const endpoint = cell === from || cell === to;
          const inRange = from && to && cell > from && cell < to;
          const isToday = cell === max;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onPick(cell)}
              className={cn(
                "font-numeric relative grid h-9 place-items-center text-[13.5px] font-semibold transition",
                endpoint
                  ? "bg-accent rounded-lg text-white"
                  : inRange
                    ? "bg-accent-tint text-accent"
                    : disabled
                      ? "text-faint/40"
                      : "text-ink hover:bg-bg rounded-lg",
              )}
            >
              {d}
              {isToday && !endpoint && (
                <span className="bg-accent absolute bottom-1 h-1 w-1 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
