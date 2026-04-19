import { formatCurrency } from "@/lib/dashboard";

interface SummaryCardProps {
  income: number;
  expense: number;
  filterLabel: string;
  transactionCount: number;
}

interface SummaryItemProps {
  title: string;
  value: number;
  accentClassName: string;
  surfaceClassName: string;
}

function SummaryItem({
  title,
  value,
  accentClassName,
  surfaceClassName,
}: SummaryItemProps) {
  return (
    <div className={`border border-black p-4 ${surfaceClassName}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.3em] ${accentClassName}`}>
        {title}
      </p>
      <p className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export default function SummaryCard({
  income,
  expense,
  filterLabel,
  transactionCount,
}: SummaryCardProps) {
  return (
    <section className="border border-black bg-white p-4">
      <div className="flex flex-col gap-2 border-b border-dashed border-slate-300 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">
            /summary
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Snapshot for {filterLabel}
          </h2>
        </div>

        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          [ sourced from {transactionCount} transaction rows ]
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SummaryItem
          title="Total Income"
          value={income}
          accentClassName="text-green-700"
          surfaceClassName="bg-green-100"
        />
        <SummaryItem
          title="Total Expense"
          value={expense}
          accentClassName="text-red-700"
          surfaceClassName="bg-red-100"
        />
      </div>
    </section>
  );
}
