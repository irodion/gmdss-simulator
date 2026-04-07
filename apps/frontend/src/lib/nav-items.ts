export interface NavItem {
  to: string;
  labelKey: string;
  icon: string;
  disabled?: boolean;
  sub?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/learn", labelKey: "nav.learn", icon: "📖" },
  { to: "/drill", labelKey: "nav.drill", icon: "🎙", disabled: true, sub: "soon" },
  { to: "/sim", labelKey: "nav.simulator", icon: "📻", disabled: true, sub: "soon" },
  { to: "/tools", labelKey: "nav.reference", icon: "📋" },
];
