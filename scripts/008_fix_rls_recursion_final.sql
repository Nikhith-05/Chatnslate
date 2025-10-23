-- Complete fix for infinite recursion in RLS policies
-- The issue is any policy on conversation_participants that queries conversation_participants causes recursion

-- Drop all existing problematic policies
drop policy if exists "participants_select_own" on public.conversation_participants;
drop policy if exists "participants_select_in_shared_conversations" on public.conversation_participants;
drop policy if exists "participants_insert_own" on public.conversation_participants;
drop policy if exists "conversations_select_own" on public.conversations;

-- Simple policies for conversation_participants that don't cause recursion
-- Users can only see their own participant records
create policy "participants_select_simple"
  on public.conversation_participants for select
  using (user_id = auth.uid());

-- Users can insert themselves as participants
create policy "participants_insert_simple"
  on public.conversation_participants for insert
  with check (user_id = auth.uid());

-- Users can delete their own participation
create policy "participants_delete_simple"
  on public.conversation_participants for delete
  using (user_id = auth.uid());

-- For conversations, use a simpler approach
-- Users can see conversations they created
create policy "conversations_select_created"
  on public.conversations for select
  using (created_by = auth.uid());

-- Users can insert conversations they create
create policy "conversations_insert_own"
  on public.conversations for insert
  with check (created_by = auth.uid());

-- Users can update conversations they created
create policy "conversations_update_own"
  on public.conversations for update
  using (created_by = auth.uid());
