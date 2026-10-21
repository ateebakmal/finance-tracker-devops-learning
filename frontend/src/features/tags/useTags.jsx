import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

async function getTags(profileId) {
  const result = await api.get(`/profiles/${profileId}/tags`);
  return result.data;
}

export function useTags(profileId) {
  return useQuery({
    queryKey: queryKeys.tags.byProfileId.all(profileId),
    queryFn: () => getTags(profileId),
    enabled: !!profileId,
  });
}
