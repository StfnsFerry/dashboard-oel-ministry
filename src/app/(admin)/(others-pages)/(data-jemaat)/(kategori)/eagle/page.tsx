import ComponentCardTable from "@/components/common/ComponentCardTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import JemaatTable from "@/components/tables/JemaatTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Maranatha Eagle | Dashboard JKI Ora et Labora",
};

export default function KaumPria() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Maranatha Eagle" />
      <div className="space-y-6">
        <ComponentCardTable title="Data Seluruh Jemaat Maranatha Eagle">
          <JemaatTable kategori="Maranatha Eagle" />
        </ComponentCardTable>
      </div>
    </div>
  );
}
