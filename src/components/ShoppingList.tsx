import { ShoppingItem } from '../types'
import { generateId } from '../utils/id'
import './ShoppingList.css'
import React, { useState } from 'react'

interface Props {
  items: ShoppingItem[]
  onUpdate: (items: ShoppingItem[]) => void
}

export default function ShoppingList({ items, onUpdate }: Props) {
  const [newItem, setNewItem] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const addItem = () => {
    if (!newItem.trim()) return
    const item: ShoppingItem = {
      id: generateId(),
      text: newItem.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    }
    onUpdate([item, ...items])
    setNewItem('')
  }

  const toggleItem = (id: string) => {
    onUpdate(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const deleteItem = (id: string) => {
    onUpdate(items.filter(item => item.id !== id))
  }

  const startEdit = (id: string, text: string) => {
    setEditingId(id)
    setEditText(text)
  }

  const saveEdit = (id: string) => {
    if (!editText.trim()) return
    onUpdate(items.map(item =>
      item.id === id ? { ...item, text: editText.trim() } : item
    ))
    setEditingId(null)
    setEditText('')
  }

  const activItems = items.filter(i => !i.completed)
  const completedItems = items.filter(i => i.completed)

  return (
    <div className="shopping-list-container">
      <div className="shopping-header">
        <h2>🛒 Shopping List</h2>
        <span className="item-count">{activItems.length}</span>
      </div>

      <div className="shopping-add">
        <input
          type="text"
          placeholder="Add item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
          className="shopping-input"
        />
        <button className="button small" onClick={addItem}>Add</button>
      </div>

      <div className="shopping-items">
        {activItems.length === 0 && completedItems.length === 0 ? (
          <p className="empty">Shopping list is empty</p>
        ) : (
          <>
            {activItems.map(item => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                editText={editText}
                onToggle={() => toggleItem(item.id)}
                onDelete={() => deleteItem(item.id)}
                onEdit={(text) => startEdit(item.id, text)}
                onSaveEdit={() => saveEdit(item.id)}
                onCancelEdit={() => setEditingId(null)}
                onEditChange={setEditText}
              />
            ))}

            {completedItems.length > 0 && (
              <>
                <div className="divider">Completed</div>
                {completedItems.map(item => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    isEditing={editingId === item.id}
                    editText={editText}
                    onToggle={() => toggleItem(item.id)}
                    onDelete={() => deleteItem(item.id)}
                    onEdit={(text) => startEdit(item.id, text)}
                    onSaveEdit={() => saveEdit(item.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onEditChange={setEditText}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ShoppingItemRow({ item, isEditing, editText, onToggle, onDelete, onEdit, onSaveEdit, onCancelEdit, onEditChange }: {
  item: ShoppingItem
  isEditing: boolean
  editText: string
  onToggle: () => void
  onDelete: () => void
  onEdit: (text: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditChange: (text: string) => void
}) {
  if (isEditing) {
    return (
      <div className="shopping-item editing">
        <input
          autoFocus
          type="text"
          value={editText}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSaveEdit()}
          className="edit-input"
        />
        <div className="edit-actions">
          <button className="icon-btn save" onClick={onSaveEdit}>✓</button>
          <button className="icon-btn cancel" onClick={onCancelEdit}>✕</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`shopping-item ${item.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={onToggle}
        className="checkbox"
      />
      <span className="item-text">{item.text}</span>
      <button className="icon-btn edit" onClick={() => onEdit(item.text)}>✎</button>
      <button className="icon-btn delete" onClick={onDelete}>✕</button>
    </div>
  )
}
