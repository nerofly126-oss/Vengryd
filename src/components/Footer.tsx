const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <a href="/" className="font-display text-lg font-bold text-foreground tracking-wide">
          veng<span className="text-primary">ryd</span>
        </a>
        <p className="text-sm text-muted-foreground font-body">
          © {new Date().getFullYear()} vengryd. Rooted in community, growing together.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
