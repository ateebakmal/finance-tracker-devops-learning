import { money, signed, masked } from "@/lib/money";
import { cn } from "@/lib/utils";

// sign: "income" | "expense" | undefined (neutral). masked -> privacy mode.
// Pass className to override color (e.g. text-white on the indigo hero).
export default function Money({ value, sign, masked: isMasked, className }) {
  let text = money(value);
  let color = "text-ink";

  if (isMasked) {
    text = masked();
  } else if (sign === "income") {
    text = signed(value, true);
    color = "text-pos";
  } else if (sign === "expense") {
    text = signed(value, false);
    color = "text-neg";
  } else if (sign == "-") {
    text = `${sign}${text}`;
  }

  return (
    <span className={cn("font-numeric tabular-nums", color, className)}>
      {text}
    </span>
  );
}
