import {
  BarChart3,
  Home,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
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
  { title: "Dashboard", href: "/seller/dashboard", icon: Home },
  { title: "Listings", href: "/seller/dashboard/listings", icon: Package },
  { title: "Orders", href: "/seller/dashboard/orders", icon: ShoppingBag },
  { title: "Analytics", href: "/seller/dashboard/analytics", icon: BarChart3 },
];

const secondaryItems = [
  { title: "Messages", href: "/seller/dashboard/messages", icon: MessageSquare },
  { title: "Promotions", href: "/seller/dashboard/promotions", icon: Sparkles },
  { title: "Settings", href: "/seller/dashboard/settings", icon: Settings },
];

const isItemActive = (pathname: string, href: string, title: string) => {
  if (title === "Dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
};

export const SellerSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/70">
      <SidebarHeader className="px-3 py-4">
        <Link
          to="/seller/dashboard"
          className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3 transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="font-display text-lg font-semibold text-sidebar-foreground">
              veng<span className="text-primary">ryd</span>
            </p>
            <p className="text-xs text-sidebar-foreground/60">Seller workspace</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isItemActive(location.pathname, item.href, item.title)} tooltip={item.title}>
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
          <SidebarGroupLabel>Growth</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.href)} tooltip={item.title}>
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

      <SidebarFooter className="px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to home">
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
