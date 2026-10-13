import ComponentCardTable from "@/components/common/ComponentCardTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import JemaatTable from "@/components/tables/JemaatTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "OEL Ministry | Dashboard JKI Ora et Labora",
};

export default function OelMinistry() {
  return (
    <div>
      <PageBreadcrumb pageTitle="OEL Ministry" />
      <div className="space-y-6">
        <ComponentCardTable title="Data Seluruh Jemaat">
          <JemaatTable />
        </ComponentCardTable>
      </div>
    </div>
  );
}
