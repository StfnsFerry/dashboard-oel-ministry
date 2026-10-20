import ComponentCardTable from "@/components/common/ComponentCardTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import JemaatTable from "@/components/tables/JemaatTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Betlehem | Dashboard JKI Ora et Labora",
};

export default function KaumPria() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Betlehem" />
      <div className="space-y-6">
        <ComponentCardTable title="Data Seluruh Jemaat Betlehem">
          <JemaatTable kategori="Betlehem" />
        </ComponentCardTable>
      </div>
    </div>
  );
}
