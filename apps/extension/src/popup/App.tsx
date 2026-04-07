import { Provider as JotaiProvider } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@uandi/ui';
import { useAuth, useAuthInit } from '@/hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { MainPage } from './pages/MainPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});

function AppContent() {
  useAuthInit();
  const { authStatus } = useAuth();

  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <LoginPage />;
  }

  if (authStatus === 'authenticated_no_couple') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          커플 연결이 필요합니다.
          <br />
          웹앱에서 커플 연결을 완료해주세요.
        </p>
      </div>
    );
  }

  return <MainPage />;
}

export function App() {
  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <div className="w-[400px] h-[600px] bg-background text-foreground">
          <AppContent />
        </div>
        <Toaster />
      </QueryClientProvider>
    </JotaiProvider>
  );
}
