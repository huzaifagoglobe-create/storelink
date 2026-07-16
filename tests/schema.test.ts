import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "fs";
import { join } from "path";

// These tests run db/schema.sql against a REAL PostgreSQL engine (PGlite).
// They exist because two genuine bugs shipped undetected until someone tried
// it on Supabase for the first time:
//   1. `alter table reviews ...` ran BEFORE `create table reviews` -> hard fail
//      on any fresh database.
//   2. Triggers and policies used plain CREATE, so running the file twice blew
//      up halfway and left people unsure if their database was half-built.

const schema = readFileSync(join(process.cwd(), "db/schema.sql"), "utf8");

async function freshDb() {
  const db = new PGlite();
  // Supabase provides these; a bare Postgres does not.
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
    create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  `);
  return db;
}

describe("db/schema.sql", () => {
  it("runs clean on a brand-new database", async () => {
    const db = await freshDb();
    await expect(db.exec(schema)).resolves.toBeDefined();
    const t = await db.query<{ n: number }>(
      `select count(*)::int n from pg_tables where schemaname='public'`
    );
    expect(t.rows[0].n).toBe(24);
  });

  it("can be run repeatedly without errors or duplicates", async () => {
    const db = await freshDb();
    await db.exec(schema);
    await db.exec(schema);
    await db.exec(schema);
    const tr = await db.query<{ n: number }>(
      `select count(*)::int n from pg_trigger where not tgisinternal`
    );
    const p = await db.query<{ n: number }>(
      `select count(*)::int n from pg_policies where schemaname='public'`
    );
    expect(tr.rows[0].n).toBe(3);
    expect(p.rows[0].n).toBe(12);
  });

  it("creates the reviews.photos column (the ordering bug)", async () => {
    const db = await freshDb();
    await db.exec(schema);
    const c = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_name='reviews'`
    );
    expect(c.rows.map((r) => r.column_name)).toContain("photos");
  });

  it("turns on row level security with policies", async () => {
    const db = await freshDb();
    await db.exec(schema);
    const r = await db.query<{ n: number }>(
      `select count(*)::int n from pg_tables where schemaname='public' and rowsecurity=true`
    );
    expect(r.rows[0].n).toBeGreaterThanOrEqual(11);
  });

  it("dec_stock cannot oversell the last item", async () => {
    const db = await freshDb();
    await db.exec(schema);
    const uid = (await db.query<{ id: string }>(`insert into auth.users (email) values ('t@t.pk') returning id`)).rows[0].id;
    await db.query(`insert into profiles (id) values ($1)`, [uid]);
    const sid = (await db.query<{ id: string }>(
      `insert into shops (owner_id, slug, name, whatsapp) values ($1,'zara','Zara','923001234567') returning id`, [uid]
    )).rows[0].id;
    const pid = (await db.query<{ id: string }>(
      `insert into products (shop_id, name, price, stock) values ($1,'Lawn Suit',4500,1) returning id`, [sid]
    )).rows[0].id;

    const first = await db.query<{ ok: boolean }>(`select dec_stock($1,$2,1) as ok`, [pid, sid]);
    const second = await db.query<{ ok: boolean }>(`select dec_stock($1,$2,1) as ok`, [pid, sid]);
    expect(first.rows[0].ok).toBe(true);
    expect(second.rows[0].ok).toBe(false); // the whole point
    const left = await db.query<{ stock: number }>(`select stock from products where id=$1`, [pid]);
    expect(left.rows[0].stock).toBe(0);
  });

  it("rl_hit enforces its limit", async () => {
    const db = await freshDb();
    await db.exec(schema);
    let allowed = 0;
    for (let i = 0; i < 8; i++) {
      const r = await db.query<{ ok: boolean }>(`select rl_hit('login:1.2.3.4', 5, 900) as ok`);
      if (r.rows[0].ok) allowed++;
    }
    expect(allowed).toBe(5);
  });
});
