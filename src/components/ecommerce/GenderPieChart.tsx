"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function GenderPieChart() {
  // Data jemaat berdasarkan jenis kelamin (Contoh: 320 Laki-laki, 380 Perempuan)
  const series = [320, 300];

  const options: ApexOptions = {
    legend: {
        show: true,
        position: "bottom",
        fontFamily: "Outfit, sans-serif",
        markers : {
            strokeWidth: 0,
        }
    },
    colors: ["#465FFF", "#9CB9FF"], // Warna selaras dengan tema TailAdmin
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut", // Bisa diubah menjadi "pie" jika ingin lingkaran penuh tanpa lubang di tengah
      height: 331,
    },
    labels: ["Laki-laki", "Perempuan"],
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
          },
        },
      },
    },
    },
    dataLabels: {
      enabled: true,
      style:{
        fontFamily: "Outfit, sans-serif",
        colors: ["#FFFFFF", "#FFFFFF"],
      },
      dropShadow : {
        enabled: false,
      },
      formatter: function (val: number) {
        return val.toFixed(1) + "%"; // Menampilkan persentase di dalam chart
      },
    },
    tooltip: {
      enabled: false,
    },
    stroke: {
      show: false, // Menghilangkan garis tepi putih antar potongan pie
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 sm:px-6 sm:pt-6 dark:border-gray-800 dark:bg-white/3">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Pengelompokan Jenis Kelamin Jemaat
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Perbandingan jumlah jemaat Laki-laki dan Perempuan
          </p>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200">
                <svg
                className="fill-white stroke-current dark:fill-gray-800"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                >
                <path
                    d="M2.29004 5.90393H17.7067"
                    stroke=""
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M17.7075 14.0961H2.29085"
                    stroke=""
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                    fill=""
                    stroke=""
                    strokeWidth="1.5"
                />
                <path
                    d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                    fill=""
                    stroke=""
                    strokeWidth="1.5"
                />
                </svg>
                Filter
          </button>
        </div>
      </div>


      <div className="flex justify-center max-w-full overflow-x-auto">
        <div className="w-full max-w-[350px]">
          <Chart options={options} series={series} type="donut" height={331} />
        </div>
      </div>
    </div>
  );
}