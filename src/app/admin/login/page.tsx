import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/SectionHeading";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <>
      <PageHeader eyebrow="Admin" title="SIGN IN" lede="This view is for the core team. One password, no accounts." />
      {/* The form gets its own labelled section so the page's heading order
          runs h1 → h2 → the footer's h3s, with nothing skipped. */}
      <section className="shell py-16" aria-labelledby="admin-login-heading">
        <h2 id="admin-login-heading" className="sr-only">
          Sign in with the admin password
        </h2>
        {/* useSearchParams needs a Suspense boundary for static rendering. */}
        <Suspense fallback={null}>
          <AdminLogin />
        </Suspense>
      </section>
    </>
  );
}
