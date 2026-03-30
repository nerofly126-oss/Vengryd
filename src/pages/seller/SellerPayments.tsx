import { useState } from "react";
import { BadgeCheck, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSellerDashboardData, type SellerPaymentMethod } from "@/lib/dashboard-store";

const paymentMethods: SellerPaymentMethod[] = [
  "Bank Transfer",
  "Cash on Delivery",
  "Card",
  "USSD",
];

export default function SellerPayments() {
  const { paymentSettings, setPaymentSettings, addSellerActivity, profile, uploadAvatar, uploadLogo } = useSellerDashboardData();
  const [draft, setDraft] = useState(paymentSettings);

  const canUseMethod = (method: SellerPaymentMethod, current = draft) => {
    if (method === "Bank Transfer" || method === "Cash on Delivery") {
      return current.verificationStatus === "Verified";
    }

    if (method === "Card" || method === "USSD") {
      return current.plan === "Pro";
    }

    return true;
  };

  const toggleMethod = (method: SellerPaymentMethod) => {
    if (!canUseMethod(method)) return;

    setDraft((current) => ({
      ...current,
      enabledMethods: current.enabledMethods.includes(method)
        ? current.enabledMethods.filter((item) => item !== method)
        : [...current.enabledMethods, method],
    }));
  };

  const handleSave = () => {
    setPaymentSettings(draft);
    addSellerActivity({
      name: "Payment Settings",
      action: "Updated verification, plan, and payment methods",
      time: "Just now",
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Payment Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground font-body">
          Start with seller verification and subscription, then control direct payment methods per seller.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <BadgeCheck className="h-5 w-5" />
          </div>
          <p className="text-xs text-muted-foreground">Verification</p>
          <p className="mt-1 font-display text-xl text-foreground">{draft.verificationStatus}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Verified sellers can offer direct Bank Transfer and Cash on Delivery.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="text-xs text-muted-foreground">Subscription</p>
          <p className="mt-1 font-display text-xl text-foreground">{draft.plan}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Pro sellers unlock Card and USSD to support more buyer preferences.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sand/20 text-sand-dark">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-xs text-muted-foreground">Enabled Methods</p>
          <p className="mt-1 font-display text-xl text-foreground">{draft.enabledMethods.length}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Buyer checkout should only show the methods this seller has enabled.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Direct Payment Controls</h2>
          <p className="mt-1 text-sm text-muted-foreground font-body">
            Turn payment methods on or off per seller based on verification and subscription access.
          </p>

          <div className="mt-5 space-y-3">
            {paymentMethods.map((method) => {
              const enabled = draft.enabledMethods.includes(method);
              const locked = !canUseMethod(method);

              return (
                <div key={method} className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{method}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {locked
                        ? method === "Bank Transfer" || method === "Cash on Delivery"
                          ? "Requires seller verification."
                          : "Requires Pro subscription."
                        : "Available for this seller account."}
                    </p>
                  </div>
                  <Switch checked={enabled} disabled={locked} onCheckedChange={() => toggleMethod(method)} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Seller Access</h2>
          <p className="mt-1 text-sm text-muted-foreground font-body">
            Manage the two gates that matter first: verification and subscription.
          </p>

          <div className="mt-5 space-y-4">
            <ProfileImageUploader
              title="Personal Profile Photo"
              description="Used for your seller account identity inside the workspace."
              imageUrl={profile.avatarUrl}
              fallback={profile.initials}
              onUpload={uploadAvatar}
            />

            <ProfileImageUploader
              title="Business Logo"
              description="Displayed in seller-facing profile surfaces and used as your dashboard avatar when available."
              imageUrl={profile.logoUrl}
              fallback={profile.initials}
              onUpload={uploadLogo}
            />

            <div className="space-y-2">
              <Label>Verification Status</Label>
              <Select
                value={draft.verificationStatus}
                onValueChange={(value: "Unverified" | "Verified") =>
                  setDraft((current) => ({
                    ...current,
                    verificationStatus: value,
                    enabledMethods:
                      value === "Verified"
                        ? current.enabledMethods
                        : current.enabledMethods.filter((method) => method !== "Bank Transfer" && method !== "Cash on Delivery"),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unverified">Unverified</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select
                value={draft.plan}
                onValueChange={(value: "Free" | "Pro") =>
                  setDraft((current) => ({
                    ...current,
                    plan: value,
                    enabledMethods:
                      value === "Pro"
                        ? current.enabledMethods
                        : current.enabledMethods.filter((method) => method !== "Card" && method !== "USSD"),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input value={draft.bankName} onChange={(event) => setDraft((current) => ({ ...current, bankName: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input value={draft.accountName} onChange={(event) => setDraft((current) => ({ ...current, accountName: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input value={draft.accountNumber} onChange={(event) => setDraft((current) => ({ ...current, accountNumber: event.target.value }))} />
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-sm font-medium text-foreground">Rollout Logic</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Verified sellers unlock direct methods. Pro sellers unlock premium payment rails. Keep this simple before adding anything more advanced.
              </p>
            </div>

            <Button className="w-full" onClick={handleSave}>
              Save Payment Settings
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
