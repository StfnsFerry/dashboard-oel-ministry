
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
// import Image from "next/image";
import { PencilIcon } from "@/icons";

import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { createClient } from "@/lib/supabase/client";

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  location: string;
};

const initialForm: ProfileForm = {
  firstName: "",
  lastName: "",
  phone: "",
  bio: "",
  location: "",
};

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState<ProfileForm>(initialForm);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;

      const user = data.user;

      if (!user) {
        throw new Error("Pengguna belum login.");
      }

      const metadata = user.user_metadata ?? {};
      const fullName =
        typeof metadata.full_name === "string"
          ? metadata.full_name
          : "";

      const firstName =
        typeof metadata.first_name === "string"
          ? metadata.first_name
          : fullName.split(" ")[0] ?? "";

      const lastName =
        typeof metadata.last_name === "string"
          ? metadata.last_name
          : fullName.split(" ").slice(1).join(" ");

      setEmail(user.email ?? "");
      setFormData({
        firstName,
        lastName,
        phone:
          typeof metadata.phone_number === "string"
            ? metadata.phone_number
            : "",
        bio: typeof metadata.bio === "string" ? metadata.bio : "",
        location:
          typeof metadata.location === "string"
            ? metadata.location
            : "",
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat profil pengguna.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleFieldChange = (
    field: keyof ProfileForm,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleOpenModal = () => {
    setError("");
    setSuccess("");
    openModal();
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const fullName = [
        formData.firstName.trim(),
        formData.lastName.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const { data, error: authError } =
        await supabase.auth.updateUser({
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: fullName,
            phone_number: formData.phone.trim(),
            bio: formData.bio.trim(),
            location: formData.location.trim(),
          },
        });

      if (authError) throw authError;

      const metadata = data.user.user_metadata ?? {};

      setFormData({
        firstName:
          typeof metadata.first_name === "string"
            ? metadata.first_name
            : "",
        lastName:
          typeof metadata.last_name === "string"
            ? metadata.last_name
            : "",
        phone:
          typeof metadata.phone_number === "string"
            ? metadata.phone_number
            : "",
        bio: typeof metadata.bio === "string" ? metadata.bio : "",
        location:
          typeof metadata.location === "string"
            ? metadata.location
            : "",
      });

      setEmail(data.user.email ?? "");
      setSuccess("Profil berhasil diperbarui.");
      closeModal();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan perubahan profil.",
      );
    } finally {
      setSaving(false);
    }
  };

  const fullName =
    [formData.firstName, formData.lastName]
      .filter(Boolean)
      .join(" ") || "Pengguna";

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
        <p className="text-sm text-gray-500">
          Memuat profil pengguna...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
        <div className="flex flex-col gap-5 sm:flex-row xl:gap-10">
          <div className="flex-1">
            <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* <div className="overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
                <Image
                  src="/images/user/owner.png"
                  width={80}
                  height={80}
                  className="size-20 object-cover"
                  alt="Foto profil"
                />
              </div> */}

              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {fullName}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.location || "Lokasi belum diatur"}
                </p>
              </div>
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-500">{error}</p>
            )}

            {success && (
              <p className="mb-4 text-sm text-green-600">{success}</p>
            )}

            <div className="grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="mb-2 text-xs text-gray-500">Nama Depan</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formData.firstName || "-"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs text-gray-500">Nama Belakang</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formData.lastName || "-"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs text-gray-500">Email</p>
                <p className="break-all text-sm font-medium text-gray-800 dark:text-white/90">
                  {email || "-"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs text-gray-500">Nomor Telepon</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formData.phone || "-"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs text-gray-500">Bio</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formData.bio || "-"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleOpenModal}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <PencilIcon className="size-5" />
              Edit
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="m-4 max-w-[700px]"
      >
        <div className="relative w-full max-w-[700px] rounded-3xl bg-white p-4 lg:p-11 dark:bg-gray-900">
          <div className="px-2 pe-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Perbarui informasi profil akun Anda.
            </p>
          </div>

          <form onSubmit={handleSave} className="flex flex-col">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-2 pb-3 lg:grid-cols-2">
              <div>
                <Label>Nama Depan</Label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(event) =>
                    handleFieldChange("firstName", event.target.value)
                  }
                  placeholder="Nama depan"
                />
              </div>

              <div>
                <Label>Nama Belakang</Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(event) =>
                    handleFieldChange("lastName", event.target.value)
                  }
                  placeholder="Nama belakang"
                />
              </div>

              <div className="lg:col-span-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  onChange={() => undefined}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email akun ditampilkan dari Supabase Auth dan tidak
                  diubah melalui formulir ini.
                </p>
              </div>

              <div className="lg:col-span-2">
                <Label>Nomor Telepon</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) =>
                    handleFieldChange("phone", event.target.value)
                  }
                  placeholder="Contoh: 081234567890"
                />
              </div>

              <div className="lg:col-span-2">
                <Label>Lokasi</Label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(event) =>
                    handleFieldChange("location", event.target.value)
                  }
                  placeholder="Contoh: Lampung, Indonesia"
                />
              </div>

              <div className="lg:col-span-2">
                <Label>Bio</Label>
                <Input
                  type="text"
                  value={formData.bio}
                  onChange={(event) =>
                    handleFieldChange("bio", event.target.value)
                  }
                  placeholder="Deskripsi singkat"
                />
              </div>
            </div>

            {error && (
              <p className="px-2 pt-3 text-sm text-red-500">{error}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 px-2">
              <Button
                size="sm"
                variant="outline"
                onClick={closeModal}
              >
                Batal
              </Button>
              <Button size="sm" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
