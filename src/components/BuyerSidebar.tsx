import {
  Compass,
  HelpCircle,
  Heart,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const primaryItems = [
  { title: "Dashboard", href: "/buyer/dashboard", icon: Home },
  { title: "Orders", href: "/buyer/dashboard/orders", icon: Package },
  { title: "Browse", href: "/buyer/dashboard/browse", icon: Compass },
  { title: "Wishlist", href: "/buyer/dashboard/wishlist", icon: Heart },
];

const secondaryItems = [
  { title: "Recommendations", href: "/buyer/dashboard", icon: Sparkles },
  { title: "Settings", href: "/buyer/dashboard/settings", icon: Settings },
];

const isItemActive = (pathname: string, href: string, title: string) => {
  if (title === "Dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
};

export const BuyerSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-none bg-transparent p-4 pr-0 group-data-[collapsible=icon]:pr-2"
    >
      <SidebarHeader className="px-3 pb-4 pt-5">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-[24px] border border-[#e4e7d6] bg-[#fbfcf7] px-3 py-3 shadow-[0_18px_45px_-32px_rgba(31,41,18,0.45)] transition-all hover:border-[#d8e7ba] hover:bg-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dff4bf] text-[#5a8d1f]">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="font-display text-lg font-semibold text-[#233015]">
              veng<span className="text-[#76ba2b]">ryd</span>
            </p>
            <p className="text-xs text-[#6f7762]">Buyer marketplace</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d957f]">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isItemActive(location.pathname, item.href, item.title)}
                    tooltip={item.title}
                    className="h-11 rounded-2xl px-3 text-[13px] font-medium text-[#67705a] transition-all hover:bg-[#eff6df] hover:text-[#3f5c17] data-[active=true]:bg-[#ebf8cd] data-[active=true]:text-[#4d7b18] data-[active=true]:shadow-[0_14px_30px_-24px_rgba(118,186,43,0.9)] [&>svg]:size-4 [&>svg]:text-current"
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 pt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d957f]">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="h-11 rounded-2xl px-3 text-[13px] font-medium text-[#67705a] transition-all hover:bg-[#f4f7eb] hover:text-[#3f5c17] [&>svg]:size-4 [&>svg]:text-current"
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-5 pt-4">
        <div className="mb-3 overflow-hidden rounded-[26px] border border-[#d7ebba] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(222,246,182,0.95)_58%,_rgba(188,229,116,1))] p-4 group-data-[collapsible=icon]:hidden">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#5f8f21] shadow-sm">
            <HelpCircle className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-[#29400f]">Need help?</p>
          <p className="mt-1 text-xs leading-5 text-[#557131]">
            Reach out if you need help tracking orders or discovering trusted vendors nearby.
          </p>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Back to home"
              className="h-11 rounded-2xl px-3 text-[13px] font-medium text-[#67705a] transition-all hover:bg-[#f4f7eb] hover:text-[#3f5c17] [&>svg]:size-4 [&>svg]:text-current"
            >
              <Link to="/">
                <LogOut />
                <span>Back to home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
