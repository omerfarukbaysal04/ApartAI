create table users (
  id text primary key,
  full_name text not null,
  phone text,
  email text,
  password_hash text,
  role text not null check (role in ('admin', 'resident')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sites (
  id text primary key,
  name text not null,
  address text,
  manager_id text references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resident_profiles (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  site_id text not null references sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, site_id)
);

create table blocks (
  id text primary key,
  site_id text not null references sites(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table apartments (
  id text primary key,
  site_id text not null references sites(id) on delete cascade,
  block_id text not null references blocks(id) on delete cascade,
  apartment_no text not null,
  floor integer,
  resident_profile_id text references resident_profiles(id),
  created_at timestamptz not null default now(),
  unique (block_id, apartment_no)
);

create table dues (
  id text primary key,
  site_id text not null references sites(id) on delete cascade,
  apartment_id text not null references apartments(id) on delete cascade,
  period text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  due_date date not null,
  status text not null check (status in ('pending', 'paid', 'overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (apartment_id, period)
);

create table payments (
  id text primary key,
  due_id text not null references dues(id) on delete cascade,
  apartment_id text not null references apartments(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  payment_date date not null,
  method text,
  note text,
  created_at timestamptz not null default now()
);

create table requests (
  id text primary key,
  site_id text not null references sites(id) on delete cascade,
  apartment_id text not null references apartments(id) on delete cascade,
  category text not null,
  title text not null,
  description text not null,
  photo_url text,
  photo_data_url text,
  urgency text not null check (urgency in ('Düşük', 'Orta', 'Yüksek')),
  status text not null check (status in ('yeni', 'inceleniyor', 'firmaya_iletildi', 'cozuldu', 'reddedildi')),
  admin_note text,
  ai_summary text,
  ai_suggested_action text,
  ai_provider text,
  ai_model text,
  ai_fallback_used boolean not null default true,
  location text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table announcements (
  id text primary key,
  site_id text not null references sites(id) on delete cascade,
  title text not null,
  content text not null,
  ai_content text,
  audience text not null default 'Tüm site',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table ai_analysis (
  id text primary key,
  site_id text not null references sites(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  provider text,
  prompt_version text,
  category text,
  urgency text,
  location text,
  summary text,
  suggested_action text,
  confidence numeric(4, 3),
  raw_response jsonb,
  approved_by text references users(id),
  created_at timestamptz not null default now()
);

create table site_health_scores (
  id text primary key,
  site_id text not null references sites(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  status text not null,
  reasons jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now()
);

create index idx_dues_site_period on dues(site_id, period);
create index idx_dues_status on dues(status);
create index idx_requests_site_status on requests(site_id, status);
create index idx_requests_category on requests(category);
create index idx_announcements_site_published on announcements(site_id, published_at desc);
