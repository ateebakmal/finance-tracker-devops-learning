import { useTransaction } from "./features/transactions/useTransaction";
import { useProfile } from "./features/profiles/useProfile";
import { useQueryClient } from "@tanstack/react-query";
function Test() {
  const { activeProfileId } = useProfile();
  const queryClient = useQueryClient();

  const data = queryClient.getQueriesData({
    queryKey: ["transactions", activeProfileId, "all"],
  });
  console.log(data);
  return <div className="space-y-5">Test</div>;
}

export default Test;
