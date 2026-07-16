import { describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "fs";
import { join } from "path";

// Every column the app WRITES must exist in db/schema.sql.
//
// This test exists because two columns were missing from the schema and nobody
// noticed until the first real Supabase deploy: shops.address and products.tag.
// Demo mode (in-memory objects) happily accepted them, so every automated test
// passed while a real signup died with "Could not create the shop."
//
// The lists below mirror the .insert({...}) calls in src/server/services/.
// If you add a column to a write, add it here too — the test then tells you
// straight away that the schema needs it.

const schema = readFileSync(join(process.cwd(), "db/schema.sql"), "utf8");

async function db() {
  const p = new PGlite();
  await p.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
    create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  `);
  await p.exec(schema);
  return p;
}

async function columnsOf(p: PGlite, table: string): Promise<Set<string>> {
  const r = await p.query<{ column_name: string }>(
    `select column_name from information_schema.columns where table_name = $1`, [table]
  );
  return new Set(r.rows.map((x) => x.column_name));
}

// —— what src/server/services/*.ts actually inserts ——
const WRITES: Record<string, string[]> = {
  shops: ["slug","name","signup_source","promo_code","referred_by_shop","tagline","address","industry",
    "logo_text","logo_url","about_text","return_policy","return_policy_note","whatsapp","payment_note",
    "free_delivery_over","delivery_fee","delivery_zones","theme_color","banner_style","banner_image",
    "banner_heading","banner_subtext","is_active","trial_ends_at","subscription_status","plan"],
  products: ["shop_id","name","description","price","compare_at_price","cost_price","video_url",
    "size_chart_url","drop_at","stock","category","tag","image_urls","options","variant_stock","is_active"],
  orders: ["shop_id","customer_name","customer_phone","customer_email","address","city","payment_method",
    "subtotal","delivery_fee","total","discount","referred_by","referral_rewarded","reseller_code",
    "discount_code","payment_state","status"],
  order_items: ["order_id","product_id","name","price","quantity"],
  app_users: ["email","full_name","shop_id","role","password_hash"],
  page_views: ["shop_id","product_id","kind","source"],
};

describe("schema covers every column the app writes", () => {
  for (const [table, cols] of Object.entries(WRITES)) {
    it(`${table} has all ${cols.length} written columns`, async () => {
      const p = await db();
      const have = await columnsOf(p, table);
      const missing = cols.filter((c) => !have.has(c));
      expect(missing, `missing from db/schema.sql: ${missing.join(", ")}`).toEqual([]);
    });
  }

  // The plan enum was left on the OLD names (starter/growth) after the code
  // renamed them, so every admin plan change failed on a real database.
  it("accepts every plan name the code uses", async () => {
    const p = await db();
    const shop = await p.query<{ id: string }>(
      `insert into shops (slug,name,whatsapp) values ('p','P','923001234567') returning id`
    );
    for (const plan of ["trial", "basic", "pro", "premium"]) {
      await expect(
        p.query(`update shops set plan = $1 where id = $2`, [plan, shop.rows[0].id])
      ).resolves.toBeDefined();
    }
  });

  // The role check only allowed seller/admin, so the Team feature (staff logins)
  // failed on a real database.
  it("accepts every user role the code uses", async () => {
    const p = await db();
    const shop = await p.query<{ id: string }>(
      `insert into shops (slug,name,whatsapp) values ('r','R','923001234567') returning id`
    );
    for (const role of ["seller", "staff", "admin"]) {
      await expect(
        p.query(
          `insert into app_users (email, full_name, shop_id, role, password_hash)
           values ($1,'N',$2,$3,'scrypt$a$b')`,
          [`${role}@t.pk`, shop.rows[0].id, role]
        )
      ).resolves.toBeDefined();
    }
  });

  it("a full signup → product → order flow runs on a real database", async () => {
    const p = await db();
    const shop = await p.query<{ id: string }>(`
      insert into shops (slug,name,address,whatsapp,delivery_fee,delivery_zones,banner_style,is_active,
        trial_ends_at,subscription_status)
      values ('t-shop','Test Shop','Karachi, PK','923001234567',0,'[]'::jsonb,'none',true,
        now() + interval '14 days','active') returning id`);
    const shopId = shop.rows[0].id;

    await p.query(`insert into app_users (email, full_name, shop_id, role, password_hash)
      values ('t@shop.pk','T',$1,'seller','scrypt$a$b')`, [shopId]);

    await p.query(`insert into products (shop_id,name,price,stock,category,tag,image_urls,options,is_active)
      values ($1,'Lawn Suit',4500,10,'Dresses','New','{}'::text[],'[]'::jsonb,true)`, [shopId]);

    const o = await p.query<{ id: string; order_number: number }>(`
      insert into orders (shop_id,customer_name,customer_phone,address,city,payment_method,
        subtotal,delivery_fee,total,status)
      values ($1,'Sadia','923331234567','Street 1','Karachi','cod',4500,0,4500,'new')
      returning id, order_number`, [shopId]);
    await p.query(`insert into order_items (order_id, name, price, quantity)
      values ($1,'Lawn Suit',4500,1)`, [o.rows[0].id]);

    const back = await p.query<{ address: string }>(`select address from shops where slug='t-shop'`);
    expect(back.rows[0].address).toBe("Karachi, PK");
    expect(Number(o.rows[0].order_number)).toBeGreaterThan(0);
  });
});
