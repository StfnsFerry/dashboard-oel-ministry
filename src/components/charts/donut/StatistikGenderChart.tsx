"use client";

import { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface StatistikGenderChartProps {
  kategori: string;
  sektor: string;
  tahun: string;
  bulan: string;
}

interface JemaatGender {
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

export default function StatistikGenderChart({
  kategori,
  sektor,
  tahun,
  bulan,
}: StatistikGenderChartProps) {
  const [lakiLaki, setLakiLaki] = useState(0);
  const [perempuan, setPerempuan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchGenderData() {
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

        const jemaat = (jemaatData ?? []) as JemaatGender[];
        const kategoriList = (kategoriData ?? []) as Kategori[];
        const sektorList = (sektorData ?? []) as Sektor[];

        const kategoriTerpilih =
          kategori === "all"
            ? null
            : kategoriList.find(
                (item) => item.nama_kategori === kategori,
              )?.id;

        const sektorTerpilih =
          sektor === "all"
            ? null
            : sektorList.find(
                (item) => item.nama_sektor === sektor,
              )?.id;

        if (
          (kategori !== "all" && kategoriTerpilih === undefined) ||
          (sektor !== "all" && sektorTerpilih === undefined)
        ) {
          throw new Error("Kategori atau sektor tidak ditemukan.");
        }

        const tahunAngka = Number(tahun);
        const bulanAngka = Number(bulan);

        const tanggalMulai = `${tahun}-${bulan.padStart(2, "0")}-01`;
        const tanggalAkhir = new Date(
          tahunAngka,
          bulanAngka,
          0,
        ).toISOString().slice(0, 10);

        const filteredJemaat = jemaat.filter((item) => {
          if (
            !item.tanggal_bergabung ||
            item.tanggal_bergabung > tanggalAkhir
          ) {
            return false;
          }

          if (
            kategoriTerpilih !== null &&
            item.kategori_id !== kategoriTerpilih
          ) {
            return false;
          }

          if (
            sektorTerpilih !== null &&
            item.sektor_id !== sektorTerpilih
          ) {
            return false;
          }

          // Mengikuti periode yang dipilih pada filter global.
          // Anggota yang bergabung sebelum periode tetap dihitung.
          return item.tanggal_bergabung <= tanggalAkhir;
        });

        // tanggalMulai tidak digunakan sebagai batas bawah karena grafik
        // menunjukkan komposisi seluruh jemaat sampai akhir periode.
        void tanggalMulai;

        if (!cancelled) {
          setLakiLaki(
            filteredJemaat.filter(
              (item) => item.jenis_kelamin === "L",
            ).length,
          );

          setPerempuan(
            filteredJemaat.filter(
              (item) => item.jenis_kelamin === "P",
            ).length,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data jenis kelamin.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchGenderData();

    return () => {
      cancelled = true;
    };
  }, [kategori, sektor, tahun, bulan]);

  const total = lakiLaki + perempuan;

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 365,
    },
    colors: ["#465FFF", "#9CB9FF"],
    labels: ["Laki-laki", "Perempuan"],
    legend: {
      show: true,
      position: "bottom",
      fontFamily: "Outfit, sans-serif",
      markers: {
        strokeWidth: 0,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: {
              show: true,
            },
            value: {
              show: true,
              formatter: (value) =>
                Number(value).toLocaleString("id-ID"),
            },
            total: {
              show: true,
              label: "Total Jemaat",
              formatter: () => total.toLocaleString("id-ID"),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: total > 0,
      style: {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
      },
      dropShadow: {
        enabled: false,
      },
      formatter: (value: number) => `${value.toFixed(1)}%`,
    },
    tooltip: {
      enabled: false,
    },
    stroke: {
      show: false,
    },
    noData: {
      text: "Tidak ada data",
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Pengelompokan Jenis Kelamin Jemaat
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Komposisi jemaat laki-laki dan perempuan berdasarkan filter yang
          dipilih.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[365px] items-center justify-center text-sm text-gray-500">
          Memuat data grafik...
        </div>
      ) : error ? (
        <div className="flex h-[365px] items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : total === 0 ? (
        <div className="flex h-[365px] items-center justify-center text-sm text-gray-500">
          Tidak ada data jemaat pada periode ini.
        </div>
      ) : (
        <div className="flex max-w-full justify-center overflow-x-auto">
          <div className="w-full max-w-[350px]">
            <Chart
              options={options}
              series={[lakiLaki, perempuan]}
              type="donut"
              height={365}
            />
          </div>
        </div>
      )}
    </div>
  );
}