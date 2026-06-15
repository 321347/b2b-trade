import {
  CookingPot, PawPrint, Puzzle, Dumbbell, Gift, Home, Smartphone,
  Sparkles, Pencil, Wrench, Tent, Shirt, Baby, Car, PartyPopper,
  HeartPulse, Lightbulb, Scissors, Armchair, Backpack, Watch,
} from 'lucide-react';

// 行业 slug → Lucide 图标组件
export const INDUSTRY_ICONS = {
  kitchen:     CookingPot,
  pet:         PawPrint,
  toys:        Puzzle,
  sports:      Dumbbell,
  gift:        Gift,
  home:        Home,
  electronics: Smartphone,
  beauty:      Sparkles,
  stationery:  Pencil,
  auto:        Wrench,
  outdoor:     Tent,
  fashion:     Shirt,
  baby:        Baby,
  car:         Car,
  hardware:    Wrench,
  party:       PartyPopper,
  health:      HeartPulse,
  lighting:    Lightbulb,
  textile:     Scissors,
  furniture:   Armchair,
  bag:         Backpack,
  watches:     Watch,
};

export function IndustryIcon({ slug, size = 24, ...props }) {
  const Icon = INDUSTRY_ICONS[slug];
  if (!Icon) return null;
  return <Icon size={size} {...props} />;
}
