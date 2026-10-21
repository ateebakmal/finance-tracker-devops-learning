import { cn } from "@/lib/utils";

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn("border-line bg-card rounded-[20px] border", className)}
      {...props}
    >
      {children}
    </div>
  );
}
