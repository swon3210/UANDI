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
  readonly periodCompare: Locator;
  readonly trendChart: Locator;
  readonly categoryDonut: Locator;
  readonly categoryDonutBack: Locator;

  categoryDonutItem(name: string): Locator {
    return this.page.getByTestId(`category-donut-item-${name}`);
  }
  readonly emptyState: Locator;

  // 기간 비교 차트
  readonly comparePeriodButton: Locator;
  readonly comparePeriodLabel: Locator;
  readonly comparePickerSheet: Locator;
  readonly compareSummary: Locator;
  readonly compareDelta: Locator;
  readonly compareDeltaEmoji: Locator;
  readonly compareCategoryButton: Locator;
  readonly compareCategorySheet: Locator;
  readonly compareCategorySearch: Locator;
  readonly compareCategoryApply: Locator;
  readonly compareCategoryClear: Locator;
  readonly compareSummaryCaption: Locator;
  readonly donutCategoryButton: Locator;
  readonly meterPercent: Locator;
  readonly meterIncome: Locator;
  readonly meterExpense: Locator;
  readonly meterStatus: Locator;

  /** 카테고리 선택 시트의 상위 카테고리 묶음(헤더 + 하위 목록) */
  compareCategoryGroup(name: string): Locator {
    return this.page.getByTestId(`compare-category-group-${name}`);
  }

  /** 상위 카테고리 행(하위 전체 선택/해제) */
  compareCategoryGroupToggle(name: string): Locator {
    return this.page.getByTestId(`compare-category-group-toggle-${name}`);
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
    this.periodCompare = page.getByTestId('period-compare');
    this.trendChart = page.getByTestId('trend-chart');
    this.categoryDonut = page.getByTestId('category-donut');
    this.categoryDonutBack = page.getByTestId('category-donut-back');
    this.emptyState = page.getByTestId('dashboard-empty');

    this.comparePeriodButton = page.getByTestId('compare-period-button');
    this.comparePeriodLabel = page.getByTestId('compare-period-label');
    this.comparePickerSheet = page.getByTestId('compare-picker-sheet');
    this.compareSummary = page.getByTestId('compare-summary');
    this.compareDelta = page.getByTestId('compare-delta');
    this.compareDeltaEmoji = page.getByTestId('compare-delta-emoji');
    this.compareCategoryButton = page.getByTestId('compare-category-button');
    this.compareCategorySheet = page.getByTestId('compare-category-sheet');
    this.compareCategorySearch = page.getByTestId('compare-category-search');
    this.compareCategoryApply = page.getByTestId('compare-category-apply');
    this.compareCategoryClear = page.getByTestId('compare-category-clear');
    this.compareSummaryCaption = page.getByTestId('compare-summary-caption');
    this.donutCategoryButton = page.getByTestId('donut-category-button');
    this.meterPercent = page.getByTestId('meter-percent');
    this.meterIncome = page.getByTestId('meter-income');
    this.meterExpense = page.getByTestId('meter-expense');
    this.meterStatus = page.getByTestId('meter-status');

    this.recentPhotosSection = page.getByTestId('recent-photos');
    this.monthlySummarySection = page.getByTestId('monthly-summary');
  }

  async goto() {
    await this.page.goto('/');
  }
}
