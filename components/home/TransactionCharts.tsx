"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatCurrency,
  type CategoryDatum,
  type TrendDatum,
} from "@/lib/dashboard";

interface TransactionChartsProps {
  trendData: TrendDatum[];
  categoryData: CategoryDatum[];
  filterLabel: string;
}

interface ChartPanelProps {
  title: string;
  caption: string;
  children: ReactNode;
}

const PIE_COLORS = [
  "#facc15",
  "#f97316",
  "#ef4444",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#84cc16",
  "#ec4899",
  "#8b5cf6",
  "#a16207",
  "#334155",
];

const emptySubscribe = () => () => {};

function ChartPanel({ title, caption, children }: ChartPanelProps) {
  return (
    <div className="border border-black bg-white p-4">
      <div className="mb-4 space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
          {caption}
        </p>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      </div>

      {children}
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm leading-6 text-slate-500">
      {message}
    </div>
  );
}

export default function TransactionCharts({
  trendData,
  categoryData,
  filterLabel,
}: TransactionChartsProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <ChartPanel
        title="Income vs Expense Trend"
        caption={`[ trend chart / ${filterLabel} ]`}
      >
        {!isMounted ? (
          <EmptyChartState message="The trend chart is being prepared in the browser..." />
        ) : trendData.length === 0 ? (
          <EmptyChartState message="There are no transactions for this filter yet, so the trend chart cannot be displayed." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    border: "1px solid #000",
                    borderRadius: 0,
                    backgroundColor: "#fffef4",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#22c55e"
                  barSize="30"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#ef4444"
                  barSize="30"
                  radius={[0, 0, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartPanel>

      <ChartPanel
        title="Expense Categories"
        caption={`[ category chart / ${filterLabel} ]`}
      >
        {!isMounted ? (
          <EmptyChartState message="The category chart is being prepared in the browser..." />
        ) : categoryData.length === 0 ? (
          <EmptyChartState message="There are no expense transactions for this filter yet, so the category breakdown is still empty." />
        ) : (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={62}
                    outerRadius={102}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      border: "1px solid #000",
                      borderRadius: 0,
                      backgroundColor: "#fffef4",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {categoryData.map((item, index) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between gap-3 border border-black bg-slate-50 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <span
                      className="h-3 w-3 border border-black"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span>{item.category}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ChartPanel>
    </div>
  );
}
