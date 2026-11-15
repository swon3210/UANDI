import { formatKrwRate, formatRateNumber } from '@/utils/currency';

type Props = {
  value: number;
  /** 원화 기호(ko "원" / en "₩")에 붙일 클래스 */
  unitClassName?: string;
};

/** 숫자는 크게, 원화 기호는 작게 따로 그리는 환율 표기. ko 는 뒤에 "원", en 은 앞에 "₩". */
export function KrwRate({ value, unitClassName }: Props) {
  const number = formatRateNumber(value);
  const [before, after] = formatKrwRate(value).split(number);
  return (
    <>
      {before && <span className={unitClassName}>{before}</span>}
      {number}
      {after && <span className={unitClassName}>{after}</span>}
    </>
  );
}
