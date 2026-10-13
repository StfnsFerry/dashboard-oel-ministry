
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface JemaatRow {
  id: number;
  tanggal_bergabung: string | null;
  status_jemaat: string | null;
  kategori_id: number | null;
  sektor_id: number | null;
}

interface LookupRow {
  id: number;
  nama_kategori?: string;
  nama_sektor?: string;
}

interface StatistikCardsProps {
  kategori: string;
  sektor: string;
  tahun: string;
  bulan: string;
}

interface Statistik {
  total: number;
  aktif: number;
  tidakAktif: number;
  baru: number;
  totalSebelumnya: number;
  baruSebelumnya: number;
}

const emptyStatistik: Statistik = {
  total: 0,
  aktif: 0,
  tidakAktif: 0,
  baru: 0,
  totalSebelumnya: 0,
  baruSebelumnya: 0,
};

function getPercentage(current: number, previous: number): string {
  if (previous === 0) return "—";

  const percentage = ((current - previous) / previous) * 100;
  const sign = percentage > 0 ? "+" : "";

  return `${sign}${percentage.toFixed(1)}%`;
}

function getPercentageColor(current: number, previous: number): string {
  if (previous === 0 || current === previous) {
    return "text-gray-500 dark:text-gray-400";
  }

  return current > previous ? "text-green-600" : "text-red-500";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function getPeriod(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const previousStart = new Date(year, month - 2, 1);
  const previousEnd = new Date(year, month - 1, 0);

  const toDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  };

  return {
    start: toDateString(start),
    end: toDateString(end),
    previousStart: toDateString(previousStart),
    previousEnd: toDateString(previousEnd),
  };
}

