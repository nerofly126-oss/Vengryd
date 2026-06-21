import { Link } from "react-router-dom";

// Terms of Service page (route: /terms) — static legal copy for the marketplace.

// Shared legal-page layout: header, title with last-updated date, and a content slot.
function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">
            Back to website
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated 14 June 2026</p>
        <div className="mt-8 space-y-6">{children}</div>
      </main>
    </div>
  );
}

// Titled content block for one numbered terms section.
function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-foreground">{heading}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

/** Terms page: renders the Terms of Service sections inside LegalShell. */
const Terms = () => {
  return (
    <LegalShell title="Terms of Service">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Welcome to vengryd. By creating an account or using our marketplace you agree to these terms. Please read them
        carefully — they explain what you can expect from us and what we expect from you.
      </p>

      <Section heading="1. Using vengryd">
        <p>
          vengryd is a hyper-local marketplace that connects buyers with nearby vendors and product sellers. You must be
          at least 18 years old, or the age of majority in your location, to use the platform. You are responsible for
          keeping your account credentials secure and for all activity that happens under your account.
        </p>
      </Section>

      <Section heading="2. Buyers">
        <p>
          When you place an order or contact a vendor, you agree to provide accurate information and to communicate in
          good faith. Prices are listed in Nigerian Naira (₦). vengryd is not party to transactions between you and a
          vendor; any agreement to buy, sell, or deliver goods and services is strictly between you and that vendor.
        </p>
      </Section>

      <Section heading="3. Vendors and sellers">
        <p>
          If you list products or services, you are responsible for the accuracy of your listings, the legality of what
          you sell, your contact details, and fulfilling orders you accept. You may not list prohibited, counterfeit, or
          unlawful items. We may remove listings or suspend accounts that violate these terms.
        </p>
      </Section>

      <Section heading="4. Messaging and conduct">
        <p>
          Our messaging feature is provided to help buyers and vendors coordinate. You agree not to use it to send spam,
          harassment, fraudulent offers, or unlawful content. We may review reported conversations to keep the community
          safe.
        </p>
      </Section>

      <Section heading="5. Ratings and reviews">
        <p>
          Ratings must reflect genuine experiences. Manipulating ratings — for example posting fake reviews or pressuring
          others to change theirs — is not allowed.
        </p>
      </Section>

      <Section heading="6. Liability">
        <p>
          vengryd is provided "as is". To the fullest extent permitted by law, we are not liable for disputes, losses, or
          damages arising from transactions between buyers and vendors. We do not guarantee the quality, safety, or
          legality of items listed.
        </p>
      </Section>

      <Section heading="7. Changes">
        <p>
          We may update these terms from time to time. If we make material changes we will update the date above and,
          where appropriate, notify you. Continued use of vengryd after changes means you accept the revised terms.
        </p>
      </Section>

      <Section heading="8. Contact">
        <p>
          Questions about these terms? Reach us at{" "}
          <a href="mailto:vengrydmarketplace@gmail.com" className="text-primary hover:underline">
            vengrydmarketplace@gmail.com
          </a>
          .
        </p>
      </Section>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">
        See also our{" "}
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalShell>
  );
};

export default Terms;
