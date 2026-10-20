import type { Metadata } from "next";
import DashboardOverview from "@/components/card/DashboardOverview";

export const metadata: Metadata = {
  title:
    "Dashboard JKI Ora et Labora",
};

export default async function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-12">
          <DashboardOverview/>
      </div>
    </div>
  );
}
