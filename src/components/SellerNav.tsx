import { Link, useLocation, useSearchParams } from "react-router-dom";
import { LayoutGrid, ShoppingBag, Package, Store, MessageCircle } from "lucide-react";

const TABS = [
  { tab: "overview", label: "Overview", icon: LayoutGrid },
  { tab: "orders", label: "Orders", icon: ShoppingBag },
  { tab: "products", label: "Products", icon: Package },
  { tab: "profile", label: "Profile", icon: Store },
] as const;

function cell(active: boolean) {
  return `flex flex-1 flex-col items-center gap-1 pb-2 pt-1.5 text-[11px] font-semibold transition-colors ${
    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
  }`;
}

/** Fixed bottom navigation shared by the seller dashboard and the messages page. */
export function SellerNav() {
  const location = useLocation();
  const [params] = useSearchParams();
  const onSeller = location.pathname === "/seller";
  const currentTab = params.get("tab") ?? "overview";
  const messagesActive = location.pathname === "/seller/messages";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl">
        {TABS.map((t) => {
          const active = onSeller && currentTab === t.tab;
          return (
            <Link key={t.tab} to={`/seller?tab=${t.tab}`} className={cell(active)}>
              <span className={`h-0.5 w-8 rounded-full ${active ? "bg-primary" : "bg-transparent"}`} />
              <t.icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              {t.label}
            </Link>
          );
        })}
        <Link to="/seller/messages" className={cell(messagesActive)}>
          <span className={`h-0.5 w-8 rounded-full ${messagesActive ? "bg-primary" : "bg-transparent"}`} />
          <MessageCircle className="h-5 w-5" strokeWidth={messagesActive ? 2.4 : 1.8} />
          Messages
        </Link>
      </div>
    </nav>
  );
}
