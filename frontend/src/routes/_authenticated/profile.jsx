import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PremiumCard } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import { changePassword, logoutAccount } from "@/lib/api/auth";
import { getMyProfile, updateMyProfile } from "@/lib/api/profiles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ProfitWise Manufacturing" },
      {
        name: "description",
        content:
          "Manage your company details, contact information and password for ProfitWise Manufacturing.",
      },
      { property: "og:title", content: "Profile — ProfitWise Manufacturing" },
      {
        property: "og:description",
        content: "Manage your company profile and account password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function Field({ label, value, onChange, error, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-2 w-full rounded-xl border bg-secondary/60 px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-primary focus:bg-secondary",
          error ? "border-destructive" : "border-input",
        )}
      />
      {error ? <span className="mt-1.5 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    phone_number: "",
    industry: "",
    location: "",
  });
  const [errors, setErrors] = useState({});

  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    if (data) {
      setForm({
        company_name: data.company_name ?? "",
        phone_number: data.phone_number ?? "",
        industry: data.industry ?? "",
        location: data.location ?? "",
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
      toast.success("Profile updated.");
    },
    onError: (error) => toast.error(error.message || "Could not update your profile."),
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswords({ next: "", confirm: "" });
      toast.success("Password changed.");
    },
    onError: (error) => toast.error(error.message || "Could not change your password."),
  });

  function onSaveProfile(e) {
    e.preventDefault();
    const next = {};
    if (!form.company_name.trim()) next["company_name"] = "Company name is required";
    if (form.phone_number.trim() && !/^[+\d][\d\s()-]{5,19}$/.test(form.phone_number.trim()))
      next["phone_number"] = "Enter a valid phone number";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    saveMutation.mutate({
      company_name: form.company_name.trim(),
      phone_number: form.phone_number.trim() || null,
      industry: form.industry.trim() || null,
      location: form.location.trim() || null,
    });
  }

  function onChangePassword(e) {
    e.preventDefault();
    const next = {};
    if (!passwords.next) next["next"] = "New password is required";
    else if (passwords.next.length < 8) next["next"] = "Password must be at least 8 characters";
    if (passwords.confirm !== passwords.next) next["confirm"] = "Passwords do not match";
    setPasswordErrors(next);
    if (Object.keys(next).length > 0) return;
    passwordMutation.mutate(passwords.next);
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await logoutAccount();
    await router.invalidate();
    navigate({ to: "/login", replace: true });
  }

  const details = [
    { label: "Company Name", value: data?.company_name || "—" },
    { label: "Email", value: data?.email || "—" },
    { label: "Phone Number", value: data?.phone_number || "—" },
    { label: "Industry", value: data?.industry || "—" },
    { label: "Location", value: data?.location || "—" },
    {
      label: "Date Joined",
      value: data?.created_at
        ? new Date(data.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—",
    },
  ];

  return (
    <PageShell
      eyebrow="Profile"
      title="Company account"
      subtitle="Your company details and account security, in one place."
      actions={
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors duration-300 hover:border-destructive hover:text-destructive"
        >
          <LogOut className="size-4" /> Logout
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-5">
        <Reveal className="lg:col-span-3">
          <PremiumCard>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary/60" />
                ))}
              </div>
            ) : editing ? (
              <form onSubmit={onSaveProfile} className="space-y-4" noValidate>
                <Field
                  label="Company Name"
                  value={form.company_name}
                  error={errors["company_name"]}
                  onChange={(v) => setForm((s) => ({ ...s, company_name: v }))}
                />
                <Field
                  label="Phone Number"
                  value={form.phone_number}
                  error={errors["phone_number"]}
                  placeholder="+1 555 010 2030"
                  onChange={(v) => setForm((s) => ({ ...s, phone_number: v }))}
                />
                <Field
                  label="Industry"
                  value={form.industry}
                  placeholder="Food processing"
                  onChange={(v) => setForm((s) => ({ ...s, industry: v }))}
                />
                <Field
                  label="Location"
                  value={form.location}
                  placeholder="Cebu, Philippines"
                  onChange={(v) => setForm((s) => ({ ...s, location: v }))}
                />
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.02] disabled:opacity-70"
                    style={{ background: "var(--gradient-amber)" }}
                  >
                    {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-xl border border-border px-5 py-3 text-sm font-medium transition-colors duration-300 hover:border-primary hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="divide-y divide-border">
                  {details.map((d) => (
                    <div
                      key={d.label}
                      className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
                        {d.label}
                      </span>
                      <span className="text-sm font-medium sm:text-right">{d.value}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-6 rounded-xl px-5 py-3 font-display text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.02]"
                  style={{ background: "var(--gradient-amber)" }}
                >
                  Edit Profile
                </button>
              </>
            )}
          </PremiumCard>
        </Reveal>

        <Reveal delay={90} className="lg:col-span-2">
          <PremiumCard className="h-full">
            <p className="font-display text-base font-semibold">Change Password</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Use at least 8 characters for your new password.
            </p>
            <form onSubmit={onChangePassword} className="mt-6 space-y-4" noValidate>
              <Field
                label="New Password"
                type="password"
                value={passwords.next}
                error={passwordErrors["next"]}
                onChange={(v) => setPasswords((s) => ({ ...s, next: v }))}
              />
              <Field
                label="Confirm New Password"
                type="password"
                value={passwords.confirm}
                error={passwordErrors["confirm"]}
                onChange={(v) => setPasswords((s) => ({ ...s, confirm: v }))}
              />
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition-colors duration-300 hover:border-primary hover:text-primary disabled:opacity-70"
              >
                {passwordMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Update Password
              </button>
            </form>
          </PremiumCard>
        </Reveal>
      </div>
    </PageShell>
  );
}
