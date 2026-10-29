import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { registerAccount } from "@/lib/api/auth";
import { useSession } from "@/hooks/useSession";
import { AuthCard, AuthField, AuthSubmit } from "@/components/AuthCard";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — ProfitWise Manufacturing" },
      {
        name: "description",
        content:
          "Register your manufacturing company and start measuring profit on every unit you make.",
      },
      { property: "og:title", content: "Create Account — ProfitWise Manufacturing" },
      {
        property: "og:description",
        content: "Register your company and start calculating manufacturing profit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [values, setValues] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  function validate() {
    const next = {};
    if (!values.companyName.trim()) next["companyName"] = "Company name is required";
    else if (values.companyName.trim().length > 100)
      next["companyName"] = "Company name must be under 100 characters";
    if (!values.email.trim()) next["email"] = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next["email"] = "Enter a valid email address";
    if (!values.password) next["password"] = "Password is required";
    else if (values.password.length < 8)
      next["password"] = "Password must be at least 8 characters";
    if (!values.confirmPassword) next["confirmPassword"] = "Please confirm your password";
    else if (values.confirmPassword !== values.password)
      next["confirmPassword"] = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await registerAccount({
        companyName: values.companyName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
    } catch (error) {
      setSubmitting(false);
      // Show server-side field errors (e.g. "email already exists") next to the field.
      const fieldErrors = {};
      if (error.errors?.email) fieldErrors["email"] = [].concat(error.errors.email)[0];
      if (error.errors?.password) fieldErrors["password"] = [].concat(error.errors.password)[0];
      if (error.errors?.company_name)
        fieldErrors["companyName"] = [].concat(error.errors.company_name)[0];
      setErrors(fieldErrors);
      toast.error(error.message);
      return;
    }

    setSubmitting(false);
    toast.success("Account created. Welcome to ProfitWise.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your company account"
      subtitle="One account for every calculation, result and record you save."
      footer={
        <p className="text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
      onSubmit={onSubmit}
    >
      <AuthField
        label="Company Name"
        value={values.companyName}
        error={errors["companyName"]}
        autoComplete="organization"
        onChange={(v) => setValues((s) => ({ ...s, companyName: v }))}
      />
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
        autoComplete="new-password"
        value={values.password}
        error={errors["password"]}
        onChange={(v) => setValues((s) => ({ ...s, password: v }))}
      />
      <AuthField
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        error={errors["confirmPassword"]}
        onChange={(v) => setValues((s) => ({ ...s, confirmPassword: v }))}
      />
      <AuthSubmit loading={submitting}>Create Account</AuthSubmit>
    </AuthCard>
  );
}
