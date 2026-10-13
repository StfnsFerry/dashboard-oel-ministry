
"use client";

import { useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import JemaatForm from "@/components/form/JemaatForm";

export default function EditJemaatPage() {
  const params = useParams<{ id: string }>();
  const jemaatId = params.id;

  return (
    <div>
      <PageBreadcrumb pageTitle="Edit Jemaat" />
      <JemaatForm jemaatId={jemaatId} />
    </div>
  );
}
