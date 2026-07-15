-- ============================================================================
-- Sample data for local testing. Matches the built-in demo data so the app
-- behaves the same whether or not Supabase is connected.
-- ============================================================================
insert into shops (slug, name, tagline, logo_text, whatsapp, payment_note, free_delivery_over, delivery_fee, currency, plan, is_active)
values
  ('zara', 'Zara Boutique', 'Online · replies fast', 'ZB', '923001234567',
   'JazzCash / Easypaisa: 0300 1234567 (title: Zara Boutique)', 3000, 200, 'PKR', 'growth', true)
on conflict (slug) do nothing;

insert into products (shop_id, name, description, price, compare_at_price, stock, category, is_active)
select s.id, p.name, p.description, p.price, p.compare_at_price, p.stock, p.category, true
from shops s
cross join (values
  ('Lawn Suit (3pc)',     'Unstitched premium lawn, 3 pieces. Soft, breathable and summer-ready. Dupatta included.', 4500, 5500, 12, 'Dresses'),
  ('Embroidered Kurti',   'Hand-embroidered cotton kurti with detailed neckline work.',                              2200, null, 5,  'Tops'),
  ('Printed Shawl',       'Lightweight printed shawl, perfect for everyday wear.',                                   3800, null, 8,  'Accessories'),
  ('Block Heels',         'Comfortable block heels with cushioned sole.',                                           5900, 6900, 0,  'Shoes')
) as p(name, description, price, compare_at_price, stock, category)
where s.slug = 'zara';
