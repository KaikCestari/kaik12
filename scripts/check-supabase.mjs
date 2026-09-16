import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Configure SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local ou no ambiente do servidor. Não use NEXT_PUBLIC_.');
  process.exitCode = 1;
} else {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    for (const table of ['users', 'sessions', 'categories', 'products', 'dining_tables', 'orders', 'order_items']) {
      const { error, count } = await client.from(table).select('*', { count: 'exact', head: true });
      if (error) throw new Error(`Falha ao acessar ${table} (código ${error.code || 'indisponível'}).`);
      console.log(`${table}: conexão OK (${count} registros)`);
    }
    for (const view of ['sabom_table_summary', 'sabom_active_products', 'sabom_sent_orders', 'sabom_night_orders', 'sabom_preparation']) {
      const { error } = await client.from(view).select('*', { head: true }).limit(1);
      if (error) throw new Error(`Falha ao acessar ${view} (código ${error.code || 'indisponível'}).`);
    }
    console.log('Conexão e views validadas sem alterar dados.');
  } catch {
    console.error('Falha na conexão ou no acesso ao schema. Confira URL, chave secreta e migrations no projeto.');
    process.exitCode = 1;
  }
}
