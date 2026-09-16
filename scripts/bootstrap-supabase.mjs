// Generates a transactional SQL import; never changes the source database.
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const output = resolve(process.env.SABOM_EXPORT_PATH || 'data/supabase-import.sql');
const tables = ['users', 'categories', 'products', 'dining_tables', 'orders', 'order_items'];
const rows = {};
{
  const password = process.env.SABOM_ADMIN_PASSWORD;
  if (!password || password.length < 8) throw new Error('Defina SABOM_ADMIN_PASSWORD com pelo menos 8 caracteres.');
  const salt = randomBytes(16).toString('hex');
  rows.users = [{ id: 1, name: 'Administrador', username: 'admin', password_hash: `${salt}:${scryptSync(password, salt, 64).toString('hex')}`, role: 'ADMIN', active: 1 }];
  rows.categories = ['Lanches', 'Porções', 'Bebidas'].map((name, i) => ({ id: i + 1, name }));
  rows.products = [
    [1, 'X-Burguer', 18, 'KITCHEN'], [1, 'X-Salada', 21, 'KITCHEN'],
    [1, 'X-Bacon', 24, 'KITCHEN'], [1, 'X-Tudo', 28, 'KITCHEN'],
    [2, 'Batata frita', 19, 'KITCHEN'], [2, 'Calabresa acebolada', 27, 'KITCHEN'],
    [3, 'Refrigerante lata', 6, 'BAR'], [3, 'Suco natural', 9, 'BAR'],
    [3, 'Água mineral', 4, 'BAR'], [3, 'Cerveja long neck', 10, 'BAR'],
  ].map(([category_id, name, price, destination], i) => ({ id: i + 1, category_id, name, price, destination }));
  rows.dining_tables = Array.from({ length: 70 }, (_, i) => ({ id: i + 1, number: i + 1 }));
  rows.orders = []; rows.order_items = [];
}
const literal = (value) => value == null ? 'NULL' : typeof value === 'number' ? String(value) : "'" + String(value).replaceAll("'", "''") + "'";
const sql = ['BEGIN;', "SET LOCAL timezone = 'UTC';", "SET LOCAL standard_conforming_strings = on;", `LOCK TABLE ${tables.map(t => `public.${t}`).join(', ')} IN ACCESS EXCLUSIVE MODE;`, `DO $$ BEGIN IF ${tables.map(t => `EXISTS (SELECT 1 FROM public.${t})`).join(' OR ')} THEN RAISE EXCEPTION 'O destino deve estar vazio. Nenhum dado foi importado.'; END IF; END $$;`];
for (const table of tables) {
  for (const row of rows[table]) {
    if (table === 'orders' && !('table_name' in row)) row.table_name = rows.dining_tables.find(t => t.id === row.table_id)?.current_name ?? null;
    const columns = Object.keys(row);
    sql.push(`INSERT INTO public.${table} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${columns.map(c => literal(row[c])).join(', ')});`);
  }
  sql.push(`SELECT setval(pg_get_serial_sequence('public.${table}', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM public.${table};`);
}
sql.push('COMMIT;');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, sql.join('\n') + '\n', { mode: 0o600, flag: 'wx' });
console.log(`Inicialização preparada: ${output}.`);
