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
      <div className="shell py-16">
        {/* useSearchParams needs a Suspense boundary for static rendering. */}
        <Suspense fallback={null}>
          <AdminLogin />
        </Suspense>
      </div>
    </>
  );
}
