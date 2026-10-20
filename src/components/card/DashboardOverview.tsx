
"use client";

import { useEffect, useState } from "react";
import { getStatistikData } from "@/lib/cache/StatistikCache";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";


type Jemaat = {
  id: number;
  nama_lengkap: string;
  tanggal_lahir: string | null;
  tanggal_bergabung: string | null;
  status_jemaat: string | null;
  kategori_id: number | null;
  sektor_id: number | null;
};

type Kategori = {
  id: number;
  nama_kategori: string;
};

type Sektor = {
  id: number;
  nama_sektor: string;
};

type BirthdayRow = {
  id: number;
  nama: string;
  tanggal: string;
  usia: number;
  sektor: string;
  kategori: string;
  status: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDate(day: number, month: number) {
  const date = new Date(2000, month - 1, day);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
  }).format(date);
}

export default function DashboardOverview() {
  const [jemaat, setJemaat] = useState<Jemaat[]>([]);
  const [birthdayRows, setBirthdayRows] = useState<BirthdayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setLoading(true);
      setError("");

      try {
        const {
          jemaat: jemaatData,
          kategoris,
          sektors,
        } = await getStatistikData();

        if (cancelled) return;

        const jemaatRows = jemaatData as Jemaat[];
        const kategoriRows = kategoris as Kategori[];
        const sektorRows = sektors as Sektor[];

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const kategoriMap = new Map(
          kategoriRows.map((item) => [item.id, item.nama_kategori]),
        );

        const sektorMap = new Map(
          sektorRows.map((item) => [item.id, item.nama_sektor]),
        );

        const birthdays: BirthdayRow[] = jemaatRows
          .filter((item) => {

            if (item.status_jemaat !== "Aktif") return false;

            if (!item.tanggal_lahir) return false;

            const parts = item.tanggal_lahir.split("-");
            if (parts.length < 3) return false;

            const birthMonth = Number(parts[1]);
            const birthDay = Number(parts[2]);

            return (
              birthMonth === currentMonth &&
              Number.isInteger(birthDay) &&
              birthDay >= 1 &&
              birthDay <= 31
            );
          })
          .map((item) => {
            const parts = item.tanggal_lahir!.split("-");
            const birthYear = Number(parts[0]);
            const birthMonth = Number(parts[1]);
            const birthDay = Number(parts[2]);

            return {
              id: item.id,
              nama: item.nama_lengkap,
              tanggal: formatDate(birthDay, birthMonth),
              usia: currentYear - birthYear,
              sektor: item.sektor_id
                ? sektorMap.get(item.sektor_id) ?? "Belum diatur"
                : "Belum diatur",
              kategori: item.kategori_id
                ? kategoriMap.get(item.kategori_id) ?? "Belum diatur"
                : "Belum diatur",
              status: item.status_jemaat ?? "Belum diatur",
              sortDay: birthDay,
            };
          })
          .sort((a, b) => a.sortDay - b.sortDay)
          .map(({ sortDay: _sortDay, ...item }) => item);

        setJemaat(jemaatRows);
        setBirthdayRows(birthdays);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat ringkasan dashboard.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const now = new Date();
  const monthName = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(now);

  const total = jemaat.length;
  const aktif = jemaat.filter(
    (item) => item.status_jemaat === "Aktif",
  ).length;
  const tidakAktif = jemaat.filter(
    (item) => item.status_jemaat === "Tidak Aktif",
  ).length;

  const jemaatBaru = jemaat.filter((item) => {
    if (!item.tanggal_bergabung) return false;

    const date = item.tanggal_bergabung.split("-");
    return (
      Number(date[0]) === now.getFullYear() &&
      Number(date[1]) === now.getMonth() + 1
    );
  }).length;

  const recentJemaat = [...jemaat]
  .sort((a, b) => b.id - a.id)
  .slice(0, 5);

  const cards = [
    {
      title: "Total Jemaat",
      value: total,
      description: "Semua data jemaat",
      icon: "users",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      title: "Jemaat Aktif",
      value: aktif,
      description: "Status aktif saat ini",
      icon: "check",
      color:
        "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    },
    {
      title: "Jemaat Tidak Aktif",
      value: tidakAktif,
      description: "Status tidak aktif",
      icon: "inactive",
      color:
        "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    },
    {
      title: "Jemaat Baru",
      value: jemaatBaru,
      description: `Bergabung pada ${monthName}`,
      icon: "plus",
      color:
        "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-12"> 
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Dashboard Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ringkasan data jemaat JKI Ora et Labora.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
          >
            Gagal memuat dashboard: {error}
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
                  <h3 className="mt-3 text-3xl font-bold text-gray-800 dark:text-white/90">
                    {loading ? "..." : formatNumber(card.value)}
                  </h3>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}
                >
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
                  {card.icon === "check" && (
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
                      <circle cx="12" cy="12" r="9" />
                      <path d="m8 12 3 3 5-6" />
                    </svg>
                  )}
                  {card.icon === "inactive" && (
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
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 12h8" />
                    </svg>
                  )}
                  {card.icon === "plus" && (
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

              <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-12 xl:col-span-7">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
            <div className="flex flex-col gap-1 border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Ulang Tahun Jemaat
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Jemaat yang berulang tahun pada {monthName}.
                    </p>
                </div>
                    <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {loading ? "Memuat..." : `${birthdayRows.length} jemaat`}
                    </span>
            </div>

            {loading ? (
                <div className="px-6 py-12 text-center text-sm text-gray-500">
                Memuat daftar ulang tahun...
                </div>
            ) : error ? (
                <div className="px-6 py-12 text-center text-sm text-red-500">
                Daftar ulang tahun tidak dapat dimuat.
                </div>
            ) : birthdayRows.length === 0 ? (
                <div className="px-6 py-12 text-center">
                <p className="font-medium text-gray-700 dark:text-gray-200">
                    Belum ada jemaat yang berulang tahun bulan ini.
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Jemaat tanpa tanggal lahir tidak disertakan dalam daftar.
                </p>
                </div>
            ) : (
            <div className="max-w-full overflow-x-auto">
                <Table>
                    {/* Table Header */}
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                Nama Jemaat
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                Tanggal Ulang Tahun
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                Usia
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                Status
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    {/* Table Body */}
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {birthdayRows.map((row) => (  
                        <TableRow key={row.id}>
                            <TableCell className="px-5 py-3 text-start sm:px-5">
                                <div className="flex items-center gap-3">
                                    <div>
                                    <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                                        {row.nama}
                                    </span>
                                    <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                                        {row.sektor} | {row.kategori}
                                    </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="px-5 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                                {row.tanggal}
                            </TableCell>
                            <TableCell className="px-5 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                                {row.usia} tahun
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                                <Badge
                                    size="sm"
                                    color={
                                    row.status === "Aktif"
                                        ? "success"
                                        : row.status === "Tidak Aktif"
                                        ? "warning"
                                        : "error"
                                    }
                                >
                                    {row.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
              )}
        </div>
      </div>

      <div className="col-span-12 xl:col-span-5">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.03]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Jemaat Terbaru
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                5 data jemaat terakhir ditambahkan.
              </p>
            </div>

            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {loading ? "..." : `${recentJemaat.length} jemaat`}
            </span>
          </div>

          {/* Content */}
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              Memuat data jemaat...
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center text-sm text-red-500">
              Data jemaat tidak dapat dimuat.
            </div>
          ) : recentJemaat.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              Belum ada data jemaat.
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Nama Jemaat
                    </TableCell>

                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Bergabung
                    </TableCell>

                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {recentJemaat.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="px-5 py-3 text-start sm:px-5">
                          <div className="flex items-center gap-3">
                              <div>
                                <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                                    {row.nama_lengkap}
                                </span>
                                <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                                    Jemaat Baru
                                </span>
                              </div>
                          </div>
                        </TableCell>

                      <TableCell className="whitespace-nowrap px-4 py-4 text-start text-theme-xs text-gray-500 dark:text-gray-400">
                        {row.tanggal_bergabung
                          ? new Intl.DateTimeFormat("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }).format(
                              new Date(`${row.tanggal_bergabung}T00:00:00`),
                            )
                          : "—"}
                      </TableCell>

                      <TableCell className="px-4 py-4 text-start">
                        <Badge
                          size="sm"
                          color={
                            row.status_jemaat === "Aktif"
                              ? "success"
                              : row.status_jemaat === "Tidak Aktif"
                                ? "warning"
                                : "error"
                          }
                        >
                          {row.status_jemaat ?? "Belum diatur"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>  
  );
}
