"use client";

// import { CalenderIcon } from "@/icons";
import { ApexOptions } from "apexcharts";
import flatpickr from "flatpickr";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import ChartTab from "../common/ChartTab";
import { useTranslations } from "next-intl";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const monthKeys = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

const initialTotalJemaat = 500;

const monthlyGrowth = [
    {
      name: "Laki-laki",
      data: [100, 50, -5, 40, 35, 20, -10, 50, 70, 100, 25, 10], // contoh pertambahan/pengurangan bersih per bulan
    },
    {
      name: "Perempuan",
      data: [50, 70, 90, 0, -50, -100, 20, 40, 55, -10, 50, 10],
    },
  ];

let runningTotal = initialTotalJemaat;
  const totalJemaatData = monthlyGrowth[0].data.map((_, index) => {
    const netGrowthThisMonth = 
      monthlyGrowth[0].data[index] + monthlyGrowth[1].data[index];
    
    runningTotal += netGrowthThisMonth; // Tambahkan/kurangi dari total bulan sebelumnya
    return runningTotal;
  });

export default function PerkembanganJemaatChart() {
    const tMonths = useTranslations("ecommerce.months");
  const datePickerRef = useRef<HTMLInputElement>(null);

  const options: ApexOptions = {
    legend: {
      show: false, // Hide legend
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF","#dd46ff", "#9CB9FF"], // Define line colors
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line", // Set the chart type to 'line'
      toolbar: {
        show: false, // Hide chart toolbar
      },
    },
    stroke: {
      curve: "straight", // Define the line style (straight, smooth, or step)
      width: [2, 2], // Line width for each dataset
    },

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0, // Size of the marker points
      strokeColors: "#fff", // Marker border color
      strokeWidth: 2,
      hover: {
        size: 6, // Marker size on hover
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false, // Hide grid lines on x-axis
        },
      },
      yaxis: {
        lines: {
          show: true, // Show grid lines on y-axis
        },
      },
    },
    dataLabels: {
      enabled: false, // Disable data labels
    },
    tooltip: {
      enabled: true, // Enable tooltip
      x: {
        format: "dd MMM yyyy", // Format for x-axis tooltip
      },
    },
    xaxis: {
      type: "category", // Category-based x-axis
      categories: monthKeys.map((key) => tMonths(key)),
      axisBorder: {
        show: false, // Hide x-axis border
      },
      axisTicks: {
        show: false, // Hide x-axis ticks
      },
      tooltip: {
        enabled: false, // Disable tooltip for x-axis points
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px", // Adjust font size for y-axis labels
          colors: ["#6B7280"], // Color of the labels
        },
      },
      title: {
        text: "", // Remove y-axis title
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    ...monthlyGrowth,
    {
      name: "Total Jemaat",
      data: totalJemaatData,
    },
  ];

  useEffect(() => {
    if (!datePickerRef.current) return;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const fp = flatpickr(datePickerRef.current, {
      mode: "range",
      static: true,
      monthSelectorType: "static",
      dateFormat: "M d",
      defaultDate: [sevenDaysAgo, today],
      clickOpens: true,
      prevArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      nextArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    });

    return () => {
      if (!Array.isArray(fp)) {
        fp.destroy();
      }
    };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 sm:px-6 sm:pt-6 dark:border-gray-800 dark:bg-white/3">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Perkembangan Jumlah Jemaat
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Menampilkan data perkembangan jumlah jemaat dalam perbulan dalam setahun
          </p>
        </div>

        <div className="flex items-center gap-3 sm:justify-end">
          <ChartTab />
          {/* <div className="relative inline-flex items-center">
            <CalenderIcon className="inset-s-1/2 lg:inset-s-3 pointer-events-none absolute top-1/2 z-10 ms-2 -translate-x-1/2 -translate-y-1/2 text-gray-500 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2 rtl:translate-x-1/2 lg:rtl:translate-x-0 dark:text-gray-400" />
            <input
              ref={datePickerRef}
              className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 bg-white text-sm font-medium text-transparent outline-none lg:h-auto lg:w-40 lg:py-2 lg:ps-10 lg:pe-3 lg:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:lg:text-gray-300"
              placeholder={t("selectDateRange")}
            />
          </div> */}
        </div>
      </div>

      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="min-w-250 xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
