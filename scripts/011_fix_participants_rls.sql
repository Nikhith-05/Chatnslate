-- Fix RLS policy to allow viewing other participants in shared conversations
-- The current policy only allows users to see their own participant records
-- But we need to see other participants in conversations we're part of

-- Add a policy to allow seeing other participants in shared conversations
create policy "participants_select_in_shared_conversations"
  on public.conversation_participants for select
  using (
    -- Allow seeing other participants if the current user is also a participant in the same conversation
    conversation_id in (
      select conversation_id 
      from public.conversation_participants 
      where user_id = auth.uid()
    )
  );
