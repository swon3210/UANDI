import { Briefcase, Check, ChevronDown, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/dropdown-menu';

export type Space = 'inner' | 'outer';

type SpaceMeta = {
  label: string;
  Icon: typeof Home;
  description: string;
};

const SPACE_META: Record<Space, SpaceMeta> = {
  inner: {
    label: '우리집',
    Icon: Home,
    description: '가계부 · 갤러리',
  },
  outer: {
    label: '재테크',
    Icon: Briefcase,
    description: '환테크 · 투자 · 적금',
  },
};

export type SpaceSwitcherProps = {
  currentSpace: Space;
  onSpaceChange: (space: Space) => void;
  className?: string;
};

export function SpaceSwitcher({ currentSpace, onSpaceChange, className }: SpaceSwitcherProps) {
  const current = SPACE_META[currentSpace];
  const CurrentIcon = current.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        aria-label="공간 전환"
      >
        <CurrentIcon size={18} className="text-primary" />
        <span>{current.label}</span>
        <ChevronDown size={16} className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[12rem]">
        {(['inner', 'outer'] as const).map((space) => {
          const meta = SPACE_META[space];
          const Icon = meta.Icon;
          const isActive = space === currentSpace;
          return (
            <DropdownMenuItem
              key={space}
              onSelect={() => onSpaceChange(space)}
              className="flex items-center gap-3 py-2"
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{meta.label}</span>
                <span className="text-xs text-muted-foreground">{meta.description}</span>
              </div>
              {isActive && <Check size={16} className="text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
