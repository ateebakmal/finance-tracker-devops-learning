import Button from "@/components/Button.jsx";
import { BellIcon, ChevronDownIcon } from "@/components/icons";
import { useProfile } from "../profiles/useProfile";
import { useModal } from "@/components/modal/ModalProvider";
import { MODALS } from "@/components/modal/modal-types";

export default function Header() {
  const { activeProfile } = useProfile();
  const { openModal } = useModal();
  const name = activeProfile?.name ?? "...";

  console.log(activeProfile);

  return (
    <header className="flex items-center justify-between px-5 pt-6">
      <div className="flex items-center gap-3">
        {/* Avatar — later: initial + color from the active profile */}
        <div className="bg-accent-tint font-numeric text-accent grid h-11 w-11 place-items-center rounded-2xl text-lg font-semibold">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="leading-tight">
          <p className="text-muted text-[12px] font-semibold">Hi, Ateeb</p>
          {/* The profile switcher — will open the switch sheet later */}
          <button
            className="text-ink flex items-center gap-1 font-sans text-[17px] font-extrabold"
            onClick={() => {
              openModal(MODALS.SWITCH_PROFILE);
            }}
          >
            {name}
            <ChevronDownIcon className="text-faint h-4 w-4" />
          </button>
        </div>
      </div>

      <Button variant="icon" aria-label="Notifications">
        <BellIcon className="h-5 w-5" />
      </Button>
    </header>
  );
}
