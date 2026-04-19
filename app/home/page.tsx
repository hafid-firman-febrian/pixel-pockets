import Navbar from "@/components/Navbar";
import HomeDashboard from "@/components/home/HomeDashboard";
import { dummyTransactions } from "@/lib/transactions";

export default function Home() {
  return (
    <>
      <Navbar />
      <HomeDashboard transactions={dummyTransactions} />
    </>
  );
}
