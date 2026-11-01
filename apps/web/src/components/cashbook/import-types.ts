import type { CategoryGroup, CategorySubGroup } from '@/types';

/** 지난 내역 가져오기의 첨부 종류 — 파싱 요청의 imageKind. */
export type ImportSource = 'account' | 'card';

/**
 * AI가 제안한 새 카테고리를 사용자가 확인·수정하는 초안.
 * originalName은 파싱된 내역의 category와 매칭하는 키이고, name은 사용자가 고친 최종 이름이다.
 */
export type SuggestedCategoryDraft = {
  originalName: string;
  name: string;
  group: CategoryGroup;
  subGroup: CategorySubGroup;
  /** CATEGORY_ICON_MAP 키 */
  icon: string;
  /** 이 카테고리로 분류된 내역 수 */
  entryCount: number;
  /** 체크(포함) 여부. 빼면 해당 내역은 '기타'로 간다 */
  included: boolean;
};

/** 파싱 결과 중 기본(기존) 카테고리로 분류된 것의 이름·건수. */
export type UsedCategoryCount = { name: string; count: number };
