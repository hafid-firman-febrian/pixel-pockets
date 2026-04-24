import Navbar from "@/components/Navbar";
import HomeDashboard from "@/components/home/HomeDashboard";
import { listTransactions } from "@/lib/server/transactions.repo";

export default async function Home() {
  const transactions = await listTransactions();

  return (
    <>
      <Navbar />
      <HomeDashboard transactions={transactions} />
    </>
  );
}
