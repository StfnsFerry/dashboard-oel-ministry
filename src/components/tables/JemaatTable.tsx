"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn
} from "@tanstack/react-table";

import { createClient } from "@/lib/supabase/client";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";
import Alert from "@/components/ui/alert/Alert";
import Input from "../form/input/InputField";
import Select from "@/components/form/Select";

type Jemaat = {
  id: number;
  nama_lengkap: string;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  golongan_darah: string | null;
  jenis_kelamin: "L" | "P" | null;
  tanggal_bergabung: string | null;
  status_jemaat: string;
  sektor: {
    id: number;
    nama_sektor: string;
  } | null;
  kategori: {
    id: number;
    nama_kategori: string;
  } | null;
};

const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

const selectFilter: FilterFn<typeof features, Jemaat> = (
  row,
  columnId,
  filterValue,
) => {
  if (!filterValue) return true;

  return String(row.getValue(columnId)) === String(filterValue);
};

interface SelectProps {
  kategori?: string;
  sektor?: string;
}

const JemaatTable: React.FC<SelectProps> = ({ kategori ="", sektor="" }) => {

  const [data, setData] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [columnFilters, setColumnFilters] =
  useState<ColumnFiltersState>([]);
  
  const [globalFilter, setGlobalFilter] = useState("");
  
  const [sektorList, setSektorList] = useState<
  { id: number; nama_sektor: string }[]
  >([]);
  
  const [kategoriList, setKategoriList] = useState<
  { id: number; nama_kategori: string }[]
  >([]);

  const [selectedJemaat, setSelectedJemaat] =
  useState<Jemaat | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!actionMessage) return;

    const timeoutId = setTimeout(() => {
      setActionMessage(null);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [actionMessage]);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");

      const supabase = createClient();

      let jemaatQuery = supabase
        .from("jemaat")
        .select(`
          id,
          nama_lengkap,
          tempat_lahir,
          tanggal_lahir,
          alamat,
          golongan_darah,
          jenis_kelamin,
          tanggal_bergabung,
          status_jemaat,
          sektor!inner (
            id,
            nama_sektor
          ),
          kategori!inner (
            id,
            nama_kategori
          )
        `)
        .eq("status_jemaat", "Aktif");

      if (kategori) {
        jemaatQuery = jemaatQuery.eq(
          "kategori.nama_kategori",
          kategori
        );
      }

      if (sektor) {
        jemaatQuery = jemaatQuery.eq(
          "sektor.nama_sektor",
          sektor
        );
      }

      const [
        jemaatResponse,
        sektorResponse,
        kategoriResponse,
      ] = await Promise.all([
        jemaatQuery.order("nama_lengkap", { ascending: true }),

        supabase
          .from("sektor")
          .select("id, nama_sektor")
          .order("nama_sektor"),

        supabase
          .from("kategori")
          .select("id, nama_kategori")
          .order("nama_kategori"),
      ]);


      if (jemaatResponse.error) {
        console.error(
          "Error mengambil data jemaat:",
          jemaatResponse.error
        );

        setError("Gagal mengambil data jemaat.");
        setLoading(false);
        return;
      }

      if (sektorResponse.error) {
        console.error(
          "Error mengambil data sektor:",
          sektorResponse.error
        );

        setError("Gagal mengambil data sektor.");
        setLoading(false);
        return;
      }

      if (kategoriResponse.error) {
        console.error(
          "Error mengambil data kategori:",
          kategoriResponse.error
        );

        setError("Gagal mengambil data kategori.");
        setLoading(false);
        return;
      }

      const normalizedData: Jemaat[] = (
        jemaatResponse.data ?? []
      ).map((item) => ({
        id: item.id,
        nama_lengkap: item.nama_lengkap,
        tempat_lahir: item.tempat_lahir,
        tanggal_lahir: item.tanggal_lahir,
        alamat: item.alamat,
        golongan_darah: item.golongan_darah,
        jenis_kelamin: item.jenis_kelamin,
        tanggal_bergabung: item.tanggal_bergabung,
        status_jemaat: item.status_jemaat,
        sektor: Array.isArray(item.sektor)
          ? item.sektor[0] ?? null
          : item.sektor,

        kategori: Array.isArray(item.kategori)
          ? item.kategori[0] ?? null
          : item.kategori,
      }));

      setData(normalizedData);
      setSektorList(sektorResponse.data ?? []);
      setKategoriList(kategoriResponse.data ?? []);

      setLoading(false);
    }

    fetchData();
  }, [kategori, sektor]);

  async function handleSoftDelete() {
    if (!selectedJemaat || deleteLoading) return;

    setDeleteLoading(true);
    setActionMessage(null);

    const supabase = createClient();

    const { data: updatedJemaat, error: updateError } = await supabase
      .from("jemaat")
      .update({ status_jemaat: "Tidak Aktif" })
      .eq("id", selectedJemaat.id)
      .eq("status_jemaat", "Aktif")
      .select("id")
      .maybeSingle();

    if (updateError || !updatedJemaat) {
      console.error("Gagal menonaktifkan jemaat:", updateError);

      setActionMessage({
        type: "error",
        text: updateError
          ? "Gagal menonaktifkan jemaat. Periksa koneksi atau izin akses."
          : "Status jemaat tidak berubah. Data mungkin sudah tidak aktif atau tidak dapat diakses.",
      });

      setDeleteLoading(false);
      return;
    }

    setData((currentData) =>
      currentData.filter((item) => item.id !== selectedJemaat.id),
    );

    setActionMessage({
      type: "success",
      text: `${selectedJemaat.nama_lengkap} berhasil dinonaktifkan.`,
    });

    setSelectedJemaat(null);
    setDeleteLoading(false);
  }

  const columns: Array<ColumnDef<typeof features, Jemaat>> = 
  [
    {
      accessorKey: "nama_lengkap",
      header: "Nama Lengkap",
    },
    {
      accessorKey: "jenis_kelamin",
      header: "Jenis Kelamin",
      cell: (info) => {
        const jenisKelamin = info.row.original.jenis_kelamin;

        if (jenisKelamin === "L") {
          return "Laki-laki";
        }

        if (jenisKelamin === "P") {
          return "Perempuan";
        }

        return "-";
      },
    },
    {
      accessorKey: "tanggal_lahir",
      header: "Tanggal Lahir",
      cell: (info) => {
        const tanggal = info.row.original.tanggal_lahir;

        if (!tanggal) {
          return "-";
        }

        return new Date(tanggal).toLocaleDateString("id-ID");
      },
    },
    {
      id: "sektor",
      accessorFn: (row) => row.sektor?.nama_sektor ?? "",
      header: "Sektor",
      filterFn: selectFilter,
    },
      {
      id: "kategori",
      accessorFn: (row) => row.kategori?.nama_kategori ?? "",
      header: "Kategori",
      filterFn: selectFilter,
    },
    {
      id: "aksi",
      header: "Aksi",
      enableSorting: false,
      enableColumnFilter: false,
      cell: (info) => {
        const jemaat = info.row.original;

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Detail jemaat"
              onClick={() => router.push(`/jemaat/${jemaat.id}`)}
              className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-500/10"
            >
              <EyeIcon size={18} />
            </button>

            <button
              type="button"
              title="Edit jemaat"
              onClick={() => router.push(`/jemaat/${jemaat.id}/edit`)}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:hover:bg-gray-500/10"
            >
              <PencilIcon size={18} />
            </button>

            <button
              type="button"
              title="Nonaktifkan jemaat"
              onClick={() => {
                setActionMessage(null);
                setSelectedJemaat(jemaat);
              }}
              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <TrashBinIcon size={18} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useTable({
    key: "jemaat-table",
    features,
    columns,
    data,

    state: {
      columnFilters,
      globalFilter,
    },

    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,

    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();

      return row.original.nama_lengkap
        .toLowerCase()
        .includes(search);
    },

    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  function resetFilters() {
    setGlobalFilter("");
    setColumnFilters([]);

    table.resetPagination();
  }

  const sektorOptions = [
    { value: "all", label: "Semua Sektor" },
    ...sektorList.map((sektor) => ({
      value: sektor.nama_sektor,
      label: sektor.nama_sektor,
    })),
  ];

  const kategoriOptions = [
    { value: "all", label: "Semua Kategori" },
    ...kategoriList.map((kategori) => ({
      value: kategori.nama_kategori,
      label: kategori.nama_kategori,
    })),
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-500">
          Memuat data jemaat...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">  
      {actionMessage && (
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <Alert
            variant={actionMessage.type}
            title={actionMessage.type === "success" ? "Berhasil" : "Gagal"}
            message={actionMessage.text}
            showLink={false}
          />
        </div>
      )}

      {selectedJemaat && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10">
                <TrashBinIcon size={22} />
              </div>

              <div>
                <h2
                  id="delete-dialog-title"
                  className="text-lg font-semibold text-gray-800 dark:text-white"
                >
                  Nonaktifkan Jemaat
                </h2>

                <p className="text-sm text-gray-500">
                  Konfirmasi perubahan status
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
              Apakah kamu yakin ingin menonaktifkan jemaat{" "} <br />
              <strong>{selectedJemaat.nama_lengkap}</strong>? <br /> <br />
              Data tidak akan dihapus permanen, tetapi statusnya akan
              diubah menjadi Tidak Aktif.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setSelectedJemaat(null)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleSoftDelete}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? "Memproses..." : "Ya, Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label
              htmlFor="search-jemaat"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Cari Jemaat
            </label>

            <input
              id="search-jemaat"
              type="text"
              value={globalFilter}
              onChange={(event) =>
                setGlobalFilter(event.target.value)
              }
              placeholder="Cari berdasarkan nama..."
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:border-brand-500 dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* Sektor */}
          <div>
            <label
              htmlFor="filter-sektor"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Sektor
            </label>
            {sektor ? 
              <Input value={sektor} readOnly/>
              : 
              <Select
                placeholder="Pilih sektor"
                options={sektorOptions}
                value={
                  String(table.getColumn("sektor")?.getFilterValue() ?? "") ||
                  "all"
                }
                onChange={(value) => {
                  table
                    .getColumn("sektor")
                    ?.setFilterValue(value === "all" ? "" : value);
                }}
                className="dark:bg-dark-900"
              />
            }
          </div>

          {/* Kategori */}
          <div>
            <label
              htmlFor="filter-kategori"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kategori
            </label>
            
            {kategori ? 
              <Input value={kategori} readOnly/>
              : 
              <Select
                placeholder="Pilih kategori"
                options={kategoriOptions}
                value={
                  String(table.getColumn("kategori")?.getFilterValue() ?? "") ||
                  "all"
                }
                onChange={(value) => {
                  table
                    .getColumn("kategori")
                    ?.setFilterValue(value === "all" ? "" : value);
                }}
                className="dark:bg-dark-900"
              />
            }
          </div>
        </div>

        {/* Reset */}
        {(globalFilter || columnFilters.length > 0) && (
          <div className="mt-4">
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1"
                      >
                        <table.FlexRender header={header} />

                        {{
                          asc: " ↑",
                          desc: " ↓",
                        }[header.column.getIsSorted() as string] ?? ""}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              >
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty */}
      {table.getRowModel().rows.length === 0 && (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            Tidak ada data jemaat yang sesuai dengan filter.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        {/* Page size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Tampilkan
          </span>

          <select
            value={table.state.pagination.pageSize}
            onChange={(event) => {
              table.setPageSize(Number(event.target.value));
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <span className="text-sm text-gray-500">
            data
          </span>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
          >
            Sebelumnya
          </button>

          <span className="text-sm text-gray-500">
            Halaman{" "}
            {table.state.pagination.pageIndex + 1} dari{" "}
            {table.getPageCount()}
          </span>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
export default JemaatTable;