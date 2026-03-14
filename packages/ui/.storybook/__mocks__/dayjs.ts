// Minimal dayjs mock for Storybook
function dayjs(date?: string | Date) {
  const d = date ? new Date(date) : new Date();
  return {
    format(fmt: string) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      if (fmt === 'YYYY-MM-DD') return `${y}-${m}-${day}`;
      if (fmt === 'YYYY년 M월 D일') return `${y}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
      return `${y}-${m}-${day}`;
    },
    toDate() {
      return d;
    },
  };
}

export default dayjs;
