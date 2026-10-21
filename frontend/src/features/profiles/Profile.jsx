import { useAuth } from "@/features/auth/AuthProvider";
import { useProfile } from "@/features/profiles/useProfile";
import Card from "@/components/Card";
import ProfileRow from "@/features/profiles/ProfileRow";
import { TagIcon, ListIcon, TargetIcon, RepeatIcon } from "@/components/icons";
import SettingsRow from "./SettingsRow";
import SettingsList from "./SettingsList";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";
import { useState } from "react";

function Eyebrow({ children }) {
  return (
    <p className="text-faint px-1 text-[11px] font-bold tracking-[0.1em] uppercase">
      {children}
    </p>
  );
}

export default function Profile() {
  const [loggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profiles, activeProfileId, setActiveProfile } = useProfile();

  const email = user?.email ?? "";
  const count = profiles.length;

  function handleLogout() {
    setIsLoggingOut(true);
    toast.promise(logout, {
      loading: "Logging out",
      success: () => {
        setIsLoggingOut(false);
        return "Logged out successfully";
      },
      error: (e) => getApiErrorMessage(e) ?? "Some error happened",
    });
  }

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 className="text-ink font-sans text-[22px] font-extrabold tracking-[-0.02em]">
        Profile
      </h1>
      {/* Account */}
      <Card className="flex items-center gap-4 p-4">
        <div className="bg-accent font-numeric grid h-14 w-14 place-items-center rounded-2xl text-2xl font-semibold text-white">
          {(email || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-ink truncate font-sans text-[17px] font-extrabold">
            {email}
          </p>
          <p className="text-muted text-[13px] font-semibold">
            managing {count} {count === 1 ? "profile" : "profiles"}
          </p>
        </div>
      </Card>
      {/* Profiles */}
      <div className="space-y-2.5">
        <Eyebrow>Profiles</Eyebrow>
        {profiles.map((p) => (
          <ProfileRow
            key={p.id}
            name={p.name}
            active={p.id === activeProfileId}
            onSelect={() => setActiveProfile(p.id)}
          />
        ))}
      </div>
      {/* Settings */}
      <div className="space-y-2.5">
        <Eyebrow>Settings</Eyebrow>
        <SettingsList>
          <SettingsRow
            icon={TagIcon}
            label="Categories"
            onClick={() => {
              navigate("categories");
            }}
          />
          <SettingsRow
            icon={ListIcon}
            label="Tags"
            onClick={() => {
              navigate("tags");
            }}
          />
          <SettingsRow icon={TargetIcon} label="Budgets" onClick={() => {}} />
          <SettingsRow
            icon={RepeatIcon}
            label="Recurring Transactions"
            onClick={() => {}}
          />
          <SettingsRow
            icon={RepeatIcon}
            label="Test page"
            onClick={() => {
              navigate("/test");
            }}
          />
          {/* <SettingsRow
            icon={BellIcon}
            label="Notifications"
            value="On"
            onClick={() => {}}
          />
          <SettingsRow
            icon={DownloadIcon}
            label="Export data"
            value="CSV"
            onClick={() => {}}
          />
          <SettingsRow
            icon={WalletIcon}
            label="Currency"
            value="PKR"
            onClick={() => {}}
          /> */}
        </SettingsList>
      </div>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="border-line bg-card text-neg flex w-full items-center justify-center gap-2 rounded-2xl border py-4 font-sans text-[15px] font-bold transition active:scale-[0.99]"
      >
        {/* <LogOutIcon className="h-5 w-5" /> */}
        Log out
      </button>
    </div>
  );
}

// todo: Take care of logout error
// const [error, setError] = useState(null);

// async function handleLogout() {
//   try {
//     await logout();
//     // success: user is now null -> ProtectedRoutes redirects to /login
//   } catch {
//     setError("Couldn't log out. Check your connection and try again.");
//   }
// }
