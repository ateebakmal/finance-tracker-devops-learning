import Money from "@/components/Money.jsx";
import { api, getApiErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "../profiles/useProfile";
import { Spinner } from "@/components/ui/Spinner";

function Sparkline() {
  // Decorative only (design doc: sparkline lives inside the hero). Real data later.
  return (
    <svg
      viewBox="0 0 120 40"
      preserveAspectRatio="none"
      className="h-10 w-28 text-white/90"
      fill="none"
    >
      <polyline
        points="0,30 15,22 30,26 45,12 60,18 75,9 90,16 105,6 120,11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatPanel({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.13] px-4 py-3">
      <p className="text-[11.5px] font-semibold text-white/70">{label}</p>
      <Money
        value={value}
        className="mt-1 block text-[18px] font-semibold text-white"
      />
    </div>
  );
}

async function fetchSummaryData(profileId) {
  const res = await api.get(`/profiles/${profileId}/transactions/summary`);
  return res.data;
}

export default function HeroCard() {
  const { activeProfileId } = useProfile();
  console.log(activeProfileId);

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.transactions.byProfileId.summary(activeProfileId),
    queryFn: () => fetchSummaryData(activeProfileId),
    enabled: !!activeProfileId,
    staleTime: 5 * 60 * 1000,
    refetchOnReconnect: true,
  });

  if (isPending)
    return (
      <section className="bg-accent mx-5 mt-5 overflow-hidden rounded-[26px] p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <Spinner />
          </div>
          <Sparkline />
        </div>
      </section>
    );

  // `error` is an Error object -- rendering it directly throws "Objects are not
  // valid as a React child" and takes the whole page down with it.
  if (isError)
    return (
      <div className="text-neg mx-5 mt-5 text-[13px]">
        {getApiErrorMessage(error)}
      </div>
    );

  if (data)
    return (
      <section className="bg-accent mx-5 mt-5 overflow-hidden rounded-[26px] p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.1em] text-white/70 uppercase">
              Total balance · Home
            </p>
            <Money
              value={data.balance}
              sign={data.balance < data.income ? "-" : null}
              className="mt-2 block text-[42px] leading-none font-semibold tracking-[-0.8px] text-white"
            />
          </div>
          <Sparkline />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatPanel label="Income" value={data.income} />
          <StatPanel label="Spending" value={data.expense} />
        </div>
      </section>
    );
}
