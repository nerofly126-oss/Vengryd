import { Link } from "react-router-dom";

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

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-foreground">{heading}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

const Privacy = () => {
  return (
    <LegalShell title="Privacy Policy">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Your privacy matters to us. This policy explains what information vengryd collects, how we use it, and the
        choices you have.
      </p>

      <Section heading="1. Information we collect">
        <p>We collect information you give us directly, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details such as your name and email address.</li>
          <li>Vendor profile details you choose to publish, including your location and contact details.</li>
          <li>Listings, ratings, and the content of messages you send through the platform.</li>
          <li>Your chosen area, so we can show vendors near you.</li>
        </ul>
        <p>
          We also collect limited technical data (such as device and usage information) to keep the service running and
          secure.
        </p>
      </Section>

      <Section heading="2. How we use your information">
        <p>
          We use your information to operate the marketplace: to show listings, connect buyers and vendors, deliver
          messages, display ratings, surface nearby vendors, and keep accounts secure. We do not sell your personal
          information.
        </p>
      </Section>

      <Section heading="3. Information shared with others">
        <p>
          Some information is public by design. Your vendor profile, listings, ratings, and the contact details you add
          are visible to other users. Messages are visible only to you and the person you are messaging.
        </p>
      </Section>

      <Section heading="4. Storage and security">
        <p>
          Your data is stored using Supabase, our infrastructure provider, with access controls and row-level security in
          place. While we take reasonable measures to protect your information, no system is completely secure.
        </p>
      </Section>

      <Section heading="5. Your choices">
        <p>
          You can review and update your profile and contact details at any time. You can change appearance and other
          preferences in Settings. If you would like your account and associated data removed, contact us and we will
          help.
        </p>
      </Section>

      <Section heading="6. Cookies and sessions">
        <p>
          We use local storage and cookies to keep you signed in and to remember preferences such as your selected area,
          cart, and favourites. These are essential to how the marketplace works.
        </p>
      </Section>

      <Section heading="7. Contact">
        <p>
          Questions about your privacy? Reach us at{" "}
          <a href="mailto:vengrydmarketplace@gmail.com" className="text-primary hover:underline">
            vengrydmarketplace@gmail.com
          </a>
          .
        </p>
      </Section>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">
        See also our{" "}
        <Link to="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </LegalShell>
  );
};

export default Privacy;
