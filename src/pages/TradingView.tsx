import { AppData, Trade } from '../types'
import { generateId } from '../utils/id'
import './TradingView.css'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function TradingView({ data, update }: Props) {
  const trades = data.trades

  const addTrade = (trade: Partial<Trade>) => {
    const newTrade: Trade = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      ticker: '',
      strategy: '',
      direction: 'long',
      outcome: 'loss',
      r: 0,
      ...trade
    }
    
    update(d => ({
      ...d,
      trades: [...d.trades, newTrade]
    }))
  }

  const deleteTrade = (id: string) => {
    update(d => ({
      ...d,
      trades: d.trades.filter(t => t.id !== id)
    }))
  }

  const wins = trades.filter(t => t.outcome === 'win').length
  const totalWinRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0

  return (
    <div className="trading-view">
      <div className="trading-header">
        <h1>Trading</h1>
        <div className="trading-stats">
          <StatCard label="Trades" value={trades.length} />
          <StatCard label="Wins" value={wins} />
          <StatCard label="Win %" value={`${totalWinRate}%`} />
        </div>
      </div>

      <NewTradeForm onAdd={addTrade} />

      <div className="trades-list">
        <h2>Recent Trades</h2>
        {trades.length === 0 ? (
          <p className="empty">No trades yet</p>
        ) : (
          trades.map(trade => (
            <TradeRow key={trade.id} trade={trade} onDelete={() => deleteTrade(trade.id)} />
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function NewTradeForm({ onAdd }: { onAdd: (t: Partial<Trade>) => void }) {
  const [form, setForm] = React.useState({
    ticker: '',
    strategy: '',
    direction: 'long' as 'long' | 'short',
    outcome: 'loss' as 'win' | 'loss',
    r: 0,
    note: ''
  })

  const handleSubmit = () => {
    if (!form.ticker || !form.strategy) return
    onAdd(form)
    setForm({ ticker: '', strategy: '', direction: 'long', outcome: 'loss', r: 0, note: '' })
  }

  return (
    <div className="card new-trade">
      <h2>Log Trade</h2>
      <div className="form-grid">
        <input className="input" placeholder="Ticker" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} />
        <input className="input" placeholder="Strategy" value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })} />
        <select className="input" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as any })}>
          <option>long</option>
          <option>short</option>
        </select>
        <select className="input" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value as any })}>
          <option value="loss">Loss</option>
          <option value="win">Win</option>
        </select>
        <input className="input" type="number" placeholder="R" value={form.r} onChange={(e) => setForm({ ...form, r: parseFloat(e.target.value) || 0 })} />
        <input className="input" placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </div>
      <button className="button" onClick={handleSubmit}>Add Trade</button>
    </div>
  )
}

function TradeRow({ trade, onDelete }: { trade: Trade; onDelete: () => void }) {
  return (
    <div className={`trade-row ${trade.outcome}`}>
      <div className="trade-info">
        <div className="trade-ticker">{trade.ticker}</div>
        <div className="trade-meta">
          <span>{trade.strategy}</span>
          <span>{trade.direction.toUpperCase()}</span>
          <span>R: {trade.r}</span>
        </div>
      </div>
      <div className="trade-outcome">{trade.outcome === 'win' ? '✓ Win' : '✗ Loss'}</div>
      <button className="icon-btn delete" onClick={onDelete}>✕</button>
    </div>
  )
}

import React from 'react'
