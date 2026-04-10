"use client"; // WAJIB: Karena menggunakan useState

import { useState, ReactNode } from "react";

// 1. Definisi Interface untuk Props TabSummary
interface TabSummaryProps {
  children: ReactNode;
  isActive: boolean;
  onClick: () => void;
  activeColor: string;
}

function TabSummary({
  children,
  isActive,
  onClick,
  activeColor,
}: TabSummaryProps) {
  return (
    <button
      onClick={onClick}
      type="button" // Standar aksesibilitas untuk tombol dalam form/app
      className={`w-full p-2 border border-black transition-colors duration-200 font-mono ${
        isActive ? activeColor : "bg-white hover:bg-gray-100 text-black"
      }`}
    >
      {children}
    </button>
  );
}

// 2. Definisi Interface untuk Props SummaryContent
interface SummaryContentProps {
  children: ReactNode;
  bgColor: string;
}

function SummaryContent({ children, bgColor }: SummaryContentProps) {
  return (
    <div
      className={`w-full p-4 mt-4 border border-black transition-colors duration-300 ${bgColor}`}
    >
      {children}
    </div>
  );
}

type TabType = "income" | "expense";

export default function SummaryCard() {
  const [activeTab, setActiveTab] = useState<TabType>("income");

  return (
    <div className="block p-2 border border-black bg-white">
      <div className="flex gap-2">
        <TabSummary
          isActive={activeTab === "income"}
          onClick={() => setActiveTab("income")}
          activeColor="bg-green-500 text-white"
        >
          [ My Incomes ]
        </TabSummary>

        <TabSummary
          isActive={activeTab === "expense"}
          onClick={() => setActiveTab("expense")}
          activeColor="bg-red-500 text-white"
        >
          [ My Expenses ]
        </TabSummary>
      </div>

      <SummaryContent
        bgColor={activeTab === "income" ? "bg-green-100" : "bg-red-100"}
      >
        {activeTab === "income" ? (
          <div className="text-green-900 font-medium animate-in fade-in duration-500">
            <h4 className="text-sm uppercase tracking-tighter font-bold">
              Total Pemasukan
            </h4>
            <p className="text-3xl font-mono">Rp 5.000.000</p>
          </div>
        ) : (
          <div className="text-red-900 font-medium animate-in fade-in duration-500">
            <h4 className="text-sm uppercase tracking-tighter font-bold">
              Total Pengeluaran
            </h4>
            <p className="text-3xl font-mono">Rp 2.500.000</p>
          </div>
        )}
      </SummaryContent>
    </div>
  );
}
