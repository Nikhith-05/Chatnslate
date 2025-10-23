-- Completely disable problematic RLS policies and create simple ones
-- Drop all existing policies on conversation_participants to eliminate recursion
DROP POLICY IF EXISTS "participants_select_own" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_select_in_shared_conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert_own" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_delete_own" ON public.conversation_participants;

-- Drop existing policies on conversations table
DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_own" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_participants" ON public.conversations;

-- Create simple, non-recursive policies for conversation_participants
-- Allow users to see only their own participant records
CREATE POLICY "participants_select_simple"
  ON public.conversation_participants FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to insert themselves as participants
CREATE POLICY "participants_insert_simple"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own participation
CREATE POLICY "participants_delete_simple"
  ON public.conversation_participants FOR DELETE
  USING (user_id = auth.uid());

-- Create simple policies for conversations table
-- Allow users to see conversations they created
CREATE POLICY "conversations_select_simple"
  ON public.conversations FOR SELECT
  USING (created_by = auth.uid());

-- Allow users to insert conversations
CREATE POLICY "conversations_insert_simple"
  ON public.conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Allow users to update conversations they created
CREATE POLICY "conversations_update_simple"
  ON public.conversations FOR UPDATE
  USING (created_by = auth.uid());
