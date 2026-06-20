import { Suspense } from "react";
import PricingContent from "./pricing-content";

export default function PricingPage() {
  return (
    <Suspense fallback={<main className="admin-page">Đang tải...</main>}>
      <PricingContent />
    </Suspense>
  );
}
