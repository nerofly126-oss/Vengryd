// Site footer: navigation link columns, shop/sell CTAs, and the oversized brand wordmark.
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

type FooterLink = { label: string; to?: string; href?: string };

const columns: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Explore",
    links: [
      { label: "Home", to: "/" },
      { label: "Marketplace", to: "/marketplace" },
      { label: "How it works", to: "/how-it-works" },
      { label: "Categories", to: "/categories" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Sell on vengryd", to: "/seller" },
      { label: "Contact", href: "mailto:vengrydmarketplace@gmail.com" },
      { label: "Terms", to: "/terms" },
      { label: "Privacy", to: "/privacy" },
    ],
  },
  {
    heading: "Social",
    links: [
      { label: "X", href: "https://x.com" },
      { label: "Instagram", href: "https://instagram.com" },
      { label: "LinkedIn", href: "https://linkedin.com" },
    ],
  },
];

const linkClass = "text-sm text-muted-foreground transition-colors hover:text-foreground";

// Renders one footer link as an internal <Link> (when `to` is set) or an external <a> (when `href` is set).
function FooterItem({ link }: { link: FooterLink }) {
  if (link.to) {
    return (
      <Link to={link.to} className={linkClass}>
        {link.label}
      </Link>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noreferrer" className={linkClass}>
      {link.label}
    </a>
  );
}

// Renders the footer layout from the `columns` data plus CTAs and copyright.
const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-card">
      <div className="container pt-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          {/* Brand mark */}
          <Link
            to="/"
            aria-label="vengryd home"
            className="shrink-0 font-display text-xl font-black tracking-tight text-foreground"
          >
            ven<span className="text-primary">gryd</span>
          </Link>

          {/* Navigation columns */}
          <nav className="grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.heading} className="flex flex-col gap-3">
                <p className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
                  {col.heading}
                </p>
                {col.links.map((link) => (
                  <FooterItem key={link.label} link={link} />
                ))}
              </div>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Link
              to="/marketplace"
              className="group inline-flex items-center justify-between gap-3 rounded-full bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-tight text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Shop now
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/seller"
              className="inline-flex items-center justify-between gap-3 rounded-full border-2 border-border px-6 py-3 font-display text-sm font-bold uppercase tracking-tight text-foreground transition-colors hover:border-primary/50"
            >
              Start selling
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <p className="mt-14 text-xs text-muted-foreground">
          © {new Date().getFullYear()} vengryd. Be part of something local.
        </p>
      </div>

      {/* Oversized brand wordmark, bleeding off the bottom edge */}
      <div className="pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <span className="block text-center font-display font-black uppercase leading-[0.72] tracking-tighter text-primary [font-size:clamp(4rem,25vw,24rem)] translate-y-[0.09em]">
          ven<span className="text-foreground">gryd</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
