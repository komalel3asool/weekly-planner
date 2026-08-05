import { AppData, Trade, Strategy, Ticker } from '../types'
import { generateId } from '../utils/id'
import './TradingView.css'
import React, { useState } from 'react'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function TradingView({ data, update }: Props) {
  const trades = data.trades
  const strategies = data.strategies
  const tickers = data.tickers

  const addStrategy = () => {
    const name = prompt('Strategy name:')
    if (!name) return
    const notes = prompt('Notes (optional):', '')

    update(d => ({
      ...d,
      strategies: [...d.strategies, {
        id: generateId(),
        name,
        notes: notes || undefined
      }]
    }))
  }

  const deleteStrategy = (id: string) => {
    if (!confirm('Delete this strategy?')) return
    update(d => ({
      ...d,
      strategies: d.strategies.filter(s => s.id !== id)
    }))
  }

  const addTicker = () => {
    const symbol = prompt('Ticker symbol (e.g., AAPL):')
    if (!symbol) return
    const notes = prompt('Notes (optional):', '')

    update(d => ({
      ...d,
      tickers: [...d.tickers, {
        id: generateId(),
        symbol: symbol.toUpperCase(),
        notes: notes || undefined
      }]
    }))
  }

  const deleteTicker = (id: string) => {
    if (!confirm('Delete this ticker?')) return
    update(d => ({
      ...d,
      tickers: d.tickers.filter(t => t.id !== id)
    }))
  }

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

  // Calculate stats per ticker
  const getTickerStats = (tickerSymbol: string) => {
    const tickerTrades = trades.filter(t => t.ticker === tickerSymbol)
    if (tickerTrades.length === 0) return null
    const wins = tickerTrades.filter(t => t.outcome === 'win')
    const losses = tickerTrades.filter(t => t.outcome === 'loss')
    const winRate = Math.round((wins.length / tickerTrades.length) * 100)
    const avgWinner = wins.length > 0 ? (wins.reduce((sum, t) => sum + t.r, 0) / wins.length).toFixed(2) : 0
    const avgLoser = losses.length > 0 ? (Math.abs(losses.reduce((sum, t) => sum + t.r, 0) / losses.length)).toFixed(2) : 0
    return { total: tickerTrades.length, wins: wins.length, winRate, avgWinner, avgLoser }
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

      <div className="managers-row">
        <StrategyManager strategies={strategies} onAdd={addStrategy} onDelete={deleteStrategy} />
        <TickerManager tickers={tickers} onAdd={addTicker} onDelete={deleteTicker} getStats={getTickerStats} />
      </div>

      <NewTradeForm onAdd={addTrade} strategies={strategies} tickers={tickers} />

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
              strategies={strategies}
              tickers={tickers}
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

function StrategyManager({ strategies, onAdd, onDelete }: { strategies: Strategy[]; onAdd: () => void; onDelete: (id: string) => void }) {
  return (
    <div className="card manager-card strategies-section">
      <div className="manager-header">
        <h2>Strategies</h2>
        <button className="button small primary" onClick={onAdd}>+ Add</button>
      </div>
      <div className="manager-list">
        {strategies.length === 0 ? (
          <p className="empty">No strategies</p>
        ) : (
          strategies.map(s => (
            <div key={s.id} className="manager-item">
              <div>
                <div className="manager-name">{s.name}</div>
                {s.notes && <div className="manager-notes">{s.notes}</div>}
              </div>
              <button className="icon-btn delete" onClick={() => onDelete(s.id)}>✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TickerManager({ tickers, onAdd, onDelete, getStats }: { tickers: Ticker[]; onAdd: () => void; onDelete: (id: string) => void; getStats: (symbol: string) => any }) {
  return (
    <div className="card manager-card tickers-section">
      <div className="manager-header">
        <h2>Tickers</h2>
        <button className="button small primary" onClick={onAdd}>+ Add</button>
      </div>
      <div className="manager-list">
        {tickers.length === 0 ? (
          <p className="empty">No tickers</p>
        ) : (
          tickers.map(t => {
            const stats = getStats(t.symbol)
            return (
              <div key={t.id} className="manager-item ticker-item">
                <div>
                  <div className="manager-name">{t.symbol}</div>
                  {stats && (
                    <div className="ticker-stats">
                      {stats.total} trades • {stats.winRate}% win • Avg: +{stats.avgWinner}% / -{stats.avgLoser}%
                    </div>
                  )}
                  {t.notes && <div className="manager-notes">{t.notes}</div>}
                </div>
                <button className="icon-btn delete" onClick={() => onDelete(t.id)}>✕</button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function NewTradeForm({ onAdd, strategies, tickers }: { onAdd: (t: Partial<Trade>) => void; strategies: Strategy[]; tickers: Ticker[] }) {
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
        <select className="input" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })}>
          <option value="">Select ticker...</option>
          {tickers.map(t => (
            <option key={t.id} value={t.symbol}>{t.symbol}</option>
          ))}
        </select>
        <select className="input" value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}>
          <option value="">Select strategy...</option>
          {strategies.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
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

function TradeRow({ trade, onUpdate, onDelete, strategies, tickers }: { trade: Trade; onUpdate: (t: Partial<Trade>) => void; onDelete: () => void; strategies: Strategy[]; tickers: Ticker[] }) {
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
          <select 
            className="edit-input" 
            value={form.ticker} 
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
          >
            <option value="">Select ticker...</option>
            {tickers.map(t => (
              <option key={t.id} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
          <select 
            className="edit-input" 
            value={form.strategy} 
            onChange={(e) => setForm({ ...form, strategy: e.target.value })}
          >
            <option value="">Select strategy...</option>
            {strategies.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
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
