import {
  getCategories as _getCategories,
  addCategory as _addCategory,
  updateCategory as _updateCategory,
  deleteCategory as _deleteCategory,
  initDefaultCategories as _initDefaultCategories,
} from '@uandi/cashbook-core';
import type { CashbookCategory } from '@/types';
import { getDb } from '@/lib/firebase/config';

export async function getCategories(coupleId: string): Promise<CashbookCategory[]> {
  return _getCategories(getDb(), coupleId);
}

export async function addCategory(
  coupleId: string,
  data: Omit<CashbookCategory, 'id' | 'coupleId' | 'createdAt'>
): Promise<string> {
  return _addCategory(getDb(), coupleId, data);
}

export async function updateCategory(
  coupleId: string,
  categoryId: string,
  data: Partial<Pick<CashbookCategory, 'name' | 'icon' | 'color' | 'subGroup' | 'sortOrder'>>
): Promise<void> {
  return _updateCategory(getDb(), coupleId, categoryId, data);
}

export async function deleteCategory(coupleId: string, categoryId: string): Promise<void> {
  return _deleteCategory(getDb(), coupleId, categoryId);
}

export async function initDefaultCategories(coupleId: string): Promise<void> {
  return _initDefaultCategories(getDb(), coupleId);
}
