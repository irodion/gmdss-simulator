export interface NavItem {
  to: string;
  labelKey: string;
  icon: string;
  disabled?: boolean;
  sub?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/learn", labelKey: "nav.learn", icon: "📖" },
  { to: "/drill", labelKey: "nav.drill", icon: "🎙" },
  { to: "/sim", labelKey: "nav.simulator", icon: "📻" },
  { to: "/tools", labelKey: "nav.reference", icon: "📋" },
];
