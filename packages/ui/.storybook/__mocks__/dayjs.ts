// Dayjs mock for Storybook — supports the subset of API used in components/stories

const DAY_NAMES_KO = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_NAMES_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function startDate(d: Date, unit?: string): Date {
  if (unit === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (unit === 'week') return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  if (unit === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
  if (unit === 'year') return new Date(d.getFullYear(), 0, 1);
  return d;
}

function toNativeDate(other: any): Date {
  return other._d || other.toDate?.() || new Date(other);
}

function compare(d: Date, other: any, unit?: string) {
  return startDate(d, unit).getTime() - startDate(toNativeDate(other), unit).getTime();
}

function dayjsObj(d: Date) {
  const obj = {
    _d: d,
    format(fmt: string) {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const dow = DAY_NAMES_SHORT[d.getDay()];
      return fmt
        .replace('YYYY', String(y))
        .replace('MM', pad(m))
        .replace('M', String(m))
        .replace('DD', pad(day))
        .replace('D', String(day))
        .replace('dd', dow);
    },
    toDate() {
      return new Date(d);
    },
    year(n?: number): any {
      if (n === undefined) return d.getFullYear();
      const nd = new Date(d);
      nd.setFullYear(n);
      return dayjsObj(nd);
    },
    month(n?: number): any {
      if (n === undefined) return d.getMonth();
      const nd = new Date(d);
      nd.setMonth(n);
      return dayjsObj(nd);
    },
    valueOf() {
      return d.getTime();
    },
    date() {
      return d.getDate();
    },
    day() {
      return d.getDay();
    },
    startOf(unit: string) {
      if (unit === 'day') return dayjsObj(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      if (unit === 'month') return dayjsObj(new Date(d.getFullYear(), d.getMonth(), 1));
      if (unit === 'week') {
        const diff = d.getDay();
        return dayjsObj(new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff));
      }
      if (unit === 'year') return dayjsObj(startDate(d, 'year'));
      return dayjsObj(new Date(d));
    },
    endOf(unit: string) {
      if (unit === 'day') return dayjsObj(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
      if (unit === 'month') return dayjsObj(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      if (unit === 'week') {
        const s = startDate(d, 'week');
        return dayjsObj(new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6));
      }
      if (unit === 'year') return dayjsObj(new Date(d.getFullYear(), 11, 31));
      return dayjsObj(new Date(d));
    },
    add(n: number, unit: string) {
      const nd = new Date(d);
      if (unit === 'day') nd.setDate(nd.getDate() + n);
      if (unit === 'month') nd.setMonth(nd.getMonth() + n);
      if (unit === 'year') nd.setFullYear(nd.getFullYear() + n);
      return dayjsObj(nd);
    },
    subtract(n: number, unit: string) {
      return obj.add(-n, unit);
    },
    diff(other: any, unit?: string) {
      const otherDate = other._d || other.toDate?.() || new Date(other);
      const ms = d.getTime() - otherDate.getTime();
      if (unit === 'day') return Math.floor(ms / 86400000);
      if (unit === 'month') return (d.getFullYear() - otherDate.getFullYear()) * 12 + d.getMonth() - otherDate.getMonth();
      return ms;
    },
    isBefore(other: any, unit?: string) {
      return compare(d, other, unit) < 0;
    },
    isAfter(other: any, unit?: string) {
      return compare(d, other, unit) > 0;
    },
    isSame(other: any, unit?: string) {
      return compare(d, other, unit) === 0;
    },
    isoWeekday(target?: number) {
      // ISO weekday: 1=Mon, 7=Sun
      const current = d.getDay() === 0 ? 7 : d.getDay();
      if (target === undefined) return current;
      const diff = target - current;
      const nd = new Date(d);
      nd.setDate(nd.getDate() + diff);
      return dayjsObj(nd);
    },
    locale() {
      return obj;
    },
  };
  return obj;
}

function dayjs(date?: string | Date | number) {
  const d = date !== undefined ? new Date(date) : new Date();
  return dayjsObj(d);
}

dayjs.extend = () => {};
dayjs.locale = () => {};

export default dayjs;
