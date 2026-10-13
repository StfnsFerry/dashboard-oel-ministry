"use client";

import { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface StatistikDistribusiSektorChartProps {
  kategori: string;
  sektor: string;
  tahun: string;
  bulan: string;
}

interface Jemaat {
  id: number;
  tanggal_bergabung: string | null;
  kategori_id: number | null;
  sektor_id: number | null;
}

interface Kategori {
  id: number;
  nama_kategori: string;
}

interface Sektor {
  id: number;
  nama_sektor: string;
}

export default function StatistikDistribusiSektorChart({
  kategori,
  sektor,
  tahun,
  bulan,
}: StatistikDistribusiSektorChartProps) {
  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDistribusiSektor() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const [
          { data: jemaatData, error: jemaatError },
          { data: kategoriData, error: kategoriError },
          { data: sektorData, error: sektorError },
        ] = await Promise.all([
          supabase
            .from("jemaat")
            .select(
              "id, tanggal_bergabung, kategori_id, sektor_id",
            ),
          supabase.from("kategori").select("id, nama_kategori"),
          supabase.from("sektor").select("id, nama_sektor"),
        ]);

        if (jemaatError) throw jemaatError;
        if (kategoriError) throw kategoriError;
        if (sektorError) throw sektorError;

        const jemaat = (jemaatData ?? []) as Jemaat[];
        const kategoriList = (kategoriData ?? []) as Kategori[];
        const sektorList = (sektorData ?? []) as Sektor[];

        const selectedCategoryId =
          kategori === "all"
            ? null
            : kategoriList.find(
                (item) => item.nama_kategori === kategori,
              )?.id;

        const selectedSectorId =
          sektor === "all"
            ? null
            : sektorList.find(
                (item) => item.nama_sektor === sektor,
              )?.id;

        if (
          (kategori !== "all" && selectedCategoryId === undefined) ||
          (sektor !== "all" && selectedSectorId === undefined)
        ) {
          throw new Error("Kategori atau sektor tidak ditemukan.");
        }

        const year = Number(tahun);
        const month = Number(bulan);

        if (
          !Number.isInteger(year) ||
          year < 1900 ||
          !Number.isInteger(month) ||
          month < 1 ||
          month > 12
        ) {
          throw new Error("Tahun atau bulan yang dipilih tidak valid.");
        }

        const lastDay = new Date(year, month, 0).getDate();
        const periodEnd = `${tahun}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        const filteredJemaat = jemaat.filter((item) => {
          if (
            !item.tanggal_bergabung ||
            item.tanggal_bergabung > periodEnd
          ) {
            return false;
          }

          if (
            selectedCategoryId !== null &&
            item.kategori_id !== selectedCategoryId
          ) {
            return false;
          }

          if (
            selectedSectorId !== null &&
            item.sektor_id !== selectedSectorId
          ) {
            return false;
          }

          return true;
        });

        const sortedSectors = sektorList
          .filter(
            (item) =>
              selectedSectorId === null ||
              item.id === selectedSectorId,
          )
          .map((item) => ({
            name: item.nama_sektor,
            total: filteredJemaat.filter(
              (member) => member.sektor_id === item.id,
            ).length,
          }))
          .sort((a, b) => b.total - a.total);

        if (!cancelled) {
          setLabels(sortedSectors.map((item) => item.name));
          setValues(sortedSectors.map((item) => item.total));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data distribusi sektor.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchDistribusiSektor();

    return () => {
      cancelled = true;
    };
  }, [kategori, sektor, tahun, bulan]);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
      },
    },
    colors: ["#465FFF"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        barHeight: "60%",
        distributed: false,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: 8,
      style: {
        fontSize: "12px",
        colors: ["#6B7280"],
      },
      formatter: (value: number) =>
        value.toLocaleString("id-ID"),
    },
    xaxis: {
      categories: labels,
      min: 0,
      forceNiceScale: true,
      labels: {
        formatter: (value) =>
          Math.round(Number(value)).toLocaleString("id-ID"),
        style: {
          colors: "#6B7280",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
    },
    legend: {
      show: false,
    },
    tooltip: {
      y: {
        formatter: (value) =>
          `${value.toLocaleString("id-ID")} jemaat`,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Distribusi Jemaat per Sektor
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Perbandingan jumlah jemaat berdasarkan sektor hingga akhir{" "}
          {new Date(Number(tahun), Number(bulan) - 1).toLocaleDateString(
            "id-ID",
            { month: "long", year: "numeric" },
          )}.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-gray-500">
          Memuat data distribusi sektor...
        </div>
      ) : error ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : labels.length === 0 ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-gray-500">
          Belum ada data sektor.
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[320px]">
            <Chart
              options={options}
              series={[{ name: "Jumlah Jemaat", data: values }]}
              type="bar"
              height={Math.max(350, labels.length * 48)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
