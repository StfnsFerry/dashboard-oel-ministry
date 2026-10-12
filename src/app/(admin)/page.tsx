// import DemographicCard from "@/components/ecommerce/DemographicCard";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
// import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
// import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
// import RecentOrders from "@/components/ecommerce/RecentOrders";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import JemaatTable from "@/components/ecommerce/JemaatTable"
import GenderPieChart from "@/components/ecommerce/GenderPieChart";
import PerkembanganJemaatChart from "@/components/ecommerce/PerkembanganJemaatChart";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title:
    "Dashboard JKI Ora et Labora",
  // description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default async function Ecommerce() {
  const supabase = await createClient();

  const { data: sektor, error } = await supabase
    .from("sektor")
    .select("*");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("Data Sektor:", sektor);
    console.log("Supabase Error:", error);
console.log("Current User:", user);
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-12">
        <EcommerceMetrics />

        {/* <MonthlySalesChart /> */}
      </div>

      {/* <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div> */}
      <div className="col-span-7">
        <PerkembanganJemaatChart />
      </div>
      
      <div className="col-span-5">
        <GenderPieChart />
      </div>

      <div className="col-span-12">
        <JemaatTable />
      </div>


      {/* <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div> */}

      {/* <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div> */}

      <div className="col-span-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-2 text-lg font-semibold">
            Test Supabase
          </h2>

          {error ? (
            <div className="text-red-500">
              <p className="font-semibold">Connection Error</p>
              <p>{error.message}</p>
            </div>
          ) : (
            <div className="text-green-600">
              <p className="font-semibold">
                Supabase berhasil terhubung!
              </p>

              <p className="mt-2">
                Total data sektor: {sektor?.length ?? 0}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
