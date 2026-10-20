
"use client";

import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal"
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TrashBinIcon } from "@/icons";

type Keluarga = {
  id: number;
  kepala_keluarga_id: number | null;
  created_at: string;
};

type Jemaat = {
  id: number;
  nama_lengkap: string;
  jenis_kelamin: string | null;
  tanggal_lahir: string | null;
  status_jemaat: string;
};

type JemaatOption = {
  id: number;
  nama_lengkap: string;
};

export default function DetailKeluargaPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [selectedMember, setSelectedMember] = useState<Jemaat | null>(null);

  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState("");

  const [keluarga, setKeluarga] = useState<Keluarga | null>(null);
  const [kepalaKeluarga, setKepalaKeluarga] = useState<Jemaat | null>(null);
  const [anggota, setAnggota] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [kepalaOptions, setKepalaOptions] = useState<JemaatOption[]>([]);
  const [selectedKepalaId, setSelectedKepalaId] = useState("");
  const [loadingKepalaOptions, setLoadingKepalaOptions] = useState(false);
  const [savingKepala, setSavingKepala] = useState(false);
  const [editError, setEditError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jemaatOptions, setJemaatOptions] = useState<JemaatOption[]>([]);
  const [selectedJemaatId, setSelectedJemaatId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data: keluargaData, error: keluargaError } = await supabase
      .from("keluarga")
      .select("id, kepala_keluarga_id, created_at")
      .eq("id", id)
      .maybeSingle();

    if (keluargaError || !keluargaData) {
      console.error("Gagal mengambil data keluarga:", keluargaError);
      setError(
        keluargaError
          ? "Gagal mengambil data keluarga."
          : "Data keluarga tidak ditemukan.",
      );
      setLoading(false);
      return;
    }

    const { data: anggotaData, error: anggotaError } = await supabase
      .from("jemaat")
      .select(
        "id, nama_lengkap, jenis_kelamin, tanggal_lahir, status_jemaat",
      )
      .eq("keluarga_id", id)
      .order("nama_lengkap", { ascending: false });

    if (anggotaError) {
      console.error("Gagal mengambil anggota keluarga:", anggotaError);
      setError("Gagal mengambil daftar anggota keluarga.");
      setLoading(false);
      return;
    }

    let kepala: Jemaat | null = null;

    if (keluargaData.kepala_keluarga_id !== null) {
      const { data: kepalaData, error: kepalaError } = await supabase
        .from("jemaat")
        .select(
          "id, nama_lengkap, jenis_kelamin, tanggal_lahir, status_jemaat",
        )
        .eq("id", keluargaData.kepala_keluarga_id)
        .maybeSingle();

      if (kepalaError) {
        console.error("Gagal mengambil kepala keluarga:", kepalaError);
        setError("Gagal mengambil informasi kepala keluarga.");
        setLoading(false);
        return;
      }

      kepala = kepalaData;
    }

    setKeluarga(keluargaData);
    setKepalaKeluarga(kepala);
    setAnggota(anggotaData ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      await loadData();

      if (cancelled) return;
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  async function handleRemoveMember(member: Jemaat) {
    if (member.id === keluarga?.kepala_keluarga_id) {
      setRemoveError(
        "Kepala keluarga harus diganti terlebih dahulu sebelum dikeluarkan.",
      );
      return;
    }

    setRemovingMemberId(member.id);
    setRemoveError("");
    setSuccess("");

    const supabase = createClient();

    const { data, error: updateError } = await supabase
      .from("jemaat")
      .update({ keluarga_id: null })
      .eq("id", member.id)
      .eq("keluarga_id", id)
      .neq("id", keluarga?.kepala_keluarga_id ?? -1)
      .select("id")
      .maybeSingle();

    if (updateError || !data) {
      console.error("Gagal mengeluarkan anggota:", updateError);

      setRemoveError(
        updateError
          ? "Gagal mengeluarkan anggota. Periksa izin Supabase dan coba lagi."
          : "Anggota tidak ditemukan dalam keluarga ini atau merupakan kepala keluarga.",
      );

      setRemovingMemberId(null);
      return;
    }

    setSelectedMember(null);
    setRemoveError("");
    setSuccess(`${member.nama_lengkap} berhasil dikeluarkan dari keluarga.`);
    setRemovingMemberId(null);

    await loadData();
  }

  async function openEditHeadModal() {
    setIsEditModalOpen(true);
    setSelectedKepalaId(keluarga?.kepala_keluarga_id?.toString() ?? "");
    setEditError("");
    setLoadingKepalaOptions(true);

    const supabase = createClient();

    const { data, error: optionsError } = await supabase
      .from("jemaat")
      .select("id, nama_lengkap")
      .eq("status_jemaat", "Aktif")
      .or(`keluarga_id.is.null,keluarga_id.eq.${id}`)
      .order("nama_lengkap", { ascending: true });

    if (optionsError) {
      console.error("Gagal mengambil pilihan kepala keluarga:", optionsError);
      setEditError("Gagal mengambil daftar jemaat aktif.");
      setKepalaOptions([]);
    } else {
      setKepalaOptions(data ?? []);
    }

    setLoadingKepalaOptions(false);
  }

  async function handleEditHead(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedKepalaId) {
      setEditError("Silakan pilih kepala keluarga.");
      return;
    }

    if (
      Number(selectedKepalaId) === keluarga?.kepala_keluarga_id
    ) {
      setIsEditModalOpen(false);
      return;
    }

    setSavingKepala(true);
    setEditError("");

    const supabase = createClient();

    const { error: rpcError } = await supabase.rpc(
      "ganti_kepala_keluarga",
      {
        p_keluarga_id: id,
        p_jemaat_id: Number(selectedKepalaId),
      },
    );

    if (rpcError) {
      console.error("Gagal mengganti kepala keluarga:", rpcError);

      setEditError(
        rpcError.message.includes("Kepala keluarga harus jemaat aktif")
          ? "Kepala keluarga harus berstatus aktif."
          : rpcError.message.includes("keluarga lain")
            ? "Jemaat sudah terhubung ke keluarga lain."
            : "Gagal mengubah kepala keluarga. Periksa izin Supabase dan coba lagi.",
      );

      setSavingKepala(false);
      return;
    }

    setIsEditModalOpen(false);
    setSavingKepala(false);
    setSuccess("Kepala keluarga berhasil diperbarui.");

    await loadData();
  }

  async function openAddMemberModal() {
    setIsModalOpen(true);
    setSelectedJemaatId("");
    setModalError("");
    setSuccess("");
    setLoadingOptions(true);

    const supabase = createClient();

    const { data, error: optionsError } = await supabase
      .from("jemaat")
      .select("id, nama_lengkap")
      // .eq("status_jemaat", "Aktif")
      .is("keluarga_id", null)
      .order("nama_lengkap", { ascending: true });

    if (optionsError) {
      console.error("Gagal mengambil daftar jemaat:", optionsError);
      setModalError("Gagal mengambil daftar jemaat aktif.");
      setJemaatOptions([]);
    } else {
      setJemaatOptions(data ?? []);
    }

    setLoadingOptions(false);
  }

  async function handleAddMember(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedJemaatId) {
      setModalError("Silakan pilih anggota jemaat.");
      return;
    }

    setSaving(true);
    setModalError("");

    const supabase = createClient();

    const { data, error: updateError } = await supabase
      .from("jemaat")
      .update({ keluarga_id: id })
      .eq("id", Number(selectedJemaatId))
      // 
    
      .is("keluarga_id", null)
      .select("id")
      .maybeSingle();

    if (updateError || !data) {
      console.error("Gagal menambahkan anggota:", updateError);
      setModalError(
        updateError
          ? "Gagal menambahkan anggota keluarga. Silakan coba lagi."
          : "Jemaat sudah terhubung ke keluarga lain atau statusnya tidak aktif.",
      );
      setSaving(false);
      return;
    }

    setSuccess("Anggota keluarga berhasil ditambahkan.");
    setIsModalOpen(false);
    setSaving(false);

    await loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Detail Keluarga
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Informasi kepala keluarga dan anggota jemaat.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/keluarga"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            Kembali
          </Link>

          <button
            type="button"
            onClick={() => void openEditHeadModal()}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Edit Keluarga
          </button>

          <button
            type="button"
            onClick={() => void openAddMemberModal()}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Tambah Anggota
          </button>
        </div>
      </div>

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400"
        >
          {success}
        </div>
      )}

      {removeError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
        >
          {removeError}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          Memuat data keluarga...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
        >
          {error}
        </div>
      ) : keluarga ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kepala Keluarga
              </p>
              <h2 className="mt-2 text-lg font-semibold text-gray-800 dark:text-white">
                {kepalaKeluarga?.nama_lengkap ?? "Belum ditentukan"}
              </h2>
              {kepalaKeluarga && (
                <Link
                  href={`/jemaat/${kepalaKeluarga.id}`}
                  className="mt-2 inline-block text-sm text-brand-500 hover:underline"
                >
                  Lihat detail jemaat
                </Link>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jumlah Anggota
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white">
                {anggota.length}
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Termasuk kepala keluarga jika sudah terhubung.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="font-semibold text-gray-800 dark:text-white">
                Daftar Anggota Keluarga
              </h2>
            </div>

            {anggota.length === 0 ? (
              <p className="p-5 text-sm text-gray-500 dark:text-gray-400">
                Belum ada jemaat yang terhubung ke keluarga ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 dark:bg-white/[0.02] dark:text-gray-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">Nama Lengkap</th>
                      <th className="px-5 py-3 font-medium">Jenis Kelamin</th>
                      <th className="px-5 py-3 font-medium">Tanggal Lahir</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {anggota.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-4 font-medium text-gray-800 dark:text-white">
                          {item.nama_lengkap}
                          {item.id === keluarga.kepala_keluarga_id && (
                            <span className="ml-2 text-xs text-brand-500">
                              Kepala Keluarga
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                          {item.jenis_kelamin === "L"
                            ? "Laki-laki"
                            : item.jenis_kelamin === "P"
                              ? "Perempuan"
                              : "-"}
                        </td>
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                          {item.tanggal_lahir
                            ? new Date(
                                `${item.tanggal_lahir}T00:00:00`,
                              ).toLocaleDateString("id-ID")
                            : "-"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={
                              item.status_jemaat === "Aktif"
                                ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            }
                          >
                            {item.status_jemaat}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/jemaat/${item.id}`}
                              className="font-medium text-brand-500 hover:underline"
                            >
                              Detail
                            </Link>

                            {item.id !== keluarga.kepala_keluarga_id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRemoveError("");
                                  setSelectedMember(item);
                                }}
                                disabled={removingMemberId !== null}
                                className="font-medium text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Keluarkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!saving) setIsModalOpen(false);
        }}
        className="max-w-lg p-6 sm:p-8"
      >
        <div className="mb-6 pr-10">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Tambah Anggota Keluarga
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pilih jemaat aktif yang belum terhubung ke keluarga.
          </p>
        </div>

        <form onSubmit={handleAddMember} className="space-y-5">
          <div>
            <label
              htmlFor="anggotaJemaat"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Anggota Jemaat <span className="text-red-500">*</span>
            </label>

            <select
              id="anggotaJemaat"
              value={selectedJemaatId}
              onChange={(event) => setSelectedJemaatId(event.target.value)}
              disabled={loadingOptions || saving || jemaatOptions.length === 0}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">
                {loadingOptions
                  ? "Memuat daftar jemaat..."
                  : jemaatOptions.length === 0
                    ? "Tidak ada jemaat yang tersedia"
                    : "Pilih anggota jemaat"}
              </option>

              {jemaatOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama_lengkap}
                </option>
              ))}
            </select>
          </div>

          {modalError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
            >
              {modalError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loadingOptions || saving || jemaatOptions.length === 0}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Tambah Anggota"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!savingKepala) setIsEditModalOpen(false);
        }}
        className="max-w-lg p-6 sm:p-8"
      >
        <div className="mb-6 pr-10">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Edit Keluarga
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pilih kepala keluarga baru dari jemaat aktif.
          </p>
        </div>

        <form onSubmit={handleEditHead} className="space-y-5">
          <div>
            <label
              htmlFor="kepalaKeluarga"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kepala Keluarga <span className="text-red-500">*</span>
            </label>

            <select
              id="kepalaKeluarga"
              value={selectedKepalaId}
              onChange={(event) => setSelectedKepalaId(event.target.value)}
              disabled={loadingKepalaOptions || savingKepala || kepalaOptions.length === 0}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">
                {loadingKepalaOptions
                  ? "Memuat daftar jemaat..."
                  : kepalaOptions.length === 0
                    ? "Tidak ada jemaat yang tersedia"
                    : "Pilih kepala keluarga"}
              </option>

              {kepalaOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama_lengkap}
                </option>
              ))}
            </select>
          </div>

          {editError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
            >
              {editError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={savingKepala}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                loadingKepalaOptions ||
                savingKepala ||
                kepalaOptions.length === 0
              }
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingKepala ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </Modal>

      {selectedMember && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-member-dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10">
                <TrashBinIcon size={22} />
              </div>

              <div>
                <h2
                  id="remove-member-dialog-title"
                  className="text-lg font-semibold text-gray-800 dark:text-white"
                >
                  Keluarkan Anggota
                </h2>

                <p className="text-sm text-gray-500">
                  Konfirmasi perubahan data keluarga
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
              Apakah kamu yakin ingin mengeluarkan anggota berikut dari
              keluarga ini?
              <br />
              <br />
              <strong>{selectedMember.nama_lengkap}</strong>
              <br />
              <br />
              Data jemaat tidak akan dihapus. Anggota hanya akan
              dilepaskan dari keluarga ini dan tetap tersimpan di
              database.
            </p>

            {removeError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
              >
                {removeError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={removingMemberId !== null}
                onClick={() => {
                  setSelectedMember(null);
                  setRemoveError("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={removingMemberId !== null}
                onClick={() => {
                  if (selectedMember) {
                    void handleRemoveMember(selectedMember);
                  }
                }}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removingMemberId === selectedMember.id
                  ? "Memproses..."
                  : "Ya, Keluarkan"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
