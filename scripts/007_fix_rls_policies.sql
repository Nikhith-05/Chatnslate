-- Fix infinite recursion in conversation_participants RLS policy
-- Drop the problematic policy
drop policy if exists "participants_select_own" on public.conversation_participants;

-- Create a simple policy that doesn't cause recursion
create policy "participants_select_own"
  on public.conversation_participants for select
  using (user_id = auth.uid());

-- Also allow users to see other participants in conversations they're part of
create policy "participants_select_in_shared_conversations"
  on public.conversation_participants for select
  using (
    conversation_id in (
      select conversation_id from public.conversation_participants
      where user_id = auth.uid()
    )
  );
