#!/bin/bash

cd ~/Downloads/weekly-planner

echo "🚀 Integrating PDF Reader into App.tsx..."

python3 << 'PYEND'
import re

# Read current App.tsx
with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add PdfReader import
if 'import { PdfReader }' not in content:
    # Find the last import and add after it
    last_import = content.rfind('import')
    last_import_end = content.find('\n', last_import) + 1
    insert_pos = last_import_end
    content = content[:insert_pos] + "import { PdfReader } from './components/PdfReader'\n" + content[insert_pos:]
    print("✅ Added PdfReader import")

# 2. Update view state type
content = re.sub(
    r"const \[view, setView\] = useState<'planner' \| 'gym' \| 'trading'>",
    "const [view, setView] = useState<'planner' | 'gym' | 'trading' | 'pdf'>",
    content
)
print("✅ Updated view state type")

# 3. Add PDF routing
if "if (view === 'pdf')" not in content:
    # Find the routing section and add before the final planner return
    gym_routing = "if (view === 'gym')"
    gym_pos = content.find(gym_routing)
    if gym_pos != -1:
        # Find the end of gym routing block
        next_if = content.find("if (view === 'trading')", gym_pos)
        if next_if != -1:
            insert_at = next_if
            content = content[:insert_at] + "if (view === 'pdf') return <PdfReader onBack={() => setView('planner')} />\n  " + content[insert_at:]
            print("✅ Added PDF routing")

# 4. Add PDF button to header
# Find the header section with the buttons
if '📈 Trading' in content:
    # Find the trading button and add PDF button after it
    trading_button_pos = content.find('onClick={() => setView(\'trading\')}')
    if trading_button_pos != -1:
        # Find the closing > of that button
        close_paren = content.find('>', trading_button_pos)
        # Find the next < (start of next button)
        next_elem = content.find('<', close_paren + 1)
        
        pdf_button = ' | <button onClick={() => setView(\'pdf\')} style={{ padding: \'0.5rem 1rem\', background: \'#78350f\', color: \'white\', border: \'none\', borderRadius: \'4px\', cursor: \'pointer\', fontWeight: \'bold\', marginRight: \'0.5rem\' }}>📚 PDF</button>'
        
        if '📚 PDF' not in content:
            content = content[:next_elem] + pdf_button + '\n        ' + content[next_elem:]
            print("✅ Added PDF button")

# Write updated App.tsx
with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ App.tsx updated!")
PYEND

echo ""
echo "✅ Integration complete!"
echo ""
echo "Running development server..."
npm run dev &

echo ""
echo "Waiting 5 seconds then deploying to Vercel..."
sleep 5

npx vercel --prod

echo ""
echo "✅ DONE! PDF Reader is now live! 🚀📚"
