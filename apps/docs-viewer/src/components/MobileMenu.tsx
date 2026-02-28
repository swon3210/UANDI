'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-md text-[#57534E] hover:bg-[#F5F3F0] transition-colors"
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>

      {open && (
        <>
          {/* 오버레이 */}
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
          {/* 사이드바 패널 */}
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#E8E4E0]">
              <span className="font-semibold text-[#1C1917]">UANDI Docs</span>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-md text-[#57534E] hover:bg-[#F5F3F0] transition-colors"
                aria-label="메뉴 닫기"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
