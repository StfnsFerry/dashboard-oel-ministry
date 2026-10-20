
import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import KeluargaForm from "@/components/form/KeluargaForm";

export const metadata: Metadata = {
  title: "Tambah Keluarga | Dashboard JKI Ora et Labora",
  description: "Tambah data keluarga jemaat",
};

export default function TambahKeluargaPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Tambah Keluarga" />

      <div className="space-y-6">
        <KeluargaForm />
      </div>
    </div>
  );
}
