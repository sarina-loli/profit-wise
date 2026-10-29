import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loginAccount } from "@/lib/api/auth";
import { useSession } from "@/hooks/useSession";
import { AuthCard, AuthField, AuthSubmit } from "@/components/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — ProfitWise Manufacturing" },
      {
        name: "description",
        content: "Sign in to your ProfitWise Manufacturing account to run profit calculations.",
      },
      { property: "og:title", content: "Login — ProfitWise Manufacturing" },
      {
        property: "og:description",
        content: "Sign in to your ProfitWise Manufacturing account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  function validate() {
    const next = {};
    if (!values.email.trim()) next["email"] = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next["email"] = "Enter a valid email address";
    if (!values.password) next["password"] = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await loginAccount({ email: values.email.trim(), password: values.password });
    } catch (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    setSubmitting(false);
    toast.success("Welcome back.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in to ProfitWise"
      subtitle="Pick up exactly where your numbers left off."
      footer={
        <p className="text-sm text-muted-foreground">
          No account yet?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      }
      onSubmit={onSubmit}
    >
      <AuthField
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        error={errors["email"]}
        onChange={(v) => setValues((s) => ({ ...s, email: v }))}
      />
      <AuthField
        label="Password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        error={errors["password"]}
        onChange={(v) => setValues((s) => ({ ...s, password: v }))}
      />
      <AuthSubmit loading={submitting}>Login</AuthSubmit>
    </AuthCard>
  );
}
