-- Create conversations table for chat rooms
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.conversations enable row level security;

-- Create conversation participants table
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(conversation_id, user_id)
);

-- Enable RLS
alter table public.conversation_participants enable row level security;

-- RLS policies for conversations
create policy "conversations_select_participant"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = conversations.id and user_id = auth.uid()
    )
  );

create policy "conversations_insert_own"
  on public.conversations for insert
  with check (auth.uid() = created_by);

-- RLS policies for conversation participants
create policy "participants_select_own"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id 
      and cp.user_id = auth.uid()
    )
  );

create policy "participants_insert_creator"
  on public.conversation_participants for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );
