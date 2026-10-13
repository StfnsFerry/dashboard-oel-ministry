
"use client";

import { useState } from "react";
import Select from "@/components/form/Select";
import StatistikCards from "@/components/card/StatistikCards";
import StatistikGenderChart from "@/components/charts/donut/StatistikGenderChart";
import StatistikPerkembanganJemaatChart from "@/components/charts/line/StatistikPerkembanganJemaatChart";
import StatistikPerbandinganJemaatChart from "@/components/charts/column/StatistikPerbandinganJemaatChart";
import StatistikStatusJemaatChart from "@/components/charts/column/StatistikStatusJemaatChart";
import StatistikUsiaGenderChart from "@/components/charts/column/StatistikUsiaGenderChart";

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = String(currentDate.getMonth() + 1);

const kategoriOptions = [
  { value: "all", label: "OEL Ministry" },
  { value: "Kaum Pria", label: "Kaum Pria" },
  { value: "Kaum Ibu", label: "Kaum Ibu" },
  { value: "Maranatha Eagle", label: "Maranatha Eagle" },
  { value: "Maranatha Majesty", label: "Maranatha Majesty" },
  { value: "Sekolah Minggu", label: "Sekolah Minggu" },
];

const sektorOptions = [
  { value: "all", label: "Semua Sektor" },
  { value: "Baitani", label: "Baitani" },
  { value: "Berea", label: "Berea" },
  { value: "Betlehem", label: "Betlehem" },
  { value: "Elim", label: "Elim" },
  { value: "Filadelfia", label: "Filadelfia" },
  { value: "Kalvari", label: "Kalvari" },
  { value: "Mahanaim", label: "Mahanaim" },
  { value: "Moria", label: "Moria" },
  { value: "Sion", label: "Sion" },
];

const tahunOptions = Array.from(
  { length: Math.max(currentYear - 2019, 1) + 1 },
  (_, index) => {
    const year = currentYear - index;

    return {
      value: String(year),
      label: String(year),
    };
  },
);

const bulanOptions = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export default function StatistikAnalitikDataPage() {
  const [kategori, setKategori] = useState("all");
  const [sektor, setSektor] = useState("all");
  const [tahun, setTahun] = useState(String(currentYear));
  const [bulan, setBulan] = useState(currentMonth);

  function resetFilter() {
    setKategori("all");
    setSektor("all");
    setTahun(String(currentYear));
    setBulan(currentMonth);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Statistik & Analitik Data
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pantau perkembangan dan statistik jemaat JKI Ora et Labora.
        </p>
      </div>

      {/* Master Filter */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Filter Data
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atur filter untuk menentukan periode dan kelompok jemaat yang
            ingin dianalisis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Kategori */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kategori
            </label>

            <Select
              options={kategoriOptions}
              value={kategori}
              onChange={setKategori}
              className="dark:bg-gray-900"
            />
          </div>

          {/* Sektor */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sektor
            </label>

            <Select
              options={sektorOptions}
              value={sektor}
              onChange={setSektor}
              className="dark:bg-gray-900"
            />
          </div>

          {/* Tahun */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tahun
            </label>

            <Select
              options={tahunOptions}
              value={tahun}
              onChange={setTahun}
              className="dark:bg-gray-900"
            />
          </div>

          {/* Bulan */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bulan
            </label>

            <Select
              options={bulanOptions}
              value={bulan}
              onChange={setBulan}
              className="dark:bg-gray-900"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filter akan digunakan pada kartu statistik dan grafik.
          </p>

          <button
            type="button"
            onClick={resetFilter}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>

            Reset Filter
          </button>
        </div>
      </div>

        <StatistikCards
            kategori={kategori}
            sektor={sektor}
            tahun={tahun}
            bulan={bulan}
        />
         <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-5">
                <StatistikGenderChart
                    kategori={kategori}
                    sektor={sektor}
                    tahun={tahun}
                    bulan={bulan}
                />
            </div>
            <div className="xl:col-span-7">
                <StatistikPerbandinganJemaatChart
                    kategori={kategori}
                    sektor={sektor}
                    tahun={tahun}
                    bulan={bulan}
                />
            </div>
        
            <div className="xl:col-span-6">
                <StatistikUsiaGenderChart
                    kategori={kategori}
                    sektor={sektor}
                    tahun={tahun}
                    bulan={bulan}
                />
            </div>
            <div className="xl:col-span-6">
                <StatistikStatusJemaatChart
                    kategori={kategori}
                    sektor={sektor}
                    tahun={tahun}
                    bulan={bulan}
                />
            </div>
            <div className="xl:col-span-12">
                <StatistikPerkembanganJemaatChart
                    kategori={kategori}
                    sektor={sektor}
                    tahun={tahun}
                    bulan={bulan}
            />
            </div>    
         </div>  
    </div>
  );
}
