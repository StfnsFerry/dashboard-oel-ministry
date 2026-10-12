import { createClient } from '@/lib/supabase/server';

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sektor')
    .select('*')
    .order('id');

  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <pre>{error.message}</pre>
      </div>
    );
  }

  return (
    <div>
      <h1>Sektor</h1>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}