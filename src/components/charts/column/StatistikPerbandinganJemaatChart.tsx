"use client";

import { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { getStatistikData } from "@/lib/cache/StatistikCache"

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type ChartMode = "sektor" | "kategori";

interface Props {
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

export default function StatistikPerbandinganJemaatChart({
  kategori,
  sektor,
  tahun,
  bulan,
}: Props) {
  const [mode, setMode] = useState<ChartMode>("sektor");
  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        
        const {
          jemaat: jemaatData,
          kategoris: kategoriData,
          sektors: sektorData,
        } = await getStatistikData();

        const jemaat = jemaatData;
        const kategoriList = kategoriData;
        const sektorList = sektorData;


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
          throw new Error("Tahun atau bulan tidak valid.");
        }

        const lastDay = new Date(year, month, 0).getDate();
        const periodEnd =
          `${tahun}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

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

        const distribution =
          mode === "sektor"
            ? sektorList
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
            : kategoriList
                .filter(
                  (item) =>
                    selectedCategoryId === null ||
                    item.id === selectedCategoryId,
                )
                .map((item) => ({
                  name: item.nama_kategori,
                  total: filteredJemaat.filter(
                    (member) => member.kategori_id === item.id,
                  ).length,
                }));

        distribution.sort((a, b) => b.total - a.total);

        if (!cancelled) {
          setLabels(distribution.map((item) => item.name));
          setValues(distribution.map((item) => item.total));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data perbandingan jemaat.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [kategori, sektor, tahun, bulan, mode]);

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
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -18,
      style: {
        fontSize: "11px",
      },
      formatter: (value: number) =>
        value.toLocaleString("id-ID"),
    },
    xaxis: {
      categories: labels,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        rotate: -30,
        rotateAlways: false,
        trim: true,
        style: {
          fontSize: "12px",
          colors: "#6B7280",
        },
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      title: {
        text: "Jumlah Jemaat",
      },
      labels: {
        formatter: (value) =>
          Math.round(value).toLocaleString("id-ID"),
        style: {
          colors: ["#6B7280"],
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
    noData: {
      text: "Tidak ada data",
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Perbandingan Jumlah Jemaat
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Jumlah jemaat berdasarkan{" "}
            {mode === "sektor" ? "sektor" : "kategori"} hingga akhir{" "}
            {new Date(
              Number(tahun),
              Number(bulan) - 1,
            ).toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        </div>

        <div className="inline-flex w-fit rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setMode("sektor")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === "sektor"
                ? "bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Per Sektor
          </button>

          <button
            type="button"
            onClick={() => setMode("kategori")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === "kategori"
                ? "bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Per Kategori
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-gray-500">
          Memuat data perbandingan jemaat...
        </div>
      ) : error ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : labels.length === 0 ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-gray-500">
          Belum ada data untuk ditampilkan.
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[500px]">
            <Chart
              options={options}
              series={[
                {
                  name: "Jumlah Jemaat",
                  data: values,
                },
              ]}
              type="bar"
              height={350}
            />
          </div>
        </div>
      )}
    </div>
  );
}