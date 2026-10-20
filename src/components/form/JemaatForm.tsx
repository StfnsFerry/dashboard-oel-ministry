
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import Select from "@/components/form/Select";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import { createClient } from "@/lib/supabase/client";
import { invalidateStatistikCache } from "@/lib/cache/StatistikCache";

type Sektor = {
  id: number;
  nama_sektor: string;
};

type Kategori = {
  id: number;
  nama_kategori: string;
};

type FormData = {
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  golongan_darah: string;
  jenis_kelamin: string;
  tanggal_bergabung: string;
  nomor_hp: string;
  nomor_surat_penyerahan_anak: string;
  nomor_surat_baptisan_air: string;
  nomor_surat_pernikahan: string;
  status_jemaat: string;
  tanggal_kematian: string;
  sektor_id: string;
  kategori_id: string;
};

type JemaatFormProps = {
  jemaatId?: string;
};

const initialFormData: FormData = {
  nama_lengkap: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  alamat: "",
  golongan_darah: "",
  jenis_kelamin: "",
  tanggal_bergabung: "",
  nomor_hp: "",
  nomor_surat_penyerahan_anak: "",
  nomor_surat_baptisan_air: "",
  nomor_surat_pernikahan: "",
  status_jemaat: "",
  tanggal_kematian: "",
  sektor_id: "",
  kategori_id: "",
};

const JenisKelaminOptions = [
  { value: "L", label: "Laki-laki" },
  { value: "P", label: "Perempuan" },
];

const GolonganDarahOptions = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
];

const StatusJemaatOptions = [
  { value: "Aktif", label: "Aktif" },
  { value: "Tidak Aktif", label: "Tidak Aktif" },
  { value: "Meninggal", label: "Meninggal" },
  { value: "Pindah", label: "Pindah" },
]

