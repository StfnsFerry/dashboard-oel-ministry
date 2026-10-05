"use client";
import BasicTableJemaat from "@/components/tables/BasicTableJemaat";
export default function StatisticsChart() {
  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 sm:px-6 sm:pt-6 dark:border-gray-800 dark:bg-white/3">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Table Jemaat
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Menampilkan data jemaat yang baru bergabung
          </p>
        </div>

        <div className="flex items-center gap-3 sm:justify-end">
            <button className="w-30 items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200">
                Lihat semua
            </button>
        </div>
      </div>

      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <BasicTableJemaat />
      </div>
    </div>
  );
}
