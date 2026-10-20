
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type JemaatOption = {
  id: number;
  nama_lengkap: string;
};

export default function KeluargaForm() {
  const router = useRouter();

  const [jemaat, setJemaat] = useState<JemaatOption[]>([]);
  const [kepalaKeluargaId, setKepalaKeluargaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadJemaat() {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("jemaat")
        .select("id, nama_lengkap")
        .eq("status_jemaat", "Aktif")
        .is("keluarga_id", null)
        .order("nama_lengkap", { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        console.error("Gagal mengambil data jemaat:", fetchError);
        setError("Gagal mengambil daftar jemaat aktif.");
        setLoading(false);
        return;
      }

      setJemaat(data ?? []);
      setLoading(false);
    }

    void loadJemaat();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!kepalaKeluargaId) {
      setError("Silakan pilih kepala keluarga.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const kepalaId = Number(kepalaKeluargaId);

    const { data: keluargaBaru, error: insertError } = await supabase
      .from("keluarga")
      .insert({
        kepala_keluarga_id: kepalaId,
      })
      .select("id")
      .single();

    if (insertError || !keluargaBaru) {
      console.error("Gagal menambahkan keluarga:", insertError);
      setError("Gagal menyimpan data keluarga. Silakan coba lagi.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("jemaat")
      .update({
        keluarga_id: keluargaBaru.id,
      })
      .eq("id", kepalaId)
      .eq("status_jemaat", "Aktif")
      .is("keluarga_id", null);

    if (updateError) {
      console.error("Gagal menghubungkan kepala keluarga:", updateError);

      const { error: rollbackError } = await supabase
        .from("keluarga")
        .delete()
        .eq("id", keluargaBaru.id);

      if (rollbackError) {
        console.error("Gagal membatalkan data keluarga:", rollbackError);
        setError(
          "Keluarga berhasil dibuat, tetapi kepala keluarga belum terhubung. Periksa data di Supabase sebelum mencoba lagi.",
        );
      } else {
        setError(
          "Kepala keluarga gagal dihubungkan. Data keluarga yang baru dibuat telah dibatalkan.",
        );
      }

      setSaving(false);
      return;
    }

    setSuccess("Data keluarga berhasil ditambahkan.");
    router.push("/keluarga");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="kepalaKeluarga"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Kepala Keluarga <span className="text-red-500">*</span>
          </label>

          <select
            id="kepalaKeluarga"
            value={kepalaKeluargaId}
            onChange={(event) => setKepalaKeluargaId(event.target.value)}
            disabled={loading || saving || jemaat.length === 0}
            required
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">
              {loading
                ? "Memuat daftar jemaat..."
                : jemaat.length === 0
                  ? "Tidak ada jemaat aktif yang belum memiliki keluarga"
                  : "Pilih kepala keluarga"}
            </option>

            {jemaat.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nama_lengkap}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Hanya jemaat aktif yang belum terhubung ke keluarga lain yang
            ditampilkan.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400"
          >
            {success}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/keluarga")}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={loading || saving || jemaat.length === 0}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Keluarga"}
          </button>
        </div>
      </form>
    </div>
  );
}
