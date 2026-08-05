import { AppData, Trade } from '../types'
import { generateId } from '../utils/id'
import './TradingView.css'
import React, { useState } from 'react'

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

  const updateTrade = (id: string, updated: Partial<Trade>) => {
    update(d => ({
      ...d,
      trades: d.trades.map(t => t.id === id ? { ...t, ...updated } : t)
    }))
  }

  const deleteTrade = (id: string) => {
    update(d => ({
      ...d,
      trades: d.trades.filter(t => t.id !== id)
    }))
  }

  const wins = trades.filter(t => t.outcome === 'win')
  const losses = trades.filter(t => t.outcome === 'loss')
  const totalWinRate = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0
  
  const avgWinner = wins.length > 0 ? (wins.reduce((sum, t) => sum + t.r, 0) / wins.length).toFixed(2) : 0
  const avgLoser = losses.length > 0 ? (Math.abs(losses.reduce((sum, t) => sum + t.r, 0) / losses.length)).toFixed(2) : 0

  return (
    <div className="trading-view">
      <div className="trading-header">
        <h1>Trading</h1>
        <div className="trading-stats">
          <StatCard label="Trades" value={trades.length} />
          <StatCard label="Wins" value={wins.length} />
          <StatCard label="Win %" value={`${totalWinRate}%`} />
          <StatCard label="Avg Winner" value={`${avgWinner}%`} color="#34c759" />
          <StatCard label="Avg Loser" value={`-${avgLoser}%`} color="#ff3b30" />
        </div>
      </div>

      <NewTradeForm onAdd={addTrade} />

      <div className="trades-list">
        <h2>Recent Trades</h2>
        {trades.length === 0 ? (
          <p className="empty">No trades yet</p>
        ) : (
          trades.map(trade => (
            <TradeRow 
              key={trade.id} 
              trade={trade} 
              onUpdate={(updated) => updateTrade(trade.id, updated)}
              onDelete={() => deleteTrade(trade.id)} 
            />
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color || 'var(--text)' } as any}>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function NewTradeForm({ onAdd }: { onAdd: (t: Partial<Trade>) => void }) {
  const [form, setForm] = useState({
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
        <input className="input" type="number" placeholder="%" value={form.r} onChange={(e) => setForm({ ...form, r: parseFloat(e.target.value) || 0 })} />
        <input className="input" placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </div>
      <button className="button" onClick={handleSubmit}>Add Trade</button>
    </div>
  )
}

function TradeRow({ trade, onUpdate, onDelete }: { trade: Trade; onUpdate: (t: Partial<Trade>) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(trade)

  const handleSave = () => {
    onUpdate(form)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={`trade-row ${trade.outcome} editing`}>
        <div className="edit-form">
          <input 
            className="edit-input" 
            value={form.ticker} 
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
            placeholder="Ticker"
          />
          <input 
            className="edit-input" 
            value={form.strategy} 
            onChange={(e) => setForm({ ...form, strategy: e.target.value })}
            placeholder="Strategy"
          />
          <select 
            className="edit-input" 
            value={form.direction} 
            onChange={(e) => setForm({ ...form, direction: e.target.value as any })}
          >
            <option>long</option>
            <option>short</option>
          </select>
          <select 
            className="edit-input" 
            value={form.outcome} 
            onChange={(e) => setForm({ ...form, outcome: e.target.value as any })}
          >
            <option value="loss">Loss</option>
            <option value="win">Win</option>
          </select>
          <input 
            className="edit-input" 
            type="number" 
            value={form.r} 
            onChange={(e) => setForm({ ...form, r: parseFloat(e.target.value) || 0 })}
            placeholder="%"
          />
          <input 
            className="edit-input" 
            value={form.note || ''} 
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Note"
          />
        </div>
        <div className="edit-actions">
          <button className="button small primary" onClick={handleSave}>✓ Save</button>
          <button className="button small secondary" onClick={() => setEditing(false)}>✕ Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`trade-row ${trade.outcome}`}>
      <div className="trade-info">
        <div className="trade-ticker">{trade.ticker}</div>
        <div className="trade-meta">
          <span>{trade.strategy}</span>
          <span>{trade.direction.toUpperCase()}</span>
          <span className="trade-percent">{trade.outcome === 'win' ? '+' : '-'}{trade.r}%</span>
        </div>
        {trade.note && <div className="trade-note">{trade.note}</div>}
      </div>
      <div className="trade-outcome">{trade.outcome === 'win' ? '✓ Win' : '✗ Loss'}</div>
      <button className="icon-btn edit" onClick={() => setEditing(true)}>✎</button>
      <button className="icon-btn delete" onClick={onDelete}>✕</button>
    </div>
  )
}
