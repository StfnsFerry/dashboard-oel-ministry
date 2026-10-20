
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Alert from "@/components/ui/alert/Alert";
import { EyeIcon, TrashBinIcon } from "../../icons";

type Keluarga = {
  id: number;
  kepala_keluarga_id: number | null;
  created_at: string;
  kepala_keluarga: {
    id: number;
    nama_lengkap: string;
  } | null;
  jumlah_anggota: number;
};

export default function KeluargaTable() {
  const [data, setData] = useState<Keluarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Keluarga | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const router = useRouter();
  const pageSize = 10;

  useEffect(() => {
    if (!message) return;

    const timeout = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [message]);


useEffect(() => {
  let cancelled = false;

  async function loadData() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data: keluarga, error: fetchError } = await supabase
      .from("keluarga")
      .select(`
        id,
        kepala_keluarga_id,
        created_at,
        kepala_keluarga:jemaat!keluarga_kepala_keluarga_id_fkey (
          id,
          nama_lengkap
        )
      `)
      .order("id", { ascending: true });

    if (cancelled) return;

    if (fetchError) {
      console.error("Gagal mengambil keluarga:", fetchError);
      setError("Gagal mengambil data keluarga.");
      setLoading(false);
      return;
    }

    const { data: jemaat, error: anggotaError } = await supabase
      .from("jemaat")
      .select("keluarga_id")
      .not("keluarga_id", "is", null);

    if (cancelled) return;

    if (anggotaError) {
      console.error("Gagal mengambil anggota keluarga:", anggotaError);
      setError("Gagal mengambil jumlah anggota keluarga.");
      setLoading(false);
      return;
    }

    const counts = new Map<number, number>();

    for (const anggota of jemaat ?? []) {
      if (anggota.keluarga_id !== null) {
        counts.set(
          anggota.keluarga_id,
          (counts.get(anggota.keluarga_id) ?? 0) + 1,
        );
      }
    }

    const normalized: Keluarga[] = (keluarga ?? []).map((item) => ({
      id: item.id,
      kepala_keluarga_id: item.kepala_keluarga_id,
      created_at: item.created_at,
      kepala_keluarga: Array.isArray(item.kepala_keluarga)
        ? item.kepala_keluarga[0] ?? null
        : item.kepala_keluarga,
      jumlah_anggota: counts.get(item.id) ?? 0,
    }));

    setData(normalized);
    setLoading(false);
  }

  void loadData();

  return () => {
    cancelled = true;
  };
}, []);

  async function handleDelete() {
    if (!selected || deleteLoading) return;

    setDeleteLoading(true);
    setMessage(null);

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("keluarga")
      .delete()
      .eq("id", selected.id);

    if (deleteError) {
      console.error("Gagal menghapus keluarga:", deleteError);
      setMessage({
        type: "error",
        text: "Gagal menghapus keluarga. Periksa izin akses dan relasi data.",
      });
      setDeleteLoading(false);
      return;
    }

    setData((current) =>
      current.filter((item) => item.id !== selected.id),
    );

    setMessage({
      type: "success",
      text: "Data keluarga berhasil dihapus.",
    });

    setSelected(null);
    setDeleteLoading(false);
  }

  const filtered = data.filter((item) =>
    (item.kepala_keluarga?.nama_lengkap ?? "Belum ditentukan")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  if (loading) {
    return <div className="rounded-2xl border p-6">Memuat data keluarga...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {message && (
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <Alert
            variant={message.type}
            title={message.type === "success" ? "Berhasil" : "Gagal"}
            message={message.text}
            showLink={false}
          />
        </div>
      )}

      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <label htmlFor="search-keluarga" className="mb-2 block text-sm font-medium">
          Cari Kepala Keluarga
        </label>
        <input
          id="search-keluarga"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Masukkan nama kepala keluarga..."
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500">Kepala Keluarga</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500">Jumlah Anggota</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {pageData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="px-6 py-4 text-sm">
                  {item.kepala_keluarga?.nama_lengkap ?? "Belum ditentukan"}
                </td>
                <td className="px-6 py-4 text-sm">{item.jumlah_anggota} orang</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="Detail keluarga"
                      onClick={() => router.push(`/keluarga/${item.id}`)}
                      className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                    >
                      <EyeIcon size={18} />
                    </button>
                    <button
                      type="button"
                      title="Hapus keluarga"
                      onClick={() => {
                        setMessage(null);
                        setSelected(item);
                      }}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <TrashBinIcon size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">
                  Tidak ada data keluarga.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-gray-500">
          {filtered.length} keluarga
        </span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 dark:border-gray-700"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-gray-500">
            Halaman {Math.min(page, pageCount)} dari {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 dark:border-gray-700"
          >
            Berikutnya
          </button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-keluarga-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
          >
            <h2 id="delete-keluarga-title" className="text-lg font-semibold">
              Hapus Keluarga
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Yakin ingin menghapus data keluarga dengan kepala keluarga{" "}
              <strong>
                {selected.kepala_keluarga?.nama_lengkap ?? "Belum ditentukan"}
              </strong>
              ? Data jemaat tidak dihapus, tetapi relasi ke keluarga ini akan dikosongkan.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setSelected(null)}
                className="rounded-lg border px-4 py-2.5 text-sm disabled:opacity-50 dark:border-gray-700"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
