-- Supabase Database Schema for Snack-Track

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products Table
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price integer not null, -- stored in cents/smallest unit
  image_url text,
  is_active boolean default true,
  qty_available integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Orders Table
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  items jsonb not null default '[]'::jsonb, -- Array of {product_id, name, qty, price}
  total_amount integer not null,
  is_collected boolean default false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- RLS Policies (Basic setup)
alter table products enable row level security;
alter table orders enable row level security;

-- Public read for active products
create policy "Allow public read for active products" 
on products for select 
using (is_active = true);

-- Authenticated users can do everything (Vendor role)
create policy "Allow authenticated users full access to products" 
on products for all 
using (auth.role() = 'authenticated');

create policy "Allow authenticated users full access to orders" 
on orders for all 
using (auth.role() = 'authenticated');

-- Storage Bucket setup (Note: This usually needs to be done via Supabase Dashboard or API)
-- insert into storage.buckets (id, name, public) values ('snack-images', 'snack-images', true);