export default function JemaatForm({ jemaatId }: JemaatFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isEdit = Boolean(jemaatId);

  const [sektor, setSektor] = useState<Sektor[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoadingData(true);
      setError("");

      const [sektorResult, kategoriResult] = await Promise.all([
        supabase
          .from("sektor")
          .select("id, nama_sektor")
          .order("nama_sektor"),
        supabase
          .from("kategori")
          .select("id, nama_kategori")
          .order("nama_kategori"),
      ]);

      if (cancelled) return;

      if (sektorResult.error || kategoriResult.error) {
        console.error(
          "Gagal mengambil data referensi:",
          sektorResult.error,
          kategoriResult.error,
        );

        setError("Gagal mengambil data sektor atau kategori.");
        setLoadingData(false);
        return;
      }

      setSektor(sektorResult.data ?? []);
      setKategori(kategoriResult.data ?? []);

      if (jemaatId) {
        const { data, error: fetchError } = await supabase
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
            nomor_hp,
            nomor_surat_penyerahan_anak,
            nomor_surat_baptisan_air,
            nomor_surat_pernikahan,
            status_jemaat,
            tanggal_kematian,
            sektor_id,
            kategori_id
          `)
          .eq("id", jemaatId)
          .maybeSingle();

        if (cancelled) return;

        if (fetchError || !data) {
          console.error("Gagal mengambil data jemaat:", fetchError);

          setError(
            fetchError
              ? "Gagal mengambil data jemaat."
              : "Data jemaat tidak ditemukan.",
          );
          setLoadingData(false);
          return;
        }

        setFormData({
          nama_lengkap: data.nama_lengkap ?? "",
          tempat_lahir: data.tempat_lahir ?? "",
          tanggal_lahir: data.tanggal_lahir ?? "",
          alamat: data.alamat ?? "",
          golongan_darah: data.golongan_darah ?? "",
          jenis_kelamin: data.jenis_kelamin ?? "",
          tanggal_bergabung: data.tanggal_bergabung ?? "",
          nomor_hp: data.nomor_hp ?? "",
          nomor_surat_penyerahan_anak:
            data.nomor_surat_penyerahan_anak ?? "",
          nomor_surat_baptisan_air: data.nomor_surat_baptisan_air ?? "",
          nomor_surat_pernikahan: data.nomor_surat_pernikahan ?? "",
          status_jemaat: data.status_jemaat ?? "",
          tanggal_kematian: data.tanggal_kematian ?? "",
          sektor_id:
            data.sektor_id != null ? String(data.sektor_id) : "",
          kategori_id:
            data.kategori_id != null ? String(data.kategori_id) : "",
        });
      }
      setLoadingData(false);
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [supabase, jemaatId]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFieldChange(name: keyof FormData, value: string) {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    if (!formData.nama_lengkap.trim()) {
      setError("Nama lengkap wajib diisi.");
      setLoading(false);
      return;
    }

    if (!formData.sektor_id) {
      setError("Sektor wajib dipilih.");
      setLoading(false);
      return;
    }

    if (!formData.kategori_id) {
      setError("Kategori wajib dipilih.");
      setLoading(false);
      return;
    }

    const payload = {
      nama_lengkap: formData.nama_lengkap.trim(),
      tempat_lahir: formData.tempat_lahir.trim() || null,
      tanggal_lahir: formData.tanggal_lahir || null,
      alamat: formData.alamat.trim() || null,
      golongan_darah: formData.golongan_darah || null,
      jenis_kelamin: formData.jenis_kelamin || null,
      tanggal_bergabung: formData.tanggal_bergabung || null,
      nomor_hp: formData.nomor_hp || null,
      nomor_surat_penyerahan_anak:
        formData.nomor_surat_penyerahan_anak.trim() || null,
      nomor_surat_baptisan_air:
        formData.nomor_surat_baptisan_air.trim() || null,
      nomor_surat_pernikahan:
        formData.nomor_surat_pernikahan.trim() || null,
      status_jemaat: formData.status_jemaat || null,
      tanggal_kematian: formData.tanggal_kematian || null,
      sektor_id: Number(formData.sektor_id),
      kategori_id: Number(formData.kategori_id),
    };

    const result = jemaatId
      ? await supabase
          .from("jemaat")
          .update(payload)
          .eq("id", jemaatId)
          .select("id")
          .maybeSingle()
      : await supabase
          .from("jemaat")
          .insert({
            ...payload,
          })
          .select("id")
          .single();

    if (result.error) {
      console.error("Gagal menyimpan jemaat:", result.error);
      setError(
        result.error.message || "Gagal menyimpan data jemaat.",
      );
      setLoading(false);
      return;
    }
    invalidateStatistikCache();
    
    if (!result.data) {
      setError(
        "Data tidak berhasil diperbarui. Periksa ID jemaat dan kebijakan akses Supabase.",
      );
      setLoading(false);
      return;
    }

    setSuccess(
      isEdit
        ? "Data jemaat berhasil diperbarui."
        : "Data jemaat berhasil ditambahkan.",
    );

    if (!isEdit) {
      setFormData(initialFormData);
    }
    
    setLoading(false);

    window.setTimeout(() => {
      router.back();
      router.refresh();
    }, 800);
  }

  const sektorOptions = sektor.map((item) => ({
    value: String(item.id),
    label: item.nama_sektor,
  }));

  const kategoriOptions = kategori.map((item) => ({
    value: String(item.id),
    label: item.nama_kategori,
  }));

  if (loadingData) {
    return (
      <ComponentCard title={isEdit ? "Edit Jemaat" : "Tambah Jemaat"}>
        <p className="text-sm text-gray-500">
          Memuat data jemaat...
        </p>
      </ComponentCard>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Biodata Jemaat">
            {error && (
              <div className="mb-5">
                <Alert
                  variant="error"
                  title="Gagal"
                  message={error}
                  showLink={false}
                />
              </div>
            )}

            {success && (
              <div className="mb-5">
                <Alert
                  variant="success"
                  title="Berhasil"
                  message={success}
                  showLink={false}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Nama Lengkap *</Label>
                <Input
                  name="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div>
                <Label>Tempat Lahir</Label>
                <Input
                  name="tempat_lahir"
                  value={formData.tempat_lahir}
                  onChange={handleChange}
                  placeholder="Contoh: Bandar Lampung"
                />
              </div>

              <div>
                <DatePicker
                  key={`tanggal-lahir-${loadingData ? "loading" : "loaded"}`}
                  id="tanggal-lahir"
                  label="Tanggal Lahir"
                  placeholder="Pilih tanggal lahir"
                  defaultDate={formData.tanggal_lahir || undefined}
                  onChange={(_dates, currentDateString) => {
                    handleFieldChange(
                      "tanggal_lahir",
                      currentDateString,
                    );
                  }}
                />
              </div>

              <div>
                <Label>Jenis Kelamin</Label>
                <Select
                  options={JenisKelaminOptions}
                  placeholder="Pilih jenis kelamin"
                  value={formData.jenis_kelamin}
                  onChange={(value) =>
                    handleFieldChange("jenis_kelamin", value)
                  }
                  className="dark:bg-dark-900"
                />
              </div>

              <div>
                <Label>Golongan Darah</Label>
                <Select
                  options={GolonganDarahOptions}
                  placeholder="Pilih golongan darah"
                  value={formData.golongan_darah}
                  onChange={(value) =>
                    handleFieldChange("golongan_darah", value)
                  }
                  className="dark:bg-dark-900"
                />
              </div>

              <div>
                <Label>Sektor</Label>
                <Select
                  options={sektorOptions}
                  placeholder="Pilih sektor"
                  value={formData.sektor_id}
                  onChange={(value) =>
                    handleFieldChange("sektor_id", value)
                  }
                  className="dark:bg-dark-900"
                />
              </div>

              <div>
                <Label>Kategori</Label>
                <Select
                  options={kategoriOptions}
                  placeholder="Pilih kategori"
                  value={formData.kategori_id}
                  onChange={(value) =>
                    handleFieldChange("kategori_id", value)
                  }
                  className="dark:bg-dark-900"
                />
              </div>
                 
              <DatePicker
                key={`tanggal-bergabung-${loadingData ? "loading" : "loaded"}`}
                id="tanggal-bergabung"
                label="Tanggal Bergabung"
                placeholder="Pilih tanggal bergabung"
                defaultDate={formData.tanggal_bergabung || undefined}
                onChange={(_dates, currentDateString) => {
                  handleFieldChange(
                    "tanggal_bergabung",
                    currentDateString,
                  );
                }}
              />

              <div>
                <Label>Nomor HP</Label>
                <Input
                  name="nomor_hp"
                  value={formData.nomor_hp}
                  onChange={handleChange}
                  placeholder="Masukkan Nomor HP"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label>Alamat</Label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap"
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Dokumen Jemaat">
            <div className="space-y-5">
              <div>
                <Label>Nomor Surat Penyerahan Anak</Label>
                <Input
                  name="nomor_surat_penyerahan_anak"
                  value={formData.nomor_surat_penyerahan_anak}
                  onChange={handleChange}
                  placeholder="Masukkan nomor surat"
                />
              </div>

              <div>
                <Label>Nomor Surat Baptisan Air</Label>
                <Input
                  name="nomor_surat_baptisan_air"
                  value={formData.nomor_surat_baptisan_air}
                  onChange={handleChange}
                  placeholder="Masukkan nomor surat"
                />
              </div>

              <div>
                <Label>Nomor Surat Pernikahan</Label>
                <Input
                  name="nomor_surat_pernikahan"
                  value={formData.nomor_surat_pernikahan}
                  onChange={handleChange}
                  placeholder="Masukkan nomor surat"
                />
              </div>
            </div>
          </ComponentCard>
          <div className="space-y-6">
            <ComponentCard title="Status Jemaat">
              <div className="space-y-5">
                <div>
                  <Label>Status</Label>
                  <Select
                    options={StatusJemaatOptions}
                    placeholder="Pilih Status jemaat"
                    value={formData.status_jemaat}
                    onChange={(value) =>
                      handleFieldChange("status_jemaat", value)
                    }
                    className="dark:bg-dark-900"
                  />
                </div>
              </div>
              {formData.status_jemaat === "Meninggal Dunia" && (
              <div className="space-y-6">
                <DatePicker
                  key={`tanggal-kematian-${loadingData ? "loading" : "loaded"}`}
                  id="tanggal-kematian"
                  label="Tanggal kematian"
                  placeholder="Pilih tanggal kematian"
                  defaultDate={formData.tanggal_kematian || undefined}
                  onChange={(_dates, currentDateString) => {
                    handleFieldChange(
                      "tanggal_kematian",
                      currentDateString,
                    );
                  }}
                />
              </div>
              )}
              <div className="mt-15 flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Batal
                </Button>

                <Button disabled={loading || loadingData}>
                  {loading
                    ? "Menyimpan..."
                    : isEdit
                      ? "Simpan Perubahan"
                      : "Simpan Jemaat"}
                </Button>
              </div>
            </ComponentCard>
          </div>

        </div>
      </div>
    </form>
  );
}
