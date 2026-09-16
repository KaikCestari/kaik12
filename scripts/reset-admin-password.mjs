import { createClient } from '@supabase/supabase-js';
import { randomBytes, scryptSync } from 'node:crypto';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SABOM_ADMIN_PASSWORD;

if (!url || !key) {
  console.error('Configure SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local ou no ambiente do servidor. Não use NEXT_PUBLIC_.');
  process.exitCode = 1;
} else if (!password || password.length < 8) {
  console.error('Defina SABOM_ADMIN_PASSWORD com pelo menos 8 caracteres para redefinir o login do admin.');
  process.exitCode = 1;
} else {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const salt = randomBytes(16).toString('hex');
  const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;

  try {
    const { data: existing, error: findError } = await client.from('users').select('id').ilike('username', 'admin').maybeSingle();
    if (findError) throw new Error(`Falha ao localizar o usuário admin (${findError.code || 'indisponível'}).`);

    if (existing) {
      const { error } = await client.from('users').update({ name: 'Administrador', username: 'admin', password_hash: passwordHash, role: 'ADMIN', active: 1 }).eq('id', existing.id);
      if (error) throw new Error(`Falha ao atualizar o usuário admin (${error.code || 'indisponível'}).`);
      console.log('Senha do usuário admin redefinida com sucesso.');
    } else {
      const { error } = await client.from('users').insert({ id: 1, name: 'Administrador', username: 'admin', password_hash: passwordHash, role: 'ADMIN', active: 1 });
      if (error) throw new Error(`Falha ao criar o usuário admin (${error.code || 'indisponível'}).`);
      console.log('Usuário admin criado e senha definida com sucesso.');
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Falha ao redefinir o login do admin.');
    process.exitCode = 1;
  }
}