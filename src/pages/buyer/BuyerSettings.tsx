import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import { useBuyerDashboardData } from "@/lib/dashboard-store";

export default function BuyerSettings() {
  const { profile, uploadAvatar } = useBuyerDashboardData();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground font-body">
          Upload your personal picture so your buyer workspace feels like yours.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="space-y-4">
          <ProfileImageUploader
            title="Personal Profile Photo"
            description="This image appears in your buyer dashboard header."
            imageUrl={profile.avatarUrl}
            fallback={profile.initials}
            onUpload={uploadAvatar}
          />
        </div>
      </section>
    </div>
  );
}
