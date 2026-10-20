
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import { PlusIcon } from "@/icons";

type JemaatDetail = {
  id: number;
  nama_lengkap: string;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  golongan_darah: string | null;
  jenis_kelamin: "L" | "P" | null;
  tanggal_bergabung: string | null;
  nomor_hp: string | null;
  nomor_surat_penyerahan_anak: string | null;
  nomor_surat_baptisan_air: string | null;
  nomor_surat_pernikahan: string | null;
  sektor: { nama_sektor: string } | null;
  kategori: { nama_kategori: string } | null;
  status_jemaat: string;
  tanggal_kematian: string | null;
};

function formatTanggal(value: string | null) {
  if (!value) return "-";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className=" py-4 dark:border-gray-800">
      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800 dark:text-white">
        {value?.trim() || "-"}
      </p>
    </div>
  );
}

export default function DetailJemaatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [jemaat, setJemaat] = useState<JemaatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchJemaat() {
      setLoading(true);
      setError("");

      const id = Number(params.id);

      if (!Number.isInteger(id) || id <= 0) {
        if (active) {
          setError("ID jemaat tidak valid.");
          setLoading(false);
        }
        return;
      }

      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("jemaat")
        .select(`
          id,
          nama_lengkap,
          tempat_lahir,
          tanggal_lahir,
          alamat,
          golongan_darah,
          jenis_kelamin,
          tanggal_bergabung,
          nomor_hp,
          nomor_surat_penyerahan_anak,
          nomor_surat_baptisan_air,
          nomor_surat_pernikahan,
          status_jemaat,
          tanggal_kematian,
          sektor ( nama_sektor ),
          kategori ( nama_kategori )
        `)
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (fetchError) {
        setError("Gagal mengambil data jemaat.");
      } else if (!data) {
        setError("Data jemaat tidak ditemukan.");
      } else {
        const sektorData = Array.isArray(data.sektor)
          ? data.sektor[0]
          : data.sektor;

        const kategoriData = Array.isArray(data.kategori)
          ? data.kategori[0]
          : data.kategori;

        setJemaat({
          ...data,
          sektor: sektorData ?? null,
          kategori: kategoriData ?? null,
        } as JemaatDetail);
      }

      setLoading(false);
    }

    void fetchJemaat();

    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Memuat detail jemaat...
      </div>
    );
  }

  if (error || !jemaat) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-red-500">
          {error || "Data jemaat tidak ditemukan."}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 text-sm font-medium text-blue-600 hover:underline"
        >
          Kembali ke daftar jemaat
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Detail Jemaat
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Informasi lengkap data jemaat.
          </p>
        </div>

        <div className="flex gap-3">
            <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Kembali
            </Button>

            <Button
                onClick={() => router.push(`/jemaat/${jemaat.id}/edit`)}
              >
                Edit Jemaat
            </Button>
          
        </div>
      </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="space-y-6">
                <ComponentCard title="Biodata Jemaat">
                    <div className=" grid grid-cols-1 gap-x-8 md:grid-cols-2">
                        <DetailItem label="Nama Lengkap" value={jemaat.nama_lengkap} />
                        <DetailItem
                            label="Jenis Kelamin"
                            value={
                            jemaat.jenis_kelamin === "L"
                                ? "Laki-laki"
                                : jemaat.jenis_kelamin === "P"
                                ? "Perempuan"
                                : "-"
                            }
                        />
                        <DetailItem label="Tempat Lahir" value={jemaat.tempat_lahir} />
                        <DetailItem
                            label="Tanggal Lahir"
                            value={formatTanggal(jemaat.tanggal_lahir)}
                        />
                        <DetailItem
                            label="Umur"
                            value={jemaat.tanggal_lahir ? `${Math.floor((new Date().getTime() - new Date(jemaat.tanggal_lahir).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} tahun` : "-"}
                        />
                        <DetailItem label="Alamat" value={jemaat.alamat} />
                        <DetailItem label="Golongan Darah" value={jemaat.golongan_darah} />
                        <DetailItem
                            label="Tanggal Bergabung"
                            value={formatTanggal(jemaat.tanggal_bergabung)}
                        />
                        <DetailItem
                            label="Sektor"
                            value={jemaat.sektor?.nama_sektor}
                        />
                        <DetailItem
                            label="Kategori"
                            value={jemaat.kategori?.nama_kategori}
                        />
                         <DetailItem
                            label="Nomor HP"
                            value={jemaat.nomor_hp}
                        />      
                        {jemaat.status_jemaat === "Meninggal" && (
                          <DetailItem
                            label="Tanggal Kematian"
                            value={formatTanggal(jemaat.tanggal_kematian)}
                        />
                        )}
                        <div className=" py-4 dark:border-gray-800">
                          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                            Status Jemaat
                          </p>
                          <Badge variant="light" startIcon={<PlusIcon />} color={jemaat.status_jemaat === "Aktif" ? "success" : jemaat.status_jemaat === "Tidak Aktif" ? "dark" : jemaat.status_jemaat === "Pindah" ? "light" : jemaat.status_jemaat === "Meninggal" ? "error" : "warning"} size="sm">
                            {jemaat.status_jemaat}
                          </Badge>
                        </div> 

                    </div>
                </ComponentCard>
            </div>
            <div className="space-y-6">
                <ComponentCard title="Dokumen Jemaat">
                    <div className=" grid grid-cols-1 gap-x-8 md:grid-cols-2">
                        <DetailItem
                            label="No. Surat Penyerahan Anak"
                            value={jemaat.nomor_surat_penyerahan_anak}
                        />
                        <DetailItem
                            label="No. Surat Baptisan Air"
                            value={jemaat.nomor_surat_baptisan_air}
                        />
                        <DetailItem
                            label="No. Surat Pernikahan"
                            value={jemaat.nomor_surat_pernikahan}
                        />
                    </div>
                </ComponentCard>
            </div>
        </div>
    </div>
  );
}
