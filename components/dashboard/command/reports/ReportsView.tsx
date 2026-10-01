// components/dashboard/command/reports/ReportsView.tsx
'use client'
import { useState, useEffect } from 'react'
import type {
  CompletionRateRow,
  OverdueTaskRow,
  AvgApprovalTimeRow,
  WeeklyTrendPoint,
  ReturnRateRow,
  PeriodType,
} from '@/lib/db/reports'
import {
  BarChart3,
  AlertTriangle,
  Clock,
  RotateCcw,
  Download,
  Calendar,
  Filter,
  Loader2,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { exportReportCSVAction } from '@/app/(dashboard)/command/reports/actions'

type ReportTab = 'completion_rate' | 'overdue' | 'avg_approval' | 'return_rate'

interface ReportsViewProps {
  initialCompletion: { rows: CompletionRateRow[]; periodLabel: string }
  initialOverdue: { rows: OverdueTaskRow[]; byPillarSummary: { pillarName: string; overdueCount: number }[] }
  initialAvgApproval: { rows: AvgApprovalTimeRow[]; weeklyTrend: WeeklyTrendPoint[] }
  initialReturnRate: { rows: ReturnRateRow[]; totals: { submitted: number; returned: number; returnRate: number } }
}

const DONUT_COLORS = ['#B9FBC2', '#FF6300', '#CFC1FC', '#FF9A50', '#2A4954']

export function ReportsView({
  initialCompletion,
  initialOverdue,
  initialAvgApproval,
  initialReturnRate,
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('completion_rate')
  const [period, setPeriod] = useState<PeriodType>('this_month')
  const [pillarFilter, setPillarFilter] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter overdue tasks by pillar if selected
  const filteredOverdueRows = pillarFilter
    ? initialOverdue.rows.filter((r) => r.pillarId === pillarFilter)
    : initialOverdue.rows

  // Chart data for completion rate
  const completionChartData = initialCompletion.rows.map((r) => ({
    name: r.nickname || r.pillarName,
    Assigned: r.assignedCount,
    Completed: r.completedCount,
    'Rate %': r.completionRate,
  }))

  // Chart data for overdue tasks
  const overdueChartData = initialOverdue.byPillarSummary.map((s) => ({
    name: s.pillarName,
    Overdue: s.overdueCount,
  }))

  // Chart data for return rate donut
  const returnRatePieData = [
    { name: 'Approved / Clean', value: Math.max(0, initialReturnRate.totals.submitted - initialReturnRate.totals.returned) },
    { name: 'Returned', value: initialReturnRate.totals.returned },
  ]

  // CSV Export handler
  async function handleExportCSV() {
    setDownloading(true)
    try {
      const res = await exportReportCSVAction(activeTab, {
        period,
        pillarId: pillarFilter || undefined,
      })

      if (res.data?.csv) {
        const blob = new Blob([res.data.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.data.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (res.error) {
        alert(`Export failed: ${res.error}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: '24px',
        alignItems: 'start',
      }}
      className="reports-container"
    >
      {/* Left Sidebar Navigation */}
      <nav
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Report Types
        </div>

        <button
          onClick={() => setActiveTab('completion_rate')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: activeTab === 'completion_rate' ? 'rgba(185,251,194,0.12)' : 'transparent',
            color: activeTab === 'completion_rate' ? 'var(--color-accent)' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'completion_rate' ? 600 : 400,
            transition: 'all 120ms ease',
          }}
          id="report-tab-completion"
        >
          <BarChart3 size={16} />
          Completion Rate
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: activeTab === 'overdue' ? 'rgba(255,99,0,0.12)' : 'transparent',
            color: activeTab === 'overdue' ? 'var(--color-orange)' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'overdue' ? 600 : 400,
            transition: 'all 120ms ease',
          }}
          id="report-tab-overdue"
        >
          <AlertTriangle size={16} />
          Overdue Tasks
        </button>

        <button
          onClick={() => setActiveTab('avg_approval')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: activeTab === 'avg_approval' ? 'rgba(207,193,252,0.15)' : 'transparent',
            color: activeTab === 'avg_approval' ? 'var(--color-lavender)' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'avg_approval' ? 600 : 400,
            transition: 'all 120ms ease',
          }}
          id="report-tab-approval"
        >
          <Clock size={16} />
          Avg Approval Time
        </button>

        <button
          onClick={() => setActiveTab('return_rate')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: activeTab === 'return_rate' ? 'rgba(185,251,194,0.12)' : 'transparent',
            color: activeTab === 'return_rate' ? 'var(--color-accent)' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: activeTab === 'return_rate' ? 600 : 400,
            transition: 'all 120ms ease',
          }}
          id="report-tab-return"
        >
          <RotateCcw size={16} />
          Return Rate
        </button>
      </nav>

      {/* Main Report Content */}
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        {/* Top Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {activeTab === 'completion_rate' && 'Completion Rate by Pillar'}
              {activeTab === 'overdue' && 'Overdue Tasks by Pillar'}
              {activeTab === 'avg_approval' && 'Average Assignment → Approval Time'}
              {activeTab === 'return_rate' && 'Submission Return Rate'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {activeTab === 'completion_rate' && `Period: ${initialCompletion.periodLabel}`}
              {activeTab === 'overdue' && `Total overdue: ${initialOverdue.rows.length} tasks`}
              {activeTab === 'avg_approval' && 'Historical cycle time over the last 12 weeks'}
              {activeTab === 'return_rate' && `Overall return rate: ${initialReturnRate.totals.returnRate}%`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Period selector for completion rate */}
            {activeTab === 'completion_rate' && (
              <select
                className="input"
                style={{ width: 'auto', fontSize: '12px', padding: '6px 12px' }}
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="all_time">All Time</option>
              </select>
            )}

            {/* Pillar filter for overdue report */}
            {activeTab === 'overdue' && (
              <select
                className="input"
                style={{ width: 'auto', fontSize: '12px', padding: '6px 12px' }}
                value={pillarFilter}
                onChange={(e) => setPillarFilter(e.target.value)}
              >
                <option value="">All Pillars</option>
                {initialCompletion.rows.map((r) => (
                  <option key={r.pillarId} value={r.pillarId}>
                    {r.pillarName}
                  </option>
                ))}
              </select>
            )}

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={downloading}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              id="export-csv-btn"
            >
              {downloading ? (
                <>
                  <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Exporting…
                </>
              ) : (
                <>
                  <Download size={13} />
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* REPORT 1: Completion Rate */}
        {activeTab === 'completion_rate' && (
          <div>
            {/* Chart */}
            <div
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '16px 12px 10px 4px',
                height: 250,
                marginBottom: '20px',
              }}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#1B2E34',
                        borderColor: '#2A4954',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                    <Bar dataKey="Assigned" fill="#2A4954" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Completed" fill="#B9FBC2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Pillar</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Assigned</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Completed</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Rate %</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Period</th>
                  </tr>
                </thead>
                <tbody>
                  {initialCompletion.rows.map((r) => (
                    <tr key={r.pillarId} style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{r.pillarName}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.assignedCount}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-accent)' }}>{r.completedCount}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{r.completionRate}%</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>{r.period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 2: Overdue Tasks */}
        {activeTab === 'overdue' && (
          <div>
            {/* Chart */}
            <div
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '16px 12px 10px 4px',
                height: 220,
                marginBottom: '20px',
              }}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={overdueChartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={90} />
                    <Tooltip
                      contentStyle={{
                        background: '#1B2E34',
                        borderColor: '#2A4954',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="Overdue" fill="#FF6300" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Pillar</th>
                    <th style={{ padding: '10px 12px' }}>Head</th>
                    <th style={{ padding: '10px 12px' }}>Task Title</th>
                    <th style={{ padding: '10px 12px' }}>Due Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverdueRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No overdue tasks found! Great work! 🎉
                      </td>
                    </tr>
                  ) : (
                    filteredOverdueRows.map((r) => (
                      <tr key={r.taskId} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{r.pillarName}</td>
                        <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{r.headName}</td>
                        <td style={{ padding: '12px', fontWeight: 500 }}>{r.taskTitle}</td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{r.dueDate}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#FF6300', fontWeight: 700 }}>
                          +{r.daysOverdue} d
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 3: Average Approval Time */}
        {activeTab === 'avg_approval' && (
          <div>
            {/* 12-week Trend Line Chart */}
            <div
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '16px 12px 10px 4px',
                height: 250,
                marginBottom: '20px',
              }}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={initialAvgApproval.weeklyTrend} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: '#1B2E34',
                        borderColor: '#2A4954',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                    <Line type="monotone" dataKey="avgDays" name="Avg Days to Approval" stroke="#B9FBC2" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Pillar</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Avg Days</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Min Days</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Max Days</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Sample Size</th>
                  </tr>
                </thead>
                <tbody>
                  {initialAvgApproval.rows.map((r) => (
                    <tr key={r.pillarId} style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{r.pillarName}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-accent)', fontWeight: 600 }}>{r.avgDays} d</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.minDays} d</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.maxDays} d</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>{r.sampleSize} tasks</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 4: Return Rate */}
        {activeTab === 'return_rate' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              {/* Donut Chart */}
              <div
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '16px',
                  height: 240,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={returnRatePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="#B9FBC2" />
                        <Cell fill="#FF6300" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#1B2E34',
                          borderColor: '#2A4954',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Summary Stats Card */}
              <div
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overall First-Submission Return Rate</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: initialReturnRate.totals.returnRate > 30 ? '#FF6300' : 'var(--color-accent)' }}>
                    {initialReturnRate.totals.returnRate}%
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Submitted</span>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{initialReturnRate.totals.submitted}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Returned</span>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#FF6300' }}>{initialReturnRate.totals.returned}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Pillar</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Submitted</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Returned</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Return Rate %</th>
                  </tr>
                </thead>
                <tbody>
                  {initialReturnRate.rows.map((r) => (
                    <tr key={r.pillarId} style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{r.pillarName}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.submittedCount}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: r.returnedCount > 0 ? '#FF6300' : 'inherit' }}>{r.returnedCount}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: r.returnRate > 30 ? '#FF6300' : 'inherit' }}>
                        {r.returnRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
