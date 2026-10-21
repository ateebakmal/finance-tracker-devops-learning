import { cn } from "@/lib/utils";
import { useProfile } from "@/features/profiles/useProfile";
import { PlusIcon } from "@/components/icons";
import { useModal } from "./ModalProvider";
import { MODALS } from "./modal-types";

function ProfileRow({ name, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
        active ? "border-accent bg-accent-tint" : "border-line bg-card",
      )}
    >
      {/* initial chip — solid accent when active, neutral otherwise */}
      <div
        className={cn(
          "font-numeric grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] text-base font-semibold",
          active ? "bg-accent text-white" : "bg-[#F3F4F7] text-[#4A4F63]",
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>

      <p className="text-ink min-w-0 flex-1 truncate font-sans text-[15px] font-bold">
        {name}
      </p>

      <span
        className={cn(
          "font-sans text-[12px] font-bold",
          active ? "text-pos" : "text-faint",
        )}
      >
        {active ? "Active" : "Switch"}
      </span>
    </button>
  );
}

export default function SelectProfilesModal({ onClose }) {
  const { profiles, activeProfileId, setActiveProfile } = useProfile();
  const { openModal } = useModal();
  function handleSelect(id) {
    setActiveProfile(id);
    onClose?.();
  }

  return (
    <div className="space-y-2.5">
      {profiles.map((profile) => (
        <ProfileRow
          key={profile.id}
          name={profile.name}
          active={profile.id === activeProfileId}
          onSelect={() => handleSelect(profile.id)}
        />
      ))}

      {/* You own the create-profile logic — this is just the trigger */}
      <button
        type="button"
        onClick={() => {
          openModal(MODALS.CREATE_PROFILE);
        }}
        className="text-accent bg-accent-tint/50 mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C7CBF2] py-4 font-sans text-[14px] font-bold transition active:scale-[0.99]"
      >
        <span className="bg-accent grid h-6 w-6 place-items-center rounded-full text-white">
          <PlusIcon className="h-3.5 w-3.5" />
        </span>
        Create profile
      </button>
    </div>
  );
}
