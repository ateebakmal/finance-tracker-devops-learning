import SectionHeader from "@/components/SectionHeader";
import { useAuth } from "../auth/AuthProvider";
import Header from "./Header";
import HeroCard from "./HeroCard";
import QuickActions from "./QuickActions";
import TransactionList from "./TransactionList";
import { useProfile } from "../profiles/useProfile";
import { useTransaction } from "../transactions/useTransactions";
function Dashboard() {
  const { user, accessToken } = useAuth();
  const { profiles, activeProfile, activeProfileId } = useProfile();
  const { data: transactions, isLoading } = useTransaction(activeProfileId, {
    limit: 10,
  });
  console.log(profiles);
  console.log(activeProfile);
  console.log(activeProfileId);

  console.log(user, accessToken);
  return (
    <div>
      <Header />
      <HeroCard />
      <QuickActions />

      <div className="mt-7 space-y-1">
        <SectionHeader title="Recent activity" action="See all" />
        <TransactionList items={transactions} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default Dashboard;
