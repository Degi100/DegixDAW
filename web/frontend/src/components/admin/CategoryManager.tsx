// src/components/admin/CategoryManager.tsx
// Modal for managing issue categories

import { useState, useEffect } from 'react';
import { getCategories, addCategory, deleteCategory, POPULAR_EMOJIS, type IssueCategory } from '../../lib/constants/categories';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded?: () => void;
}

export default function CategoryManager({ isOpen, onClose, onCategoryAdded }: CategoryManagerProps) {
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📦');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = () => {
    setCategories(getCategories());
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    addCategory({
      name: newCategoryName.trim(),
      emoji: selectedEmoji,
    });

    setNewCategoryName('');
    setSelectedEmoji('📦');
    setShowAddForm(false);
    loadCategories();
    onCategoryAdded?.();
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Diese Kategorie wirklich löschen?')) {
      deleteCategory(id);
      loadCategories();
      onCategoryAdded?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Kategorien verwalten</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          {/* Category List */}
          <div className="category-list">
            {categories.map(category => (
              <div key={category.id} className="category-item">
                <div className="category-item__info">
                  <span className="category-item__emoji">{category.emoji}</span>
                  <span className="category-item__name">{category.name}</span>
                  {category.isDefault && (
                    <span className="category-item__badge">Standard</span>
                  )}
                </div>
                {!category.isDefault && (
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="category-item__delete"
                    title="Löschen"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Category Form */}
          {showAddForm ? (
            <div className="category-form">
              <div className="category-form__header">
                <h3>Neue Kategorie</h3>
                <button onClick={() => setShowAddForm(false)} className="category-form__cancel">
                  ✕
                </button>
              </div>

              {/* Emoji Picker */}
              <div className="category-form__field">
                <label>Logo (Emoji)</label>
                <div className="emoji-picker">
                  <button
                    type="button"
                    className="emoji-picker__trigger"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    {selectedEmoji}
                  </button>
                  {showEmojiPicker && (
                    <div className="emoji-picker__dropdown">
                      {POPULAR_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className="emoji-picker__option"
                          onClick={() => {
                            setSelectedEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Category Name */}
              <div className="category-form__field">
                <label>Kategorie-Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="z.B. Backend/API"
                  maxLength={50}
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="category-form__actions">
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="btn btn--primary"
                >
                  ✅ Hinzufügen
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn btn--secondary"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn--primary btn--full-width"
            >
              ➕ Neue Kategorie hinzufügen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
