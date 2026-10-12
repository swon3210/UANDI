import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly header: Locator;

  // 가계부 대시보드
  readonly periodSelector: Locator;
  readonly periodTabWeekly: Locator;
  readonly periodTabMonthly: Locator;
  readonly periodTabYearly: Locator;

  readonly periodNavigator: Locator;
  readonly periodNavLabel: Locator;
  readonly periodPrevButton: Locator;
  readonly periodNextButton: Locator;
  readonly periodPickerSheet: Locator;
  readonly periodPickerPrev: Locator;
  readonly periodPickerNext: Locator;
  readonly periodPickerTitle: Locator;

  periodPickerMonth(month: number): Locator {
    return this.page.getByTestId(`period-picker-month-${month}`);
  }

  periodPickerYear(year: number): Locator {
    return this.page.getByTestId(`period-picker-year-${year}`);
  }

  periodPickerDay(date: string): Locator {
    return this.page.getByTestId(`period-picker-day-${date}`);
  }

  readonly groupTabs: Locator;
  readonly groupTabAll: Locator;
  readonly groupTabIncome: Locator;
  readonly groupTabExpense: Locator;
  readonly groupTabFlex: Locator;
  readonly groupTabInvestment: Locator;

  readonly subGroupTabs: Locator;

  subGroupTab(name: string): Locator {
    return this.subGroupTabs.getByRole('tab', { name });
  }

  readonly totalAmount: Locator;
  readonly trendChart: Locator;
  readonly categoryDonut: Locator;
  readonly emptyState: Locator;

  // 기간 비교 차트
  readonly comparePeriodButton: Locator;
  readonly comparePeriodLabel: Locator;
  readonly comparePickerSheet: Locator;
  readonly compareSummary: Locator;
  readonly compareDelta: Locator;
  readonly compareCategoryButton: Locator;
  readonly compareCategorySheet: Locator;
  readonly compareCategorySearch: Locator;
  readonly compareCategoryApply: Locator;

  /** 기간 비교 카드에 표시된(선택된) 카테고리 칩 */
  compareCategoryChip(name: string): Locator {
    return this.page.getByTestId(`compare-category-chip-${name}`);
  }

  compareCategoryRemove(name: string): Locator {
    return this.page.getByTestId(`compare-category-remove-${name}`);
  }

  /** 카테고리 선택 시트의 목록 항목 */
  compareCategoryOption(name: string): Locator {
    return this.page.getByTestId(`compare-category-option-${name}`);
  }

  // 제거된 영역 검증용
  readonly recentPhotosSection: Locator;
  readonly monthlySummarySection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('dashboard-header');

    this.periodSelector = page.getByTestId('period-selector');
    this.periodTabWeekly = this.periodSelector.getByRole('tab', { name: '주간' });
    this.periodTabMonthly = this.periodSelector.getByRole('tab', { name: '월간' });
    this.periodTabYearly = this.periodSelector.getByRole('tab', { name: '연간' });

    this.periodNavigator = page.getByTestId('period-navigator');
    this.periodNavLabel = page.getByTestId('period-nav-label');
    this.periodPrevButton = page.getByTestId('period-prev');
    this.periodNextButton = page.getByTestId('period-next');
    this.periodPickerSheet = page.getByTestId('period-picker-sheet');
    this.periodPickerPrev = page.getByTestId('period-picker-prev');
    this.periodPickerNext = page.getByTestId('period-picker-next');
    this.periodPickerTitle = page.getByTestId('period-picker-title');

    this.groupTabs = page.getByTestId('group-tabs');
    this.groupTabAll = this.groupTabs.getByRole('tab', { name: '전체' });
    this.groupTabIncome = this.groupTabs.getByRole('tab', { name: '수입' });
    this.groupTabExpense = this.groupTabs.getByRole('tab', { name: '지출' });
    this.groupTabFlex = this.groupTabs.getByRole('tab', { name: 'FLEX' });
    this.groupTabInvestment = this.groupTabs.getByRole('tab', { name: '투자' });

    this.subGroupTabs = page.getByTestId('subgroup-tabs');

    this.totalAmount = page.getByTestId('dashboard-total');
    this.trendChart = page.getByTestId('trend-chart');
    this.categoryDonut = page.getByTestId('category-donut');
    this.emptyState = page.getByTestId('dashboard-empty');

    this.comparePeriodButton = page.getByTestId('compare-period-button');
    this.comparePeriodLabel = page.getByTestId('compare-period-label');
    this.comparePickerSheet = page.getByTestId('compare-picker-sheet');
    this.compareSummary = page.getByTestId('compare-summary');
    this.compareDelta = page.getByTestId('compare-delta');
    this.compareCategoryButton = page.getByTestId('compare-category-button');
    this.compareCategorySheet = page.getByTestId('compare-category-sheet');
    this.compareCategorySearch = page.getByTestId('compare-category-search');
    this.compareCategoryApply = page.getByTestId('compare-category-apply');

    this.recentPhotosSection = page.getByTestId('recent-photos');
    this.monthlySummarySection = page.getByTestId('monthly-summary');
  }

  async goto() {
    await this.page.goto('/');
  }
}
