// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetDescription,
// } from "@/components/ui/sheet";
// import { cn } from "@/lib/utils";

// export default function AppModal({
//   open,
//   onClose,
//   title,
//   description,
//   children,
//   contentClassName = "",
// }) {
//   function handleOpenChange(nextOpen) {
//     if (!nextOpen) onClose();
//   }

//   return (
//     <Sheet open={open} onOpenChange={handleOpenChange}>
//       <SheetContent
//         side="bottom"
//         showCloseButton={false}
//         className={cn(
//           "mx-auto w-full max-w-md",
//           "border-line bg-card text-ink rounded-t-[28px] p-0",
//           // Smooth full slide-up (design doc §7). These override the built-in
//           // 2.5rem nudge / 200ms / ease-in-out via tailwind-merge.
//           "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
//           "data-[side=bottom]:data-starting-style:translate-y-full",
//           "data-[side=bottom]:data-ending-style:translate-y-full",
//           contentClassName,
//         )}
//       >
//         {/* grab handle */}
//         <div className="bg-line mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full" />

//         <SheetHeader className="px-5 pt-3 pb-3 text-left">
//           <SheetTitle className="text-ink font-sans text-[22px] font-extrabold tracking-tight">
//             {title}
//           </SheetTitle>
//           {description ? (
//             <SheetDescription className="text-muted text-[13px]">
//               {description}
//             </SheetDescription>
//           ) : null}
//         </SheetHeader>

//         <div className="px-5 pb-8">{children}</div>
//       </SheetContent>
//     </Sheet>
//   );
// }

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function AppModal({
  open,
  onClose,
  title,
  description,
  children,
  contentClassName = "",
}) {
  function handleOpenChange(nextOpen) {
    if (!nextOpen) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          // centered, mobile-safe margins, capped height so tall modals scroll
          "mx-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto",
          // Quiet look: full rounding (not just top), hairline, our tokens
          "border-line bg-card text-ink rounded-[26px] p-0",
          contentClassName,
        )}
      >
        <DialogHeader className="px-5 pt-6 pb-3 text-left">
          <DialogTitle className="text-ink font-sans text-[20px] font-extrabold tracking-tight">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-muted text-[13px]">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="px-5 pb-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
