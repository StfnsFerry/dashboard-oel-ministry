import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import JemaatForm from "@/components/form/JemaatForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Tambah Jemaat | Dashboard JKI Ora et Labora",
};

export default function TambahJemaatPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Tambah Jemaat" />
      <JemaatForm />      
    </div>
  );
}
