import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="font-display text-lg font-bold text-foreground tracking-wide">
          ven<span className="text-primary">gryd</span>
        </Link>
        <p className="text-sm text-muted-foreground font-body">
          © {new Date().getFullYear()} vengryd. Be part of something local.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
