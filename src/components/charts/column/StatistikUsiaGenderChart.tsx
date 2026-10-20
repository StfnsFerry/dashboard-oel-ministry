
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

const RENTANG_USIA = [
  { label: "0–12", min: 0, max: 12 },
  { label: "13–17", min: 13, max: 17 },
  { label: "18–25", min: 18, max: 25 },
  { label: "26–35", min: 26, max: 35 },
  { label: "36–45", min: 36, max: 45 },
  { label: "46–59", min: 46, max: 59 },
  { label: "60+", min: 60, max: Infinity },
];

function parseTanggal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function hitungUsia(tanggalLahir: Date, tanggalAcuan: Date): number {
  let usia = tanggalAcuan.getFullYear() - tanggalLahir.getFullYear();

  const belumUlangTahun =
    tanggalAcuan.getMonth() < tanggalLahir.getMonth() ||
    (tanggalAcuan.getMonth() === tanggalLahir.getMonth() &&
      tanggalAcuan.getDate() < tanggalLahir.getDate());

  if (belumUlangTahun) usia--;

  return usia;
}

export default function StatistikUsiaGenderChart({
  kategori,
  sektor,
  tahun,
  bulan,
}: Props) {
  const [lakiLaki, setLakiLaki] = useState<number[]>(
    RENTANG_USIA.map(() => 0),
  );
  const [perempuan, setPerempuan] = useState<number[]>(
    RENTANG_USIA.map(() => 0),
  );
  const [totalDihitung, setTotalDihitung] = useState(0);
  const [tanpaTanggalLahir, setTanpaTanggalLahir] = useState(0);
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

        const tahunAngka = Number(tahun);
        const bulanAngka = Number(bulan);

        const tanggalAcuan = new Date(
          tahunAngka,
          bulanAngka,
          0,
        );

        const akhirPeriode = new Date(
          tahunAngka,
          bulanAngka,
          0,
          23,
          59,
          59,
          999,
        );

        const dataTerfilter = jemaat.filter((item) => {

          if (item.status_jemaat !== "Aktif") return false;
          
          if (!item.tanggal_bergabung) return false;

          const tanggalBergabung = parseTanggal(item.tanggal_bergabung);

          if (
            !tanggalBergabung ||
            tanggalBergabung > akhirPeriode
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

        const dataValid = dataTerfilter.filter((item) => {
          if (!item.tanggal_lahir) return false;

          const tanggalLahir = parseTanggal(item.tanggal_lahir);

          if (!tanggalLahir || tanggalLahir > tanggalAcuan) {
            return false;
          }

          return item.jenis_kelamin === "L" ||
            item.jenis_kelamin === "P";
        });

        const hasilLakiLaki = RENTANG_USIA.map(() => 0);
        const hasilPerempuan = RENTANG_USIA.map(() => 0);

        for (const item of dataValid) {
          if (!item.tanggal_lahir) continue;

          const tanggalLahir = parseTanggal(item.tanggal_lahir);
          if (!tanggalLahir) continue;

          const usia = hitungUsia(tanggalLahir, tanggalAcuan);

          const index = RENTANG_USIA.findIndex(
            (rentang) => usia >= rentang.min && usia <= rentang.max,
          );

          if (index === -1) continue;

          if (item.jenis_kelamin === "L") {
            hasilLakiLaki[index]++;
          } else if (item.jenis_kelamin === "P") {
            hasilPerempuan[index]++;
          }
        }

        const jumlahTanpaTanggalLahir = dataTerfilter.filter((item) => {
          if (!item.tanggal_lahir) return true;

          const tanggalLahir = parseTanggal(item.tanggal_lahir);

          return !tanggalLahir || tanggalLahir > tanggalAcuan;
        }).length;

        if (isMounted) {
          setLakiLaki(hasilLakiLaki);
          setPerempuan(hasilPerempuan);
          setTotalDihitung(dataValid.length);
          setTanpaTanggalLahir(jumlahTanpaTanggalLahir);
        }
      } catch (err) {
        console.error("Gagal mengambil statistik usia jemaat:", err);

        if (isMounted) {
          setError("Gagal memuat statistik usia dan gender.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStatistik();

    return () => {
      isMounted = false;
    };
  }, [kategori, sektor, tahun, bulan]);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
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
      categories: RENTANG_USIA.map((item) => item.label),
      title: { text: "Rentang Usia (tahun)" },
      labels: {
        style: { fontSize: "12px"},
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
      markers: {
        strokeWidth: 0, shape: "circle", size: 6
      },
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
        },
      },
    ],
  };

  const series = [
    { name: "Laki-laki", data: lakiLaki },
    { name: "Perempuan", data: perempuan },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Distribusi Jemaat Berdasarkan Usia dan Gender
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Perbandingan jumlah jemaat laki-laki dan perempuan per rentang usia.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-gray-500">
          Memuat statistik...
        </div>
      ) : error ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : totalDihitung === 0 ? (
        <div className="flex h-[350px] items-center justify-center text-sm text-gray-500">
          Tidak ada data usia dan gender yang valid untuk filter ini.
        </div>
      ) : (
        <>
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={350}
          />        
        </>
      )}
    </div>
  );
}
