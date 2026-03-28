---
description: React 컴포넌트에서 useEffect 사용을 최소화하는 원칙. 새 컴포넌트 작성 또는 기존 컴포넌트 수정 시 적용.
globs: ["apps/web/src/**/*.tsx", "apps/web/src/**/*.ts", "packages/ui/src/**/*.tsx"]
---

# useEffect 사용 최소화 원칙

useEffect는 **외부 시스템 동기화**에만 사용한다.

## 허용 케이스 (외부 시스템 동기화)

- DOM 이벤트 리스너 등록/해제
- 외부 라이브러리 초기화/정리 (지도, 차트 등)
- WebSocket / EventSource 구독
- `document.title` 등 브라우저 API 동기화

## 금지 케이스

### 1. 파생 값 계산에 useEffect + setState 금지

```tsx
// Bad
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// Good — 렌더 시 직접 계산
const fullName = `${firstName} ${lastName}`;
```

### 2. "값이 바뀌면 API 호출/mutation" 패턴에 useEffect 금지

```tsx
// Bad — effect 체인으로 무한 루프 위험
const debouncedValue = useDebounce(value, 500);
useEffect(() => {
  onSave(debouncedValue);
}, [debouncedValue, onSave]);

// Good — 이벤트 핸들러에서 직접 debounced 호출
const timerRef = useRef<ReturnType<typeof setTimeout>>();
const handleChange = (newValue: number) => {
  setLocalValue(newValue);
  clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => onSave(newValue), 500);
};
```

### 3. props → local state 동기화에 useEffect 금지

```tsx
// Bad
useEffect(() => {
  setLocalValue(propValue);
}, [propValue]);

// Good — key로 컴포넌트 리셋
<MyComponent key={dataId} initialValue={propValue} />
```

### 4. 다른 state를 업데이트하기 위한 useEffect 금지

state A가 바뀔 때 state B도 바꿔야 한다면, A를 바꾸는 이벤트 핸들러에서 B도 함께 바꾼다.
