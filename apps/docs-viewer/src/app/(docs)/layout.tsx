import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import { MobileMenu } from '@/components/MobileMenu';

export const metadata: Metadata = {
  title: 'UANDI Docs',
  description: 'UANDI 프로젝트 문서',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center gap-3 px-4 bg-white border-b border-[#E8E4E0]">
        <MobileMenu />
        <span className="font-semibold">UANDI Docs</span>
      </header>

      <div className="flex">
        <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#E8E4E0] h-screen fixed top-0 left-0 bg-white">
          <div className="h-14 flex items-center px-6 border-b border-[#E8E4E0] shrink-0">
            <span className="font-semibold text-[#1C1917]">UANDI Docs</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        <main className="flex-1 min-h-screen md:ml-64 pt-14 md:pt-0">
          <div className="max-w-3xl">{children}</div>
        </main>
      </div>
    </>
  );
}
