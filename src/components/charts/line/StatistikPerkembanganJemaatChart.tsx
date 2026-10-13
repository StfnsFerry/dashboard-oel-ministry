"use client";

import { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface StatistikPerkembanganJemaatChartProps {
  kategori: string;
  sektor: string;
  tahun: string;
  bulan: string;
}

interface Jemaat {
  id: number;
  jenis_kelamin: string | null;
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

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function StatistikPerkembanganJemaatChart({
  kategori,
  sektor,
  tahun,
  bulan,
}: StatistikPerkembanganJemaatChartProps) {
  const [series, setSeries] = useState<
    { name: string; data: number[] }[]
  >([
    { name: "Laki-laki", data: [] },
    { name: "Perempuan", data: [] },
    { name: "Total Jemaat", data: [] },
  ]);

  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPerkembanganJemaat() {
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
              "id, jenis_kelamin, tanggal_bergabung, kategori_id, sektor_id",
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
        const selectedMonth = Number(bulan);

        if (
          !Number.isInteger(year) ||
          year < 1900 ||
          !Number.isInteger(selectedMonth) ||
          selectedMonth < 1 ||
          selectedMonth > 12
        ) {
          throw new Error("Tahun atau bulan yang dipilih tidak valid.");
        }

        const filteredJemaat = jemaat.filter((item) => {
          if (!item.tanggal_bergabung) return false;

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

        const labels = monthNames.slice(0, selectedMonth);
        const maleData: number[] = [];
        const femaleData: number[] = [];
        const totalData: number[] = [];

        for (let monthIndex = 0; monthIndex < selectedMonth; monthIndex++) {
          const monthNumber = String(monthIndex + 1).padStart(2, "0");
          const monthPrefix = `${tahun}-${monthNumber}`;

          const lastDay = new Date(
            year,
            monthIndex + 1,
            0,
          ).getDate();

          const periodEnd = `${monthPrefix}-${String(lastDay).padStart(2, "0")}`;

          const joinedByPeriodEnd = filteredJemaat.filter(
            (item) => item.tanggal_bergabung! <= periodEnd,
          );

          const newMembersThisMonth = filteredJemaat.filter(
            (item) => item.tanggal_bergabung!.startsWith(monthPrefix),
          );

          maleData.push(
            newMembersThisMonth.filter(
              (item) => item.jenis_kelamin === "L",
            ).length,
          );

          femaleData.push(
            newMembersThisMonth.filter(
              (item) => item.jenis_kelamin === "P",
            ).length,
          );

          totalData.push(joinedByPeriodEnd.length);
        }

        if (!cancelled) {
          setCategories(labels);
          setSeries([
            { name: "Jemaat Baru Laki-laki", data: maleData },
            { name: "Jemaat Baru Perempuan", data: femaleData },
            { name: "Total Jemaat", data: totalData },
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data perkembangan jemaat.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchPerkembanganJemaat();

    return () => {
      cancelled = true;
    };
  }, [kategori, sektor, tahun, bulan]);

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    colors: ["#465FFF", "#dd46ff", "#9CB9FF"],
    stroke: {
      curve: "straight",
      width: [2, 2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.25,
        opacityTo: 0,
      },
    },
    markers: {
      size: 3,
      hover: {
        size: 6,
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit, sans-serif",
    },
    xaxis: {
      type: "category",
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
        formatter: (value) => Math.round(value).toLocaleString("id-ID"),
      },
    },
    tooltip: {
      shared: true,
      y: {
        formatter: (value) => `${value.toLocaleString("id-ID")} jemaat`,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Perkembangan Jumlah Jemaat
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Perkembangan jemaat baru dan total jemaat kumulatif pada tahun{" "}
          {tahun}.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[310px] items-center justify-center text-sm text-gray-500">
          Memuat data perkembangan jemaat...
        </div>
      ) : error ? (
        <div className="flex h-[310px] items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : (
        <div className="custom-scrollbar max-w-full overflow-x-auto">
          <div className="min-w-[500px] xl:min-w-full">
            <Chart
              options={options}
              series={series}
              type="area"
              height={365}
            />
          </div>
        </div>
      )}
    </div>
  );
}
