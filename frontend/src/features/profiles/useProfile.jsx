import { createContext, useEffect, useState, useMemo, useContext } from "react";
import { useAuth } from "../auth/AuthProvider";

function storageKey(userId) {
  return `finance:activeProfileId:${userId}`;
}

const ProfileContext = createContext(null);

//Things we need to do, when our app starts, choose which profile to show?
// When profile changes persist it into local storage

function ProfileProvider({ children }) {
  const { user } = useAuth();
  const profiles = useMemo(() => user?.profiles ?? [], [user]);

  const [activeProfileId, setActiveProfileId] = useState(null);

  // DECIDE: when the user loads decide which profile to show.
  useEffect(() => {
    if (!user) {
      setActiveProfileId(null);
      return;
    }

    const saved = localStorage.getItem(storageKey(user.id));

    // Check if saved profile id is still correct for the user
    const savedIsValid = profiles.some((p) => p.id === saved);

    setActiveProfileId(savedIsValid ? saved : (profiles[0]?.id ?? null));
  }, [profiles, user]);

  // Persist, remember whenever profile changes
  useEffect(() => {
    if (user && activeProfileId != null) {
      localStorage.setItem(storageKey(user.id), String(activeProfileId));
    }
  }, [user, activeProfileId]);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId],
  );

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      activeProfileId,
      setActiveProfile: setActiveProfileId,
    }),
    [profiles, activeProfile, activeProfileId],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }

  return context;
}

export default ProfileProvider;
