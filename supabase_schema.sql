-- 1. Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 2. Drop existing tables if they exist
drop table if exists public.applications;
drop table if exists public.jobs;
drop table if exists public.users_profile;

-- 3. Create users_profile table
create table public.users_profile (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  phone text,
  location text,
  skills jsonb default '[]'::jsonb,
  experience jsonb default '[]'::jsonb,
  projects jsonb default '[]'::jsonb,
  education jsonb default '[]'::jsonb,
  preferences jsonb default '{"target_roles": [], "locations": [], "work_type": "remote", "experience_level": "fresher"}'::jsonb,
  raw_resume_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users_profile enable row level security;

-- Policies for users_profile
create policy "Users can view own profile" on public.users_profile
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.users_profile
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.users_profile
  for update using (auth.uid() = id);

create policy "Users can delete own profile" on public.users_profile
  for delete using (auth.uid() = id);

-- Trigger to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on public.users_profile
for each row
execute function public.handle_updated_at();


-- 4. Create jobs table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  company text not null,
  location text,
  description text,
  source_url text,
  source text check (source in ('adzuna', 'manual', 'pasted')),
  match_score integer,
  match_data jsonb default '{}'::jsonb,
  is_saved boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.jobs enable row level security;

-- Policies for jobs
create policy "Users can view own jobs" on public.jobs
  for select using (auth.uid() = user_id);

create policy "Users can insert own jobs" on public.jobs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own jobs" on public.jobs
  for update using (auth.uid() = user_id);

create policy "Users can delete own jobs" on public.jobs
  for delete using (auth.uid() = user_id);


-- 5. Create applications table
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  job_id uuid references public.jobs on delete cascade not null,
  status text check (status in ('saved', 'applied', 'interview', 'offer', 'rejected')) not null,
  resume_version jsonb default '{}'::jsonb,
  cover_letter text,
  applied_at timestamp with time zone,
  notes text,
  status_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.applications enable row level security;

-- Policies for applications
create policy "Users can view own applications" on public.applications
  for select using (auth.uid() = user_id);

create policy "Users can insert own applications" on public.applications
  for insert with check (auth.uid() = user_id);

create policy "Users can update own applications" on public.applications
  for update using (auth.uid() = user_id);

create policy "Users can delete own applications" on public.applications
  for delete using (auth.uid() = user_id);
