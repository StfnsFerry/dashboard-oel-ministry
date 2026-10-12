"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "../common/ComponentCard";
import DatePicker from "@/components/form/date-picker";
import Select from "@/components/form/Select";

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
  nomor_surat_penyerahan_anak: string;
  nomor_surat_baptisan_air: string;
  nomor_surat_pernikahan: string;
  sektor_id: string;
  kategori_id: string;
};

const initialFormData: FormData = {
  nama_lengkap: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  alamat: "",
  golongan_darah: "",
  jenis_kelamin: "",
  tanggal_bergabung: "",
  nomor_surat_penyerahan_anak: "",
  nomor_surat_baptisan_air: "",
  nomor_surat_pernikahan: "",
  sektor_id: "",
  kategori_id: "",
};

export default function JemaatForm() {
  const router = useRouter();
  const supabase = createClient();

  const [sektor, setSektor] = useState<Sektor[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => {
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

      if (sektorResult.error || kategoriResult.error) {
        console.error(
          "Gagal mengambil data:",
          sektorResult.error,
          kategoriResult.error,
        );

        setError("Gagal mengambil data sektor atau kategori.");
        setLoadingData(false);
        return;
      }

      setSektor(sektorResult.data ?? []);
      setKategori(kategoriResult.data ?? []);
      setLoadingData(false);
    }

    fetchData();
  }, [supabase]);

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

  function handleJenisKelaminChange(value: string) {
    setFormData((current) => ({
      ...current,
      jenis_kelamin: value,
    }));
  }

  function handleGolonganDarahChange(value: string) {
    setFormData((current) => ({
      ...current,
      golongan_darah: value,
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

    const { error: insertError } = await supabase.from("jemaat").insert({
      nama_lengkap: formData.nama_lengkap.trim(),
      tempat_lahir: formData.tempat_lahir.trim() || null,
      tanggal_lahir: formData.tanggal_lahir || null,
      alamat: formData.alamat.trim() || null,
      golongan_darah: formData.golongan_darah || null,
      jenis_kelamin: formData.jenis_kelamin || null,
      tanggal_bergabung: formData.tanggal_bergabung || null,
      nomor_surat_penyerahan_anak:
        formData.nomor_surat_penyerahan_anak.trim() || null,
      nomor_surat_baptisan_air:
        formData.nomor_surat_baptisan_air.trim() || null,
      nomor_surat_pernikahan:
        formData.nomor_surat_pernikahan.trim() || null,
      sektor_id: Number(formData.sektor_id) || null,
      kategori_id: Number(formData.kategori_id) || null,
      status_jemaat: "Aktif",
    });

    if (insertError) {
      console.error("Gagal menambahkan jemaat:", insertError);

      setError(
        insertError.message || "Gagal menambahkan data jemaat.",
      );
      setLoading(false);
      return;
    }

    setSuccess("Data jemaat berhasil ditambahkan.");

    setFormData(initialFormData);

    setTimeout(() => {
      router.back();
      router.refresh();
    }, 1000);
  }

  const sektorOptions = sektor.map((item) => ({
    value: String(item.id),
    label: item.nama_sektor,
  }));

  function handleSektorChange(value: string) {
    setFormData((current) => ({
      ...current,
      sektor_id: value,
    }));
  }

  const kategoriOptions = kategori.map((item) => ({
    value: String(item.id),
    label: item.nama_kategori,
  }));

  function handleKategoriChange(value: string) {
    setFormData((current) => ({
      ...current,
      kategori_id: value,
    }));
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
                {/* Nama Lengkap */}
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

                {/* Tempat Lahir */}
                <div>
                  <Label>Tempat Lahir</Label>
                  <Input
                    name="tempat_lahir"
                    value={formData.tempat_lahir}
                    onChange={handleChange}
                    placeholder="Contoh: Bandar Lampung"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <DatePicker
                    id="tanggal-lahir"
                    label="Tanggal Lahir"
                    placeholder="Pilih tanggal lahir"
                    defaultDate={formData.tanggal_lahir || undefined}
                    onChange={(_dates, currentDateString) => {
                      setFormData((current) => ({
                        ...current,
                        tanggal_lahir: currentDateString,
                      }));
                    }}
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <Label>Jenis Kelamin</Label>
                  <Select
                    options={JenisKelaminOptions}
                    placeholder="Pilih jenis kelamin"
                    onChange={handleJenisKelaminChange}
                    className="dark:bg-dark-900"
                  />
                </div>

                {/* Golongan Darah */}
                <div>
                  <Label>Golongan Darah</Label>
                  <Select
                    options={GolonganDarahOptions}
                    placeholder="Pilih golongan darah"
                    onChange={handleGolonganDarahChange}
                    className="dark:bg-dark-900"
                  />
                </div>

                {/* Tanggal Bergabung */}
                {/* <div>
                  <DatePicker
                    id="tanggal-bergabung"
                    label="Tanggal Bergabung"
                    placeholder="Pilih tanggal bergabung"
                    defaultDate={formData.tanggal_bergabung || undefined}
                    onChange={(_dates, currentDateString) => {
                      setFormData((current) => ({
                        ...current,
                        tanggal_bergabung: currentDateString,
                      }));
                    }}
                  />
                </div> */}

                {/* Sektor */}
                <div>
                  <Label>Sektor</Label>

                  <Select
                    options={sektorOptions}
                    placeholder={
                      loadingData ? "Memuat sektor..." : "Pilih sektor"
                    }
                    onChange={handleSektorChange}
                    className="dark:bg-dark-900"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <Label>Kategori</Label>

                  <Select
                    options={kategoriOptions}
                    placeholder={
                      loadingData ? "Memuat kategori..." : "Pilih kategori"
                    }
                    onChange={handleKategoriChange}
                    className="dark:bg-dark-900"
                  />
                </div>

                {/* Alamat */}
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
            {/* Nomor Surat Penyerahan Anak */}
            <div>
              <Label>Nomor Surat Penyerahan Anak</Label>
              <Input
                name="nomor_surat_penyerahan_anak"
                value={formData.nomor_surat_penyerahan_anak}
                onChange={handleChange}
                placeholder="Masukkan nomor surat"
              />
            </div>

            {/* Nomor Surat Baptisan Air */}
            <div>
              <Label>Nomor Surat Baptisan Air</Label>
              <Input
                name="nomor_surat_baptisan_air"
                value={formData.nomor_surat_baptisan_air}
                onChange={handleChange}
                placeholder="Masukkan nomor surat"
              />
            </div>

            {/* Nomor Surat Pernikahan */}
            <div>
              <Label>Nomor Surat Pernikahan</Label>
              <Input
                name="nomor_surat_pernikahan"
                value={formData.nomor_surat_pernikahan}
                onChange={handleChange}
                placeholder="Masukkan nomor surat"
              />
            </div>
        

            {/* Buttons */}
            <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Batal
              </Button>

              <Button  
                disabled={loading || loadingData}
              >
                {loading ? "Menyimpan..." : "Simpan Jemaat"}
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </form>
  );
}