import type { ComponentType } from 'react';
import type { IconProps } from '@phosphor-icons/react';
import {
  Wallet,
  Gift,
  Trophy,
  Briefcase,
  ArrowsClockwise,
  House,
  Bank,
  ShieldCheck,
  Lightbulb,
  Envelope,
  BowlFood,
  Broom,
  TShirt,
  HeartStraight,
  Barbell,
  ForkKnife,
  Handshake,
  Confetti,
  FirstAidKit,
  Bus,
  UsersThree,
  BookOpen,
  CreditCard,
  ChartLineUp,
  GlobeHemisphereWest,
  FileText,
  AirplaneTilt,
  FilmSlate,
  ShoppingBag,
  GameController,
  MusicNote,
  PawPrint,
  Coffee,
  Cake,
  DeviceMobile,
  Coin,
  PiggyBank,
  Sparkle,
  Star,
  Tag,
} from '@phosphor-icons/react';

const CATEGORY_ICON_MAP: Record<string, ComponentType<IconProps>> = {
  wallet: Wallet,
  gift: Gift,
  trophy: Trophy,
  briefcase: Briefcase,
  arrows_clockwise: ArrowsClockwise,
  house: House,
  bank: Bank,
  shield_check: ShieldCheck,
  lightbulb: Lightbulb,
  envelope: Envelope,
  bowl_food: BowlFood,
  broom: Broom,
  tshirt: TShirt,
  heart: HeartStraight,
  barbell: Barbell,
  fork_knife: ForkKnife,
  handshake: Handshake,
  confetti: Confetti,
  first_aid: FirstAidKit,
  bus: Bus,
  users_three: UsersThree,
  book_open: BookOpen,
  credit_card: CreditCard,
  chart_line_up: ChartLineUp,
  globe: GlobeHemisphereWest,
  file_text: FileText,
  airplane: AirplaneTilt,
  film_slate: FilmSlate,
  shopping_bag: ShoppingBag,
  game_controller: GameController,
  music_note: MusicNote,
  paw_print: PawPrint,
  coffee: Coffee,
  cake: Cake,
  device_mobile: DeviceMobile,
  coin: Coin,
  piggy_bank: PiggyBank,
  sparkle: Sparkle,
  star: Star,
  tag: Tag,
};

type CategoryIconProps = {
  name: string;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
};

export function CategoryIcon({
  name,
  size = 20,
  color,
  weight = 'duotone',
}: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[name];
  if (!Icon) return <span className="text-base">{name}</span>;
  return <Icon size={size} color={color} weight={weight} />;
}
