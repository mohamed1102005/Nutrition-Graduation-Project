import { useEffect, useState } from 'react'
import { Search, ReceiptText, CreditCard, Filter, Download } from 'lucide-react'
import { Card, PageHead, Skeleton, Gate, inputCls, Segment, type DemoState, Btn } from '../../ui'
import { api } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

export default function FinanceTransactions() {
  const { t, isRtl } = useLanguage()
  const [state, setState] = useState<DemoState>('loading')
  const [transactions, setTransactions] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [methodFilter, setMethodFilter] = useState('All')

  const loadData = () => {
    setState('loading')
    const t = typeFilter === 'All' ? undefined : typeFilter.toLowerCase() === 'subscriptions' ? 'subscription' : 'session'
    const m = methodFilter === 'All' ? undefined : methodFilter.toLowerCase().replace(/\s+/g, '_')

    api.getFinanceTransactions({ q, type: t, method: m })
      .then((res) => {
        setTransactions(res.transactions || [])
        setTotalCount(res.totalCount || 0)
        setState('loaded')
      })
      .catch((err) => {
        console.error('Failed to load transactions:', err)
        setState('error')
      })
  }

  // Download exactly what the table currently shows (same filters and search).
  const exportCsv = () => {
    const cols = ['reference', 'type', 'customer_name', 'customer_email', 'description', 'method', 'created_at', 'amount_egp']
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [cols.join(','), ...transactions.map((tx) => cols.map((c) => cell(tx[c])).join(','))].join('\r\n')
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadData()
  }, [typeFilter, methodFilter])

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData()
    }, 250)
    return () => clearTimeout(handler)
  }, [q])

  return (
    <div>
      <PageHead
        title={t('finance.ledger_title', 'Transaction Ledger')}
        sub={t('finance.ledger_sub', `${totalCount} recorded platform payments across Egypt.`).replace('{count}', String(totalCount))}
      />

      {/* Controls & Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search size={18} className={`absolute top-1/2 -translate-y-1/2 text-ink-2 ${isRtl ? 'right-4' : 'left-4'}`} aria-hidden />
          <input
            type="search"
            aria-label={t('finance.search_ledger', 'Search ledger')}
            placeholder={t('finance.search_ledger', 'Search by customer, reference, or description...')}
            className={`${inputCls} ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Btn variant="secondary" className="min-h-11 px-4 gap-2" onClick={exportCsv} disabled={transactions.length === 0}>
          <Download size={16} aria-hidden /> {t('finance.export_csv', 'Export CSV')}
        </Btn>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6">
        <div>
          <p className="label text-ink-2 mb-1.5 text-[12px]">{t('finance.type', 'Type')}</p>
          <Segment
            label={t('finance.type', 'Type')}
            options={[
              { val: 'All', label: t('common.filter_all', 'All') },
              { val: 'Subscriptions', label: t('finance.recurring_subs', 'Subscriptions') },
              { val: 'Sessions', label: t('finance.consultations', 'Sessions') },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </div>
        <div>
          <p className="label text-ink-2 mb-1.5 text-[12px]">{t('finance.gateway', 'Payment Method')}</p>
          <Segment
            label={t('finance.gateway', 'Payment Method')}
            options={[
              { val: 'All', label: t('common.filter_all', 'All') },
              { val: 'Card', label: 'Credit Card' },
              { val: 'Instapay', label: 'Instapay' },
              { val: 'Vodafone Cash', label: 'Vodafone Cash' },
              { val: 'Fawry', label: 'Fawry' },
            ]}
            value={methodFilter}
            onChange={setMethodFilter}
          />
        </div>
      </div>

      <Gate
        state={state}
        retry={loadData}
        skeleton={
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        }
        empty={<Card className="p-8 text-center text-ink-2">No transactions match your criteria.</Card>}
      >
        <Card className="overflow-x-auto">
          <table className={`w-full text-[14px] ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead className="bg-paper border-b border-line text-[12px] text-ink-2">
              <tr>
                <th className="py-3.5 px-5 font-semibold">{t('finance.th_ref', 'Reference')}</th>
                <th className="py-3.5 px-5 font-semibold">{t('finance.th_customer', 'Customer')}</th>
                <th className="py-3.5 px-5 font-semibold">{t('finance.th_desc', 'Description')}</th>
                <th className="py-3.5 px-5 font-semibold">{t('finance.th_method', 'Method')}</th>
                <th className="py-3.5 px-5 font-semibold">{isRtl ? 'التاريخ' : 'Date'}</th>
                <th className={`py-3.5 px-5 font-semibold ${isRtl ? 'text-left' : 'text-right'}`}>{t('finance.th_amount', 'Amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {transactions.map((tx) => (
                <tr key={tx.id + tx.type} className="hover:bg-paper/40 transition">
                  <td className="py-4 px-5 font-mono text-[12px] font-bold text-ink whitespace-nowrap">
                    {tx.reference}
                  </td>
                  <td className="py-4 px-5">
                    <p className="font-semibold text-ink">{tx.customer_name}</p>
                    <p className="text-[12px] text-ink-2">{tx.customer_email}</p>
                  </td>
                  <td className="py-4 px-5 font-medium text-ink-2">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${tx.type === 'subscription' ? 'bg-eat' : 'bg-move'}`} />
                      <span>{tx.description}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className="capitalize px-2.5 py-1 rounded-lg text-[12px] font-bold bg-sand">
                      {tx.method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-ink-2 text-[13px] whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-4 px-5 text-right font-bold text-ink whitespace-nowrap">
                    +{(tx.amount_egp ?? 0).toLocaleString('en-US')} EGP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Gate>
    </div>
  )
}

