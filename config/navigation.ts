export type NavIconName =
  | "LayoutDashboard"
  | "GraduationCap"
  | "Users"
  | "SquareUserRound"
  | "Settings";

export type NavItem = {
  title: string;
  href: string;
  icon: NavIconName;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Experiences", href: "/dashboard/workshops", icon: "GraduationCap" },
  { title: "Participants", href: "/dashboard/participants", icon: "Users" },
  { title: "Facilitators", href: "/dashboard/facilitators", icon: "SquareUserRound" },
  { title: "Settings", href: "/dashboard/settings", icon: "Settings" },
];
