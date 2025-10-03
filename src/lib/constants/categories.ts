// src/lib/constants/categories.ts
// Issue Category Management with Logo Support

export interface IssueCategory {
  id: string;
  name: string;
  emoji: string;
  color?: string;
  isDefault: boolean;
}

// Default categories (cannot be deleted)
export const DEFAULT_CATEGORIES: IssueCategory[] = [
  { id: 'auth', name: 'Auth/Login', emoji: '🔐', isDefault: true },
  { id: 'routing', name: 'Routing', emoji: '🛣️', isDefault: true },
  { id: 'admin-users', name: 'Admin/Users', emoji: '👥', isDefault: true },
  { id: 'admin-analytics', name: 'Admin/Analytics', emoji: '📊', isDefault: true },
  { id: 'admin-ui', name: 'Admin/UI', emoji: '🎨', isDefault: true },
  { id: 'admin-features', name: 'Admin/Features', emoji: '⚙️', isDefault: true },
  { id: 'profile', name: 'Profile/Settings', emoji: '👤', isDefault: true },
  { id: 'ui-style', name: 'UI/Style', emoji: '💅', isDefault: true },
  { id: 'database', name: 'Database', emoji: '🗄️', isDefault: true },
  { id: 'performance', name: 'Performance', emoji: '⚡', isDefault: true },
  { id: 'security', name: 'Security', emoji: '🔒', isDefault: true },
  { id: 'documentation', name: 'Documentation', emoji: '📚', isDefault: true },
  { id: 'other', name: 'Other', emoji: '📦', isDefault: true },
];

const STORAGE_KEY = 'degix-issue-categories';

/**
 * Get all categories (default + custom)
 */
export function getCategories(): IssueCategory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const customCategories: IssueCategory[] = stored ? JSON.parse(stored) : [];
    return [...DEFAULT_CATEGORIES, ...customCategories];
  } catch (error) {
    console.error('Error loading categories:', error);
    return DEFAULT_CATEGORIES;
  }
}

/**
 * Add a new custom category
 */
export function addCategory(category: Omit<IssueCategory, 'id' | 'isDefault'>): IssueCategory {
  const newCategory: IssueCategory = {
    ...category,
    id: `custom-${Date.now()}`,
    isDefault: false,
  };

  const categories = getCustomCategories();
  categories.push(newCategory);
  saveCustomCategories(categories);

  return newCategory;
}

/**
 * Update an existing category (only custom categories)
 */
export function updateCategory(id: string, updates: Partial<Omit<IssueCategory, 'id' | 'isDefault'>>): boolean {
  const categories = getCustomCategories();
  const index = categories.findIndex(cat => cat.id === id);

  if (index === -1) return false;

  categories[index] = { ...categories[index], ...updates };
  saveCustomCategories(categories);
  return true;
}

/**
 * Delete a custom category
 */
export function deleteCategory(id: string): boolean {
  const category = getCategories().find(cat => cat.id === id);
  if (!category || category.isDefault) return false;

  const categories = getCustomCategories().filter(cat => cat.id !== id);
  saveCustomCategories(categories);
  return true;
}

/**
 * Get only custom categories
 */
function getCustomCategories(): IssueCategory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom categories:', error);
    return [];
  }
}

/**
 * Save custom categories to localStorage
 */
function saveCustomCategories(categories: IssueCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
}

/**
 * Find category by name (case-insensitive)
 */
export function findCategoryByName(name: string): IssueCategory | undefined {
  return getCategories().find(cat => cat.name.toLowerCase() === name.toLowerCase());
}

/**
 * Popular emojis for categories
 */
export const POPULAR_EMOJIS = [
  '🔐', '🛣️', '👥', '📊', '🎨', '⚙️', '👤', '💅',
  '🗄️', '⚡', '🔒', '📚', '📦', '🐛', '✨', '🚀',
  '💡', '🎯', '⚠️', '❗', '📝', '🔧', '🎉', '🔥',
  '💰', '📈', '📉', '🎮', '📱', '💻', '🖥️', '⌨️',
  '🖱️', '📷', '🎵', '🎬', '📺', '📡', '🌐', '💬',
];