export default function StatistikCards({
  kategori,
  sektor,
  tahun,
  bulan,
}: StatistikCardsProps) {
  const [statistik, setStatistik] = useState<Statistik>(emptyStatistik);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchStatistik() {
      setLoading(true);
      setErrorMessage("");

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
              "id, tanggal_bergabung, status_jemaat, kategori_id, sektor_id",
            ),
          supabase.from("kategori").select("id, nama_kategori"),
          supabase.from("sektor").select("id, nama_sektor"),
        ]);

        if (jemaatError) throw jemaatError;
        if (kategoriError) throw kategoriError;
        if (sektorError) throw sektorError;

        const jemaatRows = (jemaatData ?? []) as JemaatRow[];
        const kategoriRows = (kategoriData ?? []) as LookupRow[];
        const sektorRows = (sektorData ?? []) as LookupRow[];

        const kategoriTerpilih =
          kategori === "all"
            ? null
            : kategoriRows.find(
                (item) => item.nama_kategori === kategori,
              )?.id;

        const sektorTerpilih =
          sektor === "all"
            ? null
            : sektorRows.find((item) => item.nama_sektor === sektor)?.id;

        if (
          (kategori !== "all" && kategoriTerpilih === undefined) ||
          (sektor !== "all" && sektorTerpilih === undefined)
        ) {
          throw new Error(
            "Kategori atau sektor tidak ditemukan. Periksa nama kolom dan data referensi di Supabase.",
          );
        }

        const filteredRows = jemaatRows.filter((jemaat) => {
          const matchKategori =
            kategoriTerpilih == null ||
            jemaat.kategori_id === kategoriTerpilih;

          const matchSektor =
            sektorTerpilih == null ||
            jemaat.sektor_id === sektorTerpilih;

          return matchKategori && matchSektor;
        });

        const year = Number(tahun);
        const month = Number(bulan);
        const period = getPeriod(year, month);

        const joinedBy = (row: JemaatRow, date: string) =>
          row.tanggal_bergabung !== null &&
          row.tanggal_bergabung <= date;

        const joinedInPeriod = (
          row: JemaatRow,
          start: string,
          end: string,
        ) =>
          row.tanggal_bergabung !== null &&
          row.tanggal_bergabung >= start &&
          row.tanggal_bergabung <= end;

        const rowsAtEnd = filteredRows.filter((row) =>
          joinedBy(row, period.end),
        );

        const rowsAtPreviousEnd = filteredRows.filter((row) =>
          joinedBy(row, period.previousEnd),
        );

        const activeCount = rowsAtEnd.filter(
          (row) => row.status_jemaat === "Aktif",
        ).length;

        const inactiveCount = rowsAtEnd.filter(
          (row) => row.status_jemaat === "Tidak Aktif",
        ).length;

        const newCount = filteredRows.filter((row) =>
          joinedInPeriod(row, period.start, period.end),
        ).length;

        const previousNewCount = filteredRows.filter((row) =>
          joinedInPeriod(
            row,
            period.previousStart,
            period.previousEnd,
          ),
        ).length;

        if (!cancelled) {
          setStatistik({
            total: rowsAtEnd.length,
            aktif: activeCount,
            tidakAktif: inactiveCount,
            baru: newCount,
            totalSebelumnya: rowsAtPreviousEnd.length,
            baruSebelumnya: previousNewCount,
          });
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Gagal mengambil data statistik.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchStatistik();

    return () => {
      cancelled = true;
    };
  }, [kategori, sektor, tahun, bulan]);

  const cards = [
    {
      title: "Total Jemaat",
      value: statistik.total,
      comparison: getPercentage(
        statistik.total,
        statistik.totalSebelumnya,
      ),
      comparisonText: "dibanding bulan sebelumnya",
      color: getPercentageColor(
        statistik.total,
        statistik.totalSebelumnya,
      ),
      icon: "users",
    },
    {
      title: "Jemaat Aktif",
      value: statistik.aktif,
      comparison:
        statistik.total > 0
          ? `${((statistik.aktif / statistik.total) * 100).toFixed(1)}%`
          : "0%",
      comparisonText: "dari total jemaat",
      color: "text-green-600",
      icon: "user-check",
    },
    {
      title: "Jemaat Tidak Aktif",
      value: statistik.tidakAktif,
      comparison:
        statistik.total > 0
          ? `${((statistik.tidakAktif / statistik.total) * 100).toFixed(1)}%`
          : "0%",
      comparisonText: "dari total jemaat",
      color: "text-red-500",
      icon: "user-x",
    },
    {
      title: "Jemaat Baru",
      value: statistik.baru,
      comparison: getPercentage(
        statistik.baru,
        statistik.baruSebelumnya,
      ),
      comparisonText: "dibanding bulan sebelumnya",
      color: getPercentageColor(
        statistik.baru,
        statistik.baruSebelumnya,
      ),
      icon: "user-plus",
    },
  ];

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
        >
          Gagal memuat statistik: {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>

                <h3 className="mt-3 text-2xl font-bold text-gray-800 dark:text-white/90">
                  {loading ? "..." : formatNumber(card.value)}
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {card.icon === "users" && (
                  <svg
                    width="23"
                    height="23"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="10" cy="7" r="4" />
                    <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}

                {card.icon === "user-check" && (
                  <svg
                    width="23"
                    height="23"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="7" r="4" />
                    <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 11l2 2 4-4" />
                  </svg>
                )}

                {card.icon === "user-x" && (
                  <svg
                    width="23"
                    height="23"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="7" r="4" />
                    <path d="M3 21v-2a6 6 0 0 1 12 0v2M17 9l5 5m0-5-5 5" />
                  </svg>
                )}

                {card.icon === "user-plus" && (
                  <svg
                    width="23"
                    height="23"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="7" r="4" />
                    <path d="M3 21v-2a6 6 0 0 1 12 0v2M19 8v6m-3-3h6" />
                  </svg>
                )}
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
              <p className="text-sm">
                {loading ? (
                  <span className="text-gray-400">Memuat data...</span>
                ) : (
                  <>
                    <span className={`font-semibold ${card.color}`}>
                      {card.comparison}
                    </span>
                    <span className="ml-1 text-gray-500 dark:text-gray-400">
                      {card.comparisonText}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Catatan: status aktif dan tidak aktif mengikuti status terkini di
        database. Perubahan status historis belum direkam.
      </p>
    </div>
  );
}
