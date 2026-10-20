import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import KeluargaTable from "@/components/tables/KeluargaTable";
import { Metadata } from "next";
import ComponentCardTable from "@/components/common/ComponentCardTable";

export const metadata: Metadata = {
  title: "Data Keluarga | Dashboard JKI Ora et Labora",
  description: "Manajemen data keluarga jemaat JKI Ora et Labora",
};

export default function KeluargaPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Data Keluarga" />

      <div className="space-y-6">
         <ComponentCardTable title="Data Keluarga" subject="keluarga">
            <KeluargaTable />
         </ComponentCardTable>
      </div>
    </div>
  );
}