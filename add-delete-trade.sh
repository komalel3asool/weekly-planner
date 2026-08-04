#!/bin/bash

cd ~/Downloads/weekly-planner

python3 << 'PYEND'
with open('src/components/TradingTracker.tsx', 'r') as f:
    code = f.read()

# Add delete function after logTrade
code = code.replace(
    "const logTrade = () => { if (!ticker || !outcome) { alert('Fill in ticker'); return }; setTrades([{ ticker: ticker.toUpperCase(), setup, direction, outcome, r: parseFloat(r) || 0, note, date: new Date().toLocaleDateString() }, ...trades]); setTicker('') }",
    "const logTrade = () => { if (!ticker || !outcome) { alert('Fill in ticker'); return }; setTrades([{ ticker: ticker.toUpperCase(), setup, direction, outcome, r: parseFloat(r) || 0, note, date: new Date().toLocaleDateString() }, ...trades]); setTicker('') }\n  const deleteTrade = (i: number) => { setTrades(trades.filter((_, idx) => idx !== i)) }"
)

# Update recent trades section to add delete button
old_trades = "{trades.map((t, i) => <div key={i} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '4px', borderLeft: `4px solid ${t.outcome === 'win' ? '#22c55e' : '#dc2626'}` }}><div><strong>{t.ticker}</strong> • {t.direction} • {t.setup}</div><div style={{ fontSize: '0.875rem', color: '#666' }}>R: {t.r} • {t.outcome === 'win' ? '✅ Win' : '❌ Loss'}</div></div>)}"

new_trades = "{trades.map((t, i) => <div key={i} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '4px', borderLeft: `4px solid ${t.outcome === 'win' ? '#22c55e' : '#dc2626'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div><strong>{t.ticker}</strong> • {t.direction} • {t.setup}</div><div style={{ fontSize: '0.875rem', color: '#666' }}>R: {t.r} • {t.outcome === 'win' ? '✅ Win' : '❌ Loss'}</div></div><button onClick={() => deleteTrade(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>×</button></div>))}"

code = code.replace(old_trades, new_trades)

with open('src/components/TradingTracker.tsx', 'w') as f:
    f.write(code)

print('✅ Delete trade feature added!')
PYEND

echo ""
echo "Run: npm run dev"
echo "Refresh browser - trades now have × delete buttons!"
