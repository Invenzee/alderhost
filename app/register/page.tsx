import { Suspense } from "react";
import { RegisterForm } from "@/app/register/register-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="page"><p className="lead"><span className="sp" /> Loading…</p></main>}>
      <RegisterForm />
    </Suspense>
  );
}
