
import { createClient } from "@/lib/supabase/client";

export interface JemaatStatistik {
  id: number;
  nama_lengkap: string;
  tanggal_lahir: string | null;
  tanggal_bergabung: string | null;
  status_jemaat: string | null;
  jenis_kelamin: string | null;
  kategori_id: number | null;
  sektor_id: number | null;
}

export interface KategoriStatistik {
  id: number;
  nama_kategori: string;
}

export interface SektorStatistik {
  id: number;
  nama_sektor: string;
}

export interface StatistikData {
  jemaat: JemaatStatistik[];
  kategoris: KategoriStatistik[];
  sektors: SektorStatistik[];
}

const CACHE_DURATION = 5 * 60 * 1000;

let cachedData: StatistikData | null = null;
let cacheExpiresAt = 0;
let pendingRequest: Promise<StatistikData> | null = null;

export async function getStatistikData(): Promise<StatistikData> {
  if (cachedData && Date.now() < cacheExpiresAt) {
    return cachedData;
  }

  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = (async () => {
    const supabase = createClient();

    const [
      { data: jemaatData, error: jemaatError },
      { data: kategoriData, error: kategoriError },
      { data: sektorData, error: sektorError },
    ] = await Promise.all([
      supabase
        .from("jemaat")
        .select(
          "id, nama_lengkap, tanggal_lahir, tanggal_bergabung, status_jemaat, jenis_kelamin, kategori_id, sektor_id",
        ),
      supabase.from("kategori").select("id, nama_kategori"),
      supabase.from("sektor").select("id, nama_sektor"),
    ]);

    if (jemaatError) throw jemaatError;
    if (kategoriError) throw kategoriError;
    if (sektorError) throw sektorError;

    const data: StatistikData = {
      jemaat: (jemaatData ?? []) as JemaatStatistik[],
      kategoris: (kategoriData ?? []) as KategoriStatistik[],
      sektors: (sektorData ?? []) as SektorStatistik[],
    };

    cachedData = data;
    cacheExpiresAt = Date.now() + CACHE_DURATION;

    return data;
  })();

  try {
    return await pendingRequest;
  } finally {
    pendingRequest = null;
  }
}

export function invalidateStatistikCache(): void {
  cachedData = null;
  cacheExpiresAt = 0;
}
