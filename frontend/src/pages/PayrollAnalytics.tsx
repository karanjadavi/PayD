import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { Card } from '@stellar/design-system';
import { parseDateString } from '../utils/dateHelpers';

// recharts v3 + React 19: Legend's class-component typings conflict with React.JSX.
// Cast it to a plain functional component to keep TypeScript happy.
const SafeLegend = Legend as unknown as React.FC<object>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface PayrollTrend {
  month: string;
  total: number;
}

// ChartDataInput (recharts v3) requires an index signature on data entries.
interface CurrencyShare {
  currency: string;
  value: number;
  [key: string]: unknown;
}

interface PaymentMetric {
  month: string;
  success: number;
  failure: number;
  [key: string]: unknown;
}

interface AnalyticsData {
  trends: PayrollTrend[];
  currencyBreakdown: CurrencyShare[];
  paymentMetrics: PaymentMetric[];
}

// recharts v3 Formatter receives ValueType | undefined
type RechartsValue = number | string | readonly (number | string)[] | undefined;

// ── Mock fetch (replace with real API call when endpoint is available) ────────

async function fetchAnalytics(startDate: string, endDate: string): Promise<AnalyticsData> {
  // Simulates an API call — swap for `axios.get('/api/analytics/payroll', { params })`
  await new Promise((r) => setTimeout(r, 300));

  const start = parseDateString(startDate) ?? new Date();
  const end = parseDateString(endDate) ?? new Date();

  const trends: PayrollTrend[] = [];
  const metrics: PaymentMetric[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    const label = cursor.toLocaleString('default', { month: 'short', year: '2-digit' });
    trends.push({ month: label, total: Math.floor(Math.random() * 40000) + 10000 });
    metrics.push({
      month: label,
      success: Math.floor(Math.random() * 90) + 60,
      failure: Math.floor(Math.random() * 15),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    trends,
    currencyBreakdown: [
      { currency: 'USDC', value: 62 },
      { currency: 'XLM', value: 28 },
      { currency: 'EURC', value: 10 },
    ],
    paymentMetrics: metrics,
  };
}

// ── Chart colors ──────────────────────────────────────────────────────────────

const PIE_COLORS = ['#6366f1', '#22d3ee', '#f59e0b'];

// ── Animation variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PayrollAnalytics() {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ['payroll-analytics', startDate, endDate],
    queryFn: () => fetchAnalytics(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-start px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl space-y-6 sm:space-y-8">
        <div className="card glass noise border-[var(--border-hi)] p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
            Data Insights
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-[var(--text)]">
            Payroll <span className="text-[var(--accent)]">Analytics</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-6 text-[var(--muted)] max-w-3xl">
            Comprehensive trends, currency distribution, and payment success metrics to help you
            make informed decisions.
          </p>
        </div>

        {/* Date range filter */}
        <Card>
          <div className="p-4 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)] mb-4">
              Date Range Filter
            </p>
            <div className="flex flex-wrap gap-4 sm:gap-6 items-end">
              <div className="flex-1 min-w-[200px]">
                <label
                  htmlFor="start-date"
                  className="block text-sm font-semibold text-[var(--text)] mb-2"
                >
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl p-3 text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                  aria-label="Select start date for analytics"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label
                  htmlFor="end-date"
                  className="block text-sm font-semibold text-[var(--text)] mb-2"
                >
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl p-3 text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                  aria-label="Select end date for analytics"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        {data && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={cardVariants}>
              <Card>
                <div className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
                    Total Payroll
                  </p>
                  <h3 className="text-3xl sm:text-4xl font-black mt-2 text-[var(--accent)]">
                    $
                    {data.trends
                      .reduce((acc: number, curr: PayrollTrend) => acc + curr.total, 0)
                      .toLocaleString()}
                  </h3>
                  <p className="text-xs text-[var(--success)] mt-3 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <span>12% vs last period</span>
                  </p>
                </div>
              </Card>
            </motion.div>
            <motion.div variants={cardVariants}>
              <Card>
                <div className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
                    Avg. Salary
                  </p>
                  <h3 className="text-3xl sm:text-4xl font-black mt-2 text-[var(--accent2)]">
                    $5,420
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-3">Across 42 employees</p>
                </div>
              </Card>
            </motion.div>
            <motion.div variants={cardVariants} className="sm:col-span-2 lg:col-span-1">
              <Card>
                <div className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
                    Payment Success
                  </p>
                  <h3 className="text-3xl sm:text-4xl font-black mt-2 text-[#f59e0b]">98.4%</h3>
                  <p className="text-xs text-[var(--muted)] mt-3">Historical average</p>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--border)] border-t-[var(--accent)]" />
            <p className="mt-4 text-[var(--muted)]">Loading analytics…</p>
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(255,123,114,0.1)] border border-[rgba(255,123,114,0.2)] mb-4">
              <svg
                className="w-6 h-6 text-[var(--danger)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-[var(--danger)] font-semibold">Failed to load analytics data.</p>
            <p className="text-[var(--muted)] text-sm mt-2">Please try again later.</p>
          </div>
        )}

        {data && (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Line chart — payroll over time */}
            <motion.div variants={cardVariants}>
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-[var(--text)] mb-1">
                    Total Payroll Over Time
                  </h2>
                  <p className="text-xs text-[var(--muted)] mb-4">
                    Monthly payroll expenditure trends
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: 'var(--muted)' }}
                        stroke="var(--border)"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'var(--muted)' }}
                        tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                        stroke="var(--border)"
                      />
                      <Tooltip
                        formatter={(v: RechartsValue) => [
                          `$${Number(Array.isArray(v) ? v[0] : (v ?? 0)).toLocaleString()}`,
                          'Total',
                        ]}
                        contentStyle={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <SafeLegend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Payroll Total"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#6366f1' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* Pie chart — currency breakdown */}
            <motion.div variants={cardVariants}>
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-[var(--text)] mb-1">
                    Cost Breakdown by Currency
                  </h2>
                  <p className="text-xs text-[var(--muted)] mb-4">
                    Distribution of payroll across different assets
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.currencyBreakdown}
                        dataKey="value"
                        nameKey="currency"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(props: PieLabelRenderProps) => {
                          const d = props as PieLabelRenderProps & {
                            currency?: string;
                            value?: number;
                          };
                          return `${d.currency ?? ''} ${d.value ?? 0}%`;
                        }}
                      >
                        {data.currencyBreakdown.map((item: CurrencyShare) => (
                          <Cell
                            key={item.currency}
                            fill={
                              PIE_COLORS[data.currencyBreakdown.indexOf(item) % PIE_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: RechartsValue) => [
                          `${String(Array.isArray(v) ? v[0] : (v ?? 0))}%`,
                          'Share',
                        ]}
                        contentStyle={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <SafeLegend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* Bar chart — success/failure rate */}
            <motion.div variants={cardVariants} className="lg:col-span-2">
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-[var(--text)] mb-1">
                    Payment Success / Failure Rate
                  </h2>
                  <p className="text-xs text-[var(--muted)] mb-4">
                    Monthly transaction success and failure metrics
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.paymentMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: 'var(--muted)' }}
                        stroke="var(--border)"
                      />
                      <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} stroke="var(--border)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <SafeLegend />
                      <Bar
                        dataKey="success"
                        name="Successful"
                        fill="#22d3ee"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar dataKey="failure" name="Failed" fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
