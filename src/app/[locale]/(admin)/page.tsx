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

export const metadata: Metadata = {
  title:
    "Dashboard JKI Ora et Labora",
  // description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Ecommerce() {
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
    </div>
  );
}
