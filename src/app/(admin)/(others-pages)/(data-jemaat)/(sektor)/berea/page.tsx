import ComponentCardTable from "@/components/common/ComponentCardTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import JemaatTable from "@/components/tables/JemaatTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Berea | Dashboard JKI Ora et Labora",
};

export default function Berea() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Berea" />
      <div className="space-y-6">
        <ComponentCardTable title="Data Seluruh Jemaat Berea">
          <JemaatTable kategori="Berea" />
        </ComponentCardTable>
      </div>
    </div>
  );
}
