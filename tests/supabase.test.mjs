import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PGlite } from '@electric-sql/pglite';

const migration = readFileSync(new URL('../supabase/migrations/20260915225255_sabom.sql', import.meta.url), 'utf8');

test('Supabase: importação, pedidos atômicos, pagamento, histórico e permissões', async () => {
  const pg = new PGlite();
  try {
    await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
    await pg.exec(migration);
    await pg.exec(readFileSync(new URL('../supabase/migrations/20260915225400_preparation.sql', import.meta.url), 'utf8'));
    const directory = mkdtempSync(join(tmpdir(), 'sabom-bootstrap-'));
    const output = join(directory, 'import.sql');
    execFileSync(process.execPath, ['scripts/bootstrap-supabase.mjs'], { env: { ...process.env, SABOM_EXPORT_PATH: output, SABOM_ADMIN_PASSWORD: 'test-password-only' } });
    const seed = readFileSync(output, 'utf8');
    await pg.exec(seed);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM dining_tables')).rows[0].n, 70);
    await assert.rejects(pg.exec(seed), /destino deve estar vazio/);
    await pg.exec('ROLLBACK');
    await pg.exec("INSERT INTO users (name, username, password_hash, role) VALUES ('Garçom', 'garcom', 'unused', 'WAITER'); SET ROLE service_role;");
    assert.equal((await pg.query("SELECT sabom_login_user('ADMIN')->>'username' AS username")).rows[0].username, 'admin');
    await assert.rejects(pg.exec("INSERT INTO users (name, username, password_hash, role) VALUES ('Duplicado', 'ADMIN', 'unused', 'ADMIN')"), /duplicate key/);
    await pg.exec("UPDATE dining_tables SET status = 'OCCUPIED', current_name = 'Cliente', opened_at = now() WHERE id = 1");
    const send = (items) => pg.query('SELECT sabom_send_order(1, 2, $1::jsonb) AS id', [JSON.stringify(items)]);
    await assert.rejects(send([{ id: 1, quantity: 2 }, { id: 99999, quantity: 1 }]), /não está mais disponível/);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM orders')).rows[0].n, 0);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM order_items')).rows[0].n, 0);
    await send([{ id: 1, quantity: 2, price: 0.01 }, { custom: true, name: 'Extra', price: 3.25, quantity: 2, destination: 'KITCHEN' }]);
    await send([{ id: 1, quantity: 1 }]);
    const details = (await pg.query('SELECT sabom_sent_order_details(1) AS orders')).rows[0].orders;
    assert.equal(details.length, 2);
    assert.equal(details[1].total, 42.5); // Catalog price is authoritative.
    assert.equal(details[1].items.length, 2);
    const itemId = (await pg.query('SELECT id FROM sabom_preparation ORDER BY id LIMIT 1')).rows[0].id;
    await pg.query("SELECT sabom_advance_preparation($1, 2, 'PENDING')", [itemId]);
    await assert.rejects(pg.query("SELECT sabom_advance_preparation($1, 2, 'PENDING')", [itemId]), /outro dispositivo/);
    await assert.rejects(pg.query("SELECT sabom_advance_preparation($1, 999, 'PREPARING')", [itemId]), /Usuário inválido/);
    await pg.query("SELECT sabom_advance_preparation($1, 2, 'PREPARING')", [itemId]);
    await pg.query("SELECT sabom_advance_preparation($1, 2, 'READY')", [itemId]);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM sabom_preparation WHERE id = $1', [itemId])).rows[0].n, 0);
    // Alterar o cardápio não muda valores de pedidos já enviados.
    await pg.exec("UPDATE products SET price = 22, active = 0 WHERE id = 1");
    await assert.rejects(send([{ id: 1, quantity: 1 }]), /não está mais disponível/);
    assert.equal(Number((await pg.query('SELECT total FROM sabom_table_summary WHERE id = 1')).rows[0].total), 60.5);
    await pg.exec("UPDATE products SET active = 1 WHERE id = 1");
    await pg.exec("SELECT sabom_checkout(1, 2, 'REQUEST')");
    await assert.rejects(send([{ id: 1, quantity: 1 }]), /não está aberta/);
    await assert.rejects(pg.exec("SELECT sabom_checkout(1, 2, 'CONFIRM')"), /Somente o administrador/);
    await pg.exec("SELECT sabom_checkout(1, 1, 'CONFIRM')");
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM sabom_preparation')).rows[0].n, 2); // Pagamento antecipado não apaga o preparo.
    const summary = (await pg.query('SELECT * FROM sabom_table_summary WHERE id = 1')).rows[0];
    assert.equal(summary.status, 'AVAILABLE');
    assert.equal(Number(summary.total), 0);
    const paid = (await pg.query('SELECT sabom_night_order_details() AS orders')).rows[0].orders;
    assert.equal(paid.length, 1);
    assert.equal(paid[0].order_count, 2);
    assert.equal(paid[0].total, 60.5);
    await pg.exec("UPDATE dining_tables SET status = 'OCCUPIED', current_name = 'Outro cliente' WHERE id = 1");
    await send([{ id: 1, quantity: 1 }]);
    const history = (await pg.query('SELECT sabom_night_order_details() AS orders')).rows[0].orders;
    assert.equal(history.length, 2);
    assert.equal(history[1].table_name, 'Cliente');
    for (const role of ['anon', 'authenticated']) {
      await pg.exec(`RESET ROLE; SET ROLE ${role}`);
      await assert.rejects(pg.query('SELECT * FROM sabom_preparation'), /permission denied/);
      await assert.rejects(pg.query("SELECT sabom_advance_preparation(1, 1, 'PENDING')"), /permission denied/);
      await assert.rejects(pg.query('SELECT * FROM users'), /permission denied/);
      await assert.rejects(pg.query("SELECT sabom_login_user('admin')"), /permission denied/);
      await assert.rejects(pg.query("SELECT sabom_checkout(1, 1, 'CONFIRM')"), /permission denied/);
      await assert.rejects(pg.query('SELECT * FROM sabom_night_orders'), /permission denied/);
    }
  } finally { await pg.close(); }
});
