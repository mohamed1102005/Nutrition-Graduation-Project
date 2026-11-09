import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Search, ChevronRight } from 'lucide-react'
import { Avatar, Btn, Card, EmptyState, Gate, inputCls, PageHead, Segment, TableSkeleton, type DemoState } from '../../ui'
import { Flag, PainTrend } from '@/components'
import { api } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

// The API stores goals as snake_case values (lose_fat); show them as words.
const goalLabel = (g?: string) => (g ? g.replace(/_/g, ' ').replace(/^./, (m) => m.toUpperCase()) : '—')

export default function Clients() {
  const { t } = useLanguage()
  const [q, setQ] = useState('')
  const [f, setF] = useState('All')
  const [state, setState] = useState<DemoState>('loading')
  const [allClients, setAllClients] = useState<any[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setState('loading')
    api.getSpecialistClients()
      .then((data) => {
        if (!active) return
        setAllClients(data?.clients ?? [])
        setState(data?.clients?.length ? 'loaded' : 'empty')
      })
      .catch((err) => {
        console.error('Failed to load specialist clients:', err)
        if (active) setState('error')
      })
    return () => { active = false }
  }, [reloadKey])

  const checkOver = (c: any) => Boolean(c.flagged)

  const list = allClients
    .filter((c) => (f === 'Needs attention' ? checkOver(c) : f === 'On track' ? !checkOver(c) : true))
    .filter((c) => `${c.name} ${c.goal || ''}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => Number(checkOver(b)) - Number(checkOver(a)))
  const flagged = allClients.filter(checkOver).length

  return (
    <div>
      <PageHead
        title={t('specialist_clients.title', 'Clients')}
        sub={`${allClients.length} ${t('specialist_clients.title', 'clients')}. ${flagged} ${t('specialist_clients.above_safe_limit', 'above safe limit.')}`}
      />
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden />
          <input
            type="search"
            aria-label={t('specialist_clients.search', 'Search clients')}
            placeholder={t('specialist_clients.search', 'Search by name or goal')}
            className={`${inputCls} pl-11`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Segment
          label="Filter"
          options={['All', 'Needs attention', 'On track']}
          value={f}
          onChange={setF}
        />
        {/* <StateSwitcher value={state} onChange={setState} /> */}
      </div>

      <Gate
        state={state}
        retry={() => setReloadKey((k) => k + 1)}
        skeleton={<TableSkeleton rows={6} />}
        empty={<Card><EmptyState title="No clients yet" text="When someone books a session with you, they show up here with their plan and pain reports." /></Card>}
      >
        {list.length === 0 ? (
          <Card>
            <EmptyState title="No clients match" text="Try a different name, or clear the filter." action={<Btn variant="secondary" onClick={() => { setQ(''); setF('All') }}>Clear search and filter</Btn>} />
          </Card>
        ) : (
          <>
            <Card className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[860px]">
                <caption className="sr-only">{t('specialist_clients.table_title', 'Clients, sorted with pain flags first')}</caption>
                <thead>
                  <tr className="text-[13px] text-ink-2 border-b border-line">
                    {[
                      t('specialist_clients.col_client', 'Client'),
                      t('specialist_clients.col_goal', 'Goal'),
                      t('specialist_clients.col_week', 'Week'),
                      t('specialist_clients.col_pain_trend', 'Pain trend'),
                      t('specialist_clients.col_last_checkin', 'Last check-in'),
                      t('specialist_clients.col_flag', 'Flag'),
                    ].map((h) => <th key={h} scope="col" className="px-5 py-3 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className={`border-b border-line last:border-0 hover:bg-paper ${checkOver(c) ? 'bg-bad-tint/40' : ''}`}>
                      <td className="px-5 py-3">
                        <Link to={`/app/clients/${c.id}`} className="flex items-center gap-3 min-h-11 font-bold underline-offset-4 hover:underline">
                          <Avatar initials={c.initials} svc="recover" size={40} /> {c.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[15px] max-w-[200px]">{goalLabel(c.goal)}</td>
                      <td className="px-5 py-3 whitespace-nowrap"><span className="num">{c.week}</span> <span className="text-ink-2">of {c.of}</span></td>
                      <td className="px-5 py-3"><PainTrend c={c} /></td>
                      <td className="px-5 py-3 text-[15px] whitespace-nowrap">{c.lastCheckin}</td>
                      <td className="px-5 py-3"><Flag c={c} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <ul className="md:hidden space-y-3">
              {list.map((c) => (
                <li key={c.id}>
                  <Link to={`/app/clients/${c.id}`} className={`block rounded-2xl border border-line p-4 ${checkOver(c) ? 'bg-bad-tint/40' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <Avatar initials={c.initials} svc="recover" size={44} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold">{c.name}</p>
                        <p className="text-[14px] text-ink-2 truncate">{goalLabel(c.goal)}</p>
                      </div>
                      <ChevronRight size={20} aria-hidden />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px]">
                      <span>Week <span className="num">{c.week}</span> of {c.of}</span>
                      <PainTrend c={c} />
                      <span className="text-ink-2">{c.lastCheckin}</span>
                    </div>
                    <div className="mt-3"><Flag c={c} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Gate>
    </div>
  )
}
