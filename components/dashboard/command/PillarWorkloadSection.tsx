// components/dashboard/command/PillarWorkloadSection.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { PillarWorkload } from '@/types/database'
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface PillarWorkloadSectionProps {
  workloads: PillarWorkload[]
}

export function PillarWorkloadSection({ workloads }: PillarWorkloadSectionProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Identify pillar under most pressure (highest overdue/open ratio, or highest overdue count)
  const mostOverloaded = [...workloads]
    .filter((w) => w.open > 0 || w.overdue > 0)
    .sort((a, b) => {
      const ratioA = a.open > 0 ? a.overdue / a.open : 0
      const ratioB = b.open > 0 ? b.overdue / b.open : 0
      if (ratioB !== ratioA) return ratioB - ratioA
      return b.overdue - a.overdue
    })[0]

  // Chart data
  const chartData = workloads.map((w) => ({
    name: w.pillar.nickname || w.pillar.name,
    fullName: w.pillar.name,
    Open: w.open,
    Overdue: w.overdue,
  }))

  const getCapacityColor = (percentage: number) => {
    if (percentage <= 50) return 'var(--color-accent)'
    if (percentage <= 75) 'var(--color-lavender)'
    return 'var(--color-orange)'
  }

  const handleRowClick = (pillarId: string) => {
    router.push(`/command?pillar=${pillarId}#all-tasks`)
  }

  return (
    <section
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        marginBottom: '28px',
        overflow: 'hidden',
        transition: 'all 200ms ease',
      }}
      id="pillar-workload-section"
    >
      {/* Section Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-expanded={!collapsed}
        id="workload-toggle-btn"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Pillar Workload</h2>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'var(--surface-3)',
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            {workloads.length} Pillars
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '13px' }}>
          <span>{collapsed ? 'Expand' : 'Collapse'}</span>
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </button>

      {/* Collapsible Content */}
      {!collapsed && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-default)' }}>
          {/* Most Overloaded Callout Card */}
          {mostOverloaded && mostOverloaded.overdue > 0 && (
            <div
              style={{
                marginTop: '16px',
                marginBottom: '16px',
                background: 'rgba(255,99,0,0.08)',
                border: '1px solid rgba(255,99,0,0.25)',
                borderLeft: '3px solid #FF6300',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
              id="most-overloaded-callout"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Flame size={18} color="#FF6300" />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Most pressure:{' '}
                    <strong style={{ color: '#FFFFFF' }}>{mostOverloaded.pillar.name}</strong>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF6300' }}>
                    {mostOverloaded.overdue} overdue of {mostOverloaded.open} open tasks
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRowClick(mostOverloaded.pillar.id)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                View {mostOverloaded.pillar.nickname} Tasks
              </button>
            </div>
          )}

          {/* Workload Table */}
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 500 }}>Pillar</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500 }}>Nickname</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500, textAlign: 'center' }}>Open</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500, textAlign: 'center' }}>Overdue</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500, textAlign: 'center' }}>Done This Month</th>
                  <th style={{ padding: '10px 12px', fontWeight: 500, minWidth: '140px' }}>Capacity Bar</th>
                </tr>
              </thead>
              <tbody>
                {workloads.map((w) => (
                  <tr
                    key={w.pillar.id}
                    onClick={() => handleRowClick(w.pillar.id)}
                    style={{
                      borderBottom: '1px solid var(--border-default)',
                      cursor: 'pointer',
                      transition: 'background 150ms ease',
                    }}
                    className="hover:bg-[var(--surface-2)]"
                    title={`Click to filter tasks by ${w.pillar.name}`}
                  >
                    <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {w.pillar.name}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      <span
                        style={{
                          background: 'var(--surface-3)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        {w.pillar.nickname}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {w.open}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {w.overdue > 0 ? (
                        <span
                          style={{
                            color: '#FF6300',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <AlertTriangle size={13} color="#FF6300" />
                          {w.overdue}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-accent)' }}>
                      {w.completedThisMonth}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '8px',
                            background: 'var(--surface-3)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${w.capacityPercentage}%`,
                              height: '100%',
                              background: getCapacityColor(w.capacityPercentage),
                              borderRadius: '4px',
                              transition: 'width 300ms ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '32px' }}>
                          {w.capacityPercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recharts Horizontal Grouped Bar Chart */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Comparison: Open vs. Overdue
            </h3>
            <div
              style={{
                background: 'var(--surface-0)',
                borderRadius: '8px',
                padding: '16px 12px 10px 4px',
                border: '1px solid var(--border-default)',
                width: '100%',
                height: 240,
              }}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="var(--text-secondary)"
                      fontSize={11}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1B2E34',
                        borderColor: '#2A4954',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      }}
                      itemStyle={{ color: '#FFFFFF' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                    />
                    <Bar dataKey="Open" fill="#B9FBC2" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Overdue" fill="#FF6300" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
