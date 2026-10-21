import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"];

export default function AmountKeypad({ onDigit, onTripleZero, onBackspace }) {
  function press(k) {
    if (k === "back") onBackspace();
    else if (k === "000") onTripleZero();
    else onDigit(Number(k));
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => press(k)}
          className="border-line bg-card text-ink active:bg-bg font-numeric grid h-14 place-items-center rounded-2xl border text-[20px] font-semibold transition"
        >
          {k === "back" ? (
            <ChevronLeftIcon className="text-muted h-5 w-5" />
          ) : (
            k
          )}
        </button>
      ))}
    </div>
  );
}
