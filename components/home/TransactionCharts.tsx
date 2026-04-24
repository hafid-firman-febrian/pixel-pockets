"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Rectangle,
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
const DEFAULT_VISIBLE_CATEGORIES = 5;

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
  const [showAllCategories, setShowAllCategories] = useState(false);
  const hiddenCategoryCount = Math.max(
    categoryData.length - DEFAULT_VISIBLE_CATEGORIES,
    0,
  );
  const visibleCategories = categoryData.slice(0, DEFAULT_VISIBLE_CATEGORIES);

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
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                barCategoryGap={16}
              >
                <CartesianGrid vertical={false} stroke="#cbd5e1" strokeDasharray="0" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#475569", fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    border: "2px solid #000",
                    borderRadius: "12px",
                    backgroundColor: "#fffef4",
                    boxShadow: "4px 4px 0 0 #000",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#22c55e"
                  barSize={34}
                  shape={(props) => (
                    <Rectangle
                      {...props}
                      radius={[0, 0, 0, 0]}
                      stroke="#000"
                      strokeWidth={2}
                    />
                  )}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#ef4444"
                  barSize={34}
                  shape={(props) => (
                    <Rectangle
                      {...props}
                      radius={[0, 0, 0, 0]}
                      stroke="#000"
                      strokeWidth={2}
                    />
                  )}
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
          <div className="space-y-2">
            {visibleCategories.map((item, index) => (
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

            {hiddenCategoryCount > 0 ? (
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  showAllCategories
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
                aria-hidden={!showAllCategories}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-2 pt-2">
                    {categoryData
                      .slice(DEFAULT_VISIBLE_CATEGORIES)
                      .map((item, index) => (
                        <div
                          key={item.category}
                          className="flex items-center justify-between gap-3 border border-black bg-slate-50 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2 text-slate-700">
                            <span
                              className="h-3 w-3 border border-black"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[
                                    (index + DEFAULT_VISIBLE_CATEGORIES) %
                                      PIE_COLORS.length
                                  ],
                              }}
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
              </div>
            ) : null}

            {hiddenCategoryCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowAllCategories((current) => !current)}
                aria-expanded={showAllCategories}
                className="mt-3 border border-black bg-white px-3 py-2 text-sm font-bold uppercase text-slate-900 transition-colors hover:bg-slate-100"
              >
                {showAllCategories ? "Less" : `More ${hiddenCategoryCount}+`}
              </button>
            ) : null}
          </div>
        )}
      </ChartPanel>
    </div>
  );
}
