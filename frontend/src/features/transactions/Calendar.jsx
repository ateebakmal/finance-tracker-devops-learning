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

// local YYYY-MM-DD (avoids the UTC shift that toISOString() causes)
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight
}

export default function Calendar({ value, max, onChange }) {
  const selected = value ? fromISO(value) : null;
  const maxDate = max ? fromISO(max) : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISO(today);

  // which month is on screen — start on the selected date's month, else today
  const [view, setView] = useState(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // leading blanks to line up the 1st under the right weekday
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // can't page into a month entirely in the future
  const canNext = maxDate
    ? year < maxDate.getFullYear() ||
      (year === maxDate.getFullYear() && month < maxDate.getMonth())
    : true;

  return (
    <div className="border-line bg-card rounded-2xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="border-line text-muted grid h-8 w-8 place-items-center rounded-lg border"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <p className="text-ink font-sans text-[14.5px] font-bold">
          {MONTHS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => canNext && setView(new Date(year, month + 1, 1))}
          disabled={!canNext}
          className={cn(
            "border-line grid h-8 w-8 place-items-center rounded-lg border",
            canNext ? "text-muted" : "text-faint/40 cursor-not-allowed",
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
        {cells.map((day, i) => {
          if (day == null) return <div key={i} />;
          const cellDate = new Date(year, month, day);
          const iso = toISO(cellDate);
          const disabled = maxDate ? cellDate > maxDate : false;
          const isSelected = value === iso;
          const isToday = iso === todayISO;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(iso)}
              className={cn(
                "font-numeric relative grid h-9 place-items-center rounded-lg text-[13.5px] font-semibold transition",
                disabled && "text-faint/40 cursor-not-allowed",
                !disabled && !isSelected && "text-ink hover:bg-bg",
                isSelected && "bg-accent text-white",
              )}
            >
              {day}
              {isToday && !isSelected && (
                <span className="bg-accent absolute bottom-1 h-1 w-1 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
