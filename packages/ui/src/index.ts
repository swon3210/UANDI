// 유틸리티
export { cn } from './lib/utils';

// 브랜드
export { Logo } from './Logo';
export type { LogoProps, LogoVariant } from './Logo';

// 커스텀 컴포넌트
export { Header } from './custom/Header';
export { EmptyState } from './custom/EmptyState';
export { FullScreenSpinner } from './custom/FullScreenSpinner';
export { AppSidebar } from './custom/AppSidebar';
export type {
  Space,
  SidebarNavItem,
  SidebarSection,
  SidebarLinkProps,
  AppSidebarProps,
} from './custom/AppSidebar';

// 커뮤니티 카드 (프레젠테이션 전용 — 도메인 타입과 디커플)
export { PostAuthor } from './custom/community/PostAuthor';
export type { PostAuthorProps } from './custom/community/PostAuthor';
export { UserPostCard } from './custom/community/UserPostCard';
export type { UserPostCardProps } from './custom/community/UserPostCard';
export { LinkPostCard } from './custom/community/LinkPostCard';
export type { LinkPostCardProps } from './custom/community/LinkPostCard';
export { CommunityPostCard } from './custom/community/CommunityPostCard';
export type { CommunityPostCardProps } from './custom/community/CommunityPostCard';
export {
  CommunityComposer,
  COMMUNITY_COMPOSER_MAX_BODY,
  COMMUNITY_COMPOSER_MAX_IMAGE_BYTES,
} from './custom/community/CommunityComposer';
export type {
  CommunityComposerProps,
  CommunityComposerSubmit,
} from './custom/community/CommunityComposer';
export { ReportMenu } from './custom/community/ReportMenu';
export type { ReportMenuProps } from './custom/community/ReportMenu';

// shadcn 컴포넌트
export { Button, buttonVariants } from './components/button';
export type { ButtonProps } from './components/button';
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './components/input-otp';
export { Skeleton } from './components/skeleton';
export { Avatar, AvatarImage, AvatarFallback } from './components/avatar';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/tabs';
export { Badge, badgeVariants } from './components/badge';
export type { BadgeProps } from './components/badge';
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './components/sheet';
export { Input } from './components/input';
export { Textarea } from './components/textarea';
export { Separator } from './components/separator';
export { Label } from './components/label';
export { Progress } from './components/progress';
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './components/select';
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './components/dropdown-menu';
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/dialog';
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from './components/form';
export { Popover, PopoverTrigger, PopoverContent } from './components/popover';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/tooltip';
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './components/command';
export { Toaster } from './components/sonner';
export { RadioGroup, RadioGroupItem } from './components/radio-group';
export { Checkbox } from './components/checkbox';
export { Slider } from './components/slider';
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './components/collapsible';
export { Switch } from './components/switch';
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from './components/chart';
export type { ChartConfig } from './components/chart';
