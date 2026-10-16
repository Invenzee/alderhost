import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="page"><p className="lead"><span className="sp" /> Loading…</p></main>}>
      <LoginForm />
    </Suspense>
  );
}
