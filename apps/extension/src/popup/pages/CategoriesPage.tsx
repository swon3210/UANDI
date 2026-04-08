import { useState } from 'react';
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@uandi/ui';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { countEntriesByCategory, GROUP_LABELS } from '@uandi/cashbook-core';
import type { CashbookCategory, CategoryGroup } from '@uandi/cashbook-core';
import { db } from '@/lib/firebase';
import {
  useCashbookCategories,
  filterCategoriesByGroup,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useCashbookCategories';
import { CategoryList } from '../components/CategoryList';
import { CategoryForm } from '../components/CategoryForm';

const TAB_ORDER: CategoryGroup[] = ['income', 'expense', 'investment', 'flex'];

type CategoriesPageProps = {
  coupleId: string;
  onClose: () => void;
};

export function CategoriesPage({ coupleId, onClose }: CategoriesPageProps) {
  const { data: categories, isLoading } = useCashbookCategories(coupleId);
  const addMutation = useAddCategory(coupleId);
  const updateMutation = useUpdateCategory(coupleId);
  const deleteMutation = useDeleteCategory(coupleId);

  const [activeTab, setActiveTab] = useState<CategoryGroup>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CashbookCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CashbookCategory | null>(null);
  const [deleteUsedCount, setDeleteUsedCount] = useState(0);

  const handleAdd = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: CashbookCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (category: CashbookCategory) => {
    try {
      const usedCount = await countEntriesByCategory(db, coupleId, category.name);
      if (usedCount > 0) {
        setDeleteUsedCount(usedCount);
        setDeleteTarget(category);
      } else {
        deleteMutation.mutate(category.id);
      }
    } catch {
      toast.error('카테고리 사용 현황을 확인할 수 없습니다');
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleFormSubmit = async (data: {
    name: string;
    icon: string;
    color: string;
    subGroup: string;
  }) => {
    if (editingCategory) {
      await updateMutation.mutateAsync({
        categoryId: editingCategory.id,
        data: {
          name: data.name,
          icon: data.icon,
          color: data.color,
          subGroup: data.subGroup as CashbookCategory['subGroup'],
        },
      });
    } else {
      const activeCategories = filterCategoriesByGroup(categories, activeTab);
      const subGroupOrder = activeCategories.filter(
        (c) => c.subGroup === data.subGroup
      ).length;
      await addMutation.mutateAsync({
        group: activeTab,
        subGroup: data.subGroup as CashbookCategory['subGroup'],
        name: data.name,
        icon: data.icon,
        color: data.color,
        isDefault: false,
        sortOrder: subGroupOrder,
      });
    }
  };

  const formGroup = editingCategory ? editingCategory.group : activeTab;

  return (
    <div className="relative flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <span className="text-sm font-semibold">카테고리 설정</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 탭 + 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CategoryGroup)}
        >
          <TabsList className="w-full">
            {TAB_ORDER.map((group) => (
              <TabsTrigger key={group} value={group} className="flex-1 text-xs">
                {GROUP_LABELS[group]}
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_ORDER.map((group) => (
            <TabsContent key={group} value={group} className="mt-3">
              <CategoryList
                categories={filterCategoriesByGroup(categories, group)}
                group={group}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-3">
          <Button variant="outline" className="w-full text-sm" onClick={handleAdd}>
            <Plus size={14} className="mr-1" />
            카테고리 추가
          </Button>
        </div>
      </div>

      {/* 폼 오버레이 (추가/편집) */}
      {showForm && (
        <div className="absolute inset-0 z-20 flex flex-col bg-background">
          <div className="flex items-center justify-between px-4 h-14 border-b border-border">
            <span className="text-sm font-semibold">
              {editingCategory ? '카테고리 편집' : '카테고리 추가'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowForm(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
            <CategoryForm
              group={formGroup}
              editingCategory={editingCategory ?? undefined}
              onSubmit={handleFormSubmit}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 삭제</DialogTitle>
            <DialogDescription>
              이 카테고리를 사용 중인 항목이 {deleteUsedCount}건 있습니다. 삭제해도
              기존 항목의 카테고리는 그대로 유지됩니다. 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
