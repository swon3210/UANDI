// 정적 이미지 import 타입 (Storybook vite / 번들러가 URL 문자열로 변환)
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
