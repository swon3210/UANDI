'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import {
  Header,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Sheet,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  FullScreenSpinner,
} from '@uandi/ui';
import { ChevronLeft, Plus } from 'lucide-react';
import { userAtom } from '@/stores/auth.store';
import {
  useCashbookCategories,
  filterCategoriesByGroup,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useCashbookCategories';
import { countEntriesByCategory } from '@/services/cashbook';
import { GROUP_LABELS } from '@/constants/default-categories';
import { CategoryList } from '@/components/cashbook/CategoryList';
import { CategoryForm } from '@/components/cashbook/CategoryForm';
import { BottomNav } from '@/components/BottomNav';
import type { CashbookCategory, CategoryGroup } from '@/types';

const TAB_ORDER: CategoryGroup[] = ['income', 'expense', 'investment', 'flex'];

export default function CashbookCategoriesPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  const { data: categories, isLoading } = useCashbookCategories(coupleId);
  const addMutation = useAddCategory(coupleId);
  const updateMutation = useUpdateCategory(coupleId);
  const deleteMutation = useDeleteCategory(coupleId);

  const [activeTab, setActiveTab] = useState<CategoryGroup>('income');
  const groupCategories = filterCategoriesByGroup(categories, activeTab);

  const handleAdd = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CategoryForm
          group={activeTab}
          onSubmit={(data) => {
            addMutation.mutate({
              group: activeTab,
              subGroup: data.subGroup as CashbookCategory['subGroup'],
              name: data.name,
              icon: data.icon,
              color: data.color,
              isDefault: false,
              sortOrder: groupCategories.length,
            });
          }}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleEdit = (category: CashbookCategory) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CategoryForm
          group={category.group}
          editingCategory={category}
          onSubmit={(data) => {
            updateMutation.mutate({
              categoryId: category.id,
              data: {
                name: data.name,
                icon: data.icon,
                color: data.color,
                subGroup: data.subGroup as CashbookCategory['subGroup'],
              },
            });
          }}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleDelete = async (category: CashbookCategory) => {
    // 전체 항목에서 해당 카테고리 사용 여부 확인
    if (coupleId) {
      const usedCount = await countEntriesByCategory(coupleId, category.name);

      if (usedCount > 0) {
        const confirmed = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              if (!open) {
                close(false);
                setTimeout(unmount, 300);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>카테고리 삭제</DialogTitle>
                <DialogDescription>
                  이 카테고리를 사용 중인 항목이 {usedCount}건 있습니다. 삭제해도 기존 항목의
                  카테고리는 그대로 유지됩니다. 삭제하시겠습니까?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    close(false);
                    setTimeout(unmount, 300);
                  }}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    close(true);
                    setTimeout(unmount, 300);
                  }}
                >
                  삭제
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ));

        if (!confirmed) return;
      }
    }

    deleteMutation.mutate(category.id);
  };

  if (isLoading) return <FullScreenSpinner />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="categories-header"
        title="카테고리 설정"
        leftSlot={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-testid="header-left"
            onClick={() => router.back()}
          >
            <ChevronLeft size={20} />
          </Button>
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryGroup)}>
          <TabsList className="w-full">
            {TAB_ORDER.map((group) => (
              <TabsTrigger key={group} value={group} className="flex-1">
                {GROUP_LABELS[group]}
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_ORDER.map((group) => (
            <TabsContent key={group} value={group} className="mt-4">
              <CategoryList
                categories={filterCategoriesByGroup(categories, group)}
                group={group}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4">
          <Button variant="outline" className="w-full" onClick={handleAdd}>
            <Plus size={16} className="mr-2" />
            카테고리 추가
          </Button>
        </div>
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}
