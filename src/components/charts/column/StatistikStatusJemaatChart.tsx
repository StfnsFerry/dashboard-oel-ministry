
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { getStatistikData } from "@/lib/cache/StatistikCache"

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface Props {
  kategori: string;
  sektor: string;
  tahun: string;
  bulan: string;
}

interface KategoriData {
  id: number;
  nama_kategori: string;
}

interface SektorData {
  id: number;
  nama_sektor: string;
}

type ModeChart = "sektor" | "kategori";

export default function StatistikStatusJemaatChart({
  kategori,
  sektor,
  tahun,
  bulan,
}: Props) {
  const [mode, setMode] = useState<ModeChart>("sektor");
  const [labels, setLabels] = useState<string[]>([]);
  const [jumlahAktif, setJumlahAktif] = useState<number[]>([]);
  const [jumlahTidakAktif, setJumlahTidakAktif] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStatistik() {
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


        const kategoriTerpilih = kategoriList.find(
          (item) => item.nama_kategori === kategori,
        );

        const sektorTerpilih = sektorList.find(
          (item) => item.nama_sektor === sektor,
        );

        const akhirPeriode = new Date(
          Number(tahun),
          Number(bulan),
          0,
          23,
          59,
          59,
          999,
        );

        const dataTerfilter = jemaat.filter((item) => {
          if (!item.tanggal_bergabung) return false;

          const tanggal = new Date(item.tanggal_bergabung);

          if (
            Number.isNaN(tanggal.getTime()) ||
            tanggal > akhirPeriode
          ) {
            return false;
          }

          if (
            kategori !== "all" &&
            (!kategoriTerpilih || item.kategori_id !== kategoriTerpilih.id)
          ) {
            return false;
          }

          if (
            sektor !== "all" &&
            (!sektorTerpilih || item.sektor_id !== sektorTerpilih.id)
          ) {
            return false;
          }

          return true;
        });

        const daftarGrup =
          mode === "sektor"
            ? sektorList.filter(
                (item) =>
                  sektor === "all" || item.nama_sektor === sektor,
              )
            : kategoriList.filter(
                (item) =>
                  kategori === "all" || item.nama_kategori === kategori,
              );

        const hasil = daftarGrup.map((grup) => {
          const anggotaGrup = dataTerfilter.filter((item) =>
            mode === "sektor"
              ? item.sektor_id === grup.id
              : item.kategori_id === grup.id,
          );

          return {
            nama: mode === "sektor"
              ? (grup as SektorData).nama_sektor
              : (grup as KategoriData).nama_kategori,
            aktif: anggotaGrup.filter(
              (item) => item.status_jemaat === "Aktif",
            ).length,
            tidakAktif: anggotaGrup.filter(
              (item) => item.status_jemaat === "Tidak Aktif",
            ).length,
          };
        }).sort(
          (a, b) =>
            b.aktif + b.tidakAktif - (a.aktif + a.tidakAktif),
        );

        if (isMounted) {
          setLabels(hasil.map((item) => item.nama));
          setJumlahAktif(hasil.map((item) => item.aktif));
          setJumlahTidakAktif(hasil.map((item) => item.tidakAktif));
        }
      } catch (err) {
        console.error("Gagal mengambil statistik status jemaat:", err);

        if (isMounted) {
          setError("Gagal memuat statistik status jemaat.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStatistik();

    return () => {
      isMounted = false;
    };
  }, [kategori, sektor, tahun, bulan, mode]);



  const options: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      stackType: "normal",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 3,
        borderRadiusApplication: "end",
      },
    },
    colors: ["#465FFF", "#dd46ff"],
    dataLabels: {
      enabled: true,
      formatter: (value: number) =>
        value > 0 ? value.toLocaleString("id-ID") : "",
      style: {
        fontSize: "11px",
        fontWeight: 500,
      },
    },
    xaxis: {
      categories: labels,
      labels: {
        rotate: -35,
        trim: true,
        style: { fontSize: "12px" },
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      title: { text: "Jumlah Jemaat" },
      labels: {
        formatter: (value: number) =>
          Math.round(value).toLocaleString("id-ID"),
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      markers: { size: 6, strokeWidth: 0, shape: "circle" },
    },
    grid: {
      borderColor: "#E4E7EC",
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value} jemaat`,
      },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          plotOptions: {
            bar: { columnWidth: "70%" },
          },
          xaxis: {
            labels: { rotate: -45 },
          },
        },
      },
    ],
  };

  const series = [
    { name: "Aktif", data: jumlahAktif },
    { name: "Tidak Aktif", data: jumlahTidakAktif },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Analisis Status Jemaat
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Perbandingan jemaat aktif dan tidak aktif berdasarkan{" "}
            {mode === "sektor" ? "sektor" : "kategori"}.
          </p>
        </div>

        <div className="inline-flex w-fit rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setMode("sektor")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
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
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
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
          Memuat statistik...
        </div>
      ) : error ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : labels.length === 0 ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-gray-500">
          Tidak ada data untuk filter yang dipilih.
        </div>
      ) : (
        <>
          <div className="mt-5">
            <ReactApexChart
              options={options}
              series={series}
              type="bar"
              height={350}
            />
          </div>
        </>
      )}
    </div>
  );
}
