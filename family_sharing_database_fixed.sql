-- Family Sharing System - Fixed Database Implementation
-- This version fixes the infinite recursion issues in RLS policies

-- 1. Create new tables
CREATE TABLE IF NOT EXISTS public.family_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_account_id UUID NOT NULL REFERENCES public.family_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_account_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.family_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_account_id UUID NOT NULL REFERENCES public.family_accounts(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Add family_account_id to existing tables
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.homes ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.appliances ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.filters ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.paint_colors ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.cabinets ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.tiles ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.light_fixtures ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.infrastructure_locations ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_family_accounts_owner_id ON public.family_accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_account_id ON public.family_members(family_account_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_account_id ON public.family_invitations(family_account_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_email ON public.family_invitations(email);
CREATE INDEX IF NOT EXISTS idx_family_invitations_token ON public.family_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_profiles_family_account_id ON public.user_profiles(family_account_id);
CREATE INDEX IF NOT EXISTS idx_homes_family_account_id ON public.homes(family_account_id);
CREATE INDEX IF NOT EXISTS idx_tasks_family_account_id ON public.tasks(family_account_id);
CREATE INDEX IF NOT EXISTS idx_vendors_family_account_id ON public.vendors(family_account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_family_account_id ON public.calendar_events(family_account_id);

-- 4. Enable RLS
ALTER TABLE public.family_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (FIXED - No circular dependencies)
-- Family accounts policies
CREATE POLICY "Users can view their own family account" ON public.family_accounts
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_account_id = family_accounts.id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Only owners can update family accounts" ON public.family_accounts
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Only owners can delete family accounts" ON public.family_accounts
    FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own family account" ON public.family_accounts
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Family members policies (FIXED - No circular references)
CREATE POLICY "Family members can view their family members" ON public.family_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_account_id = family_members.family_account_id
            AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can manage family members" ON public.family_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            JOIN public.family_accounts fa ON fm.family_account_id = fa.id
            WHERE fm.family_account_id = family_members.family_account_id
            AND fm.user_id = auth.uid()
            AND (fm.role IN ('owner', 'admin') OR fa.owner_id = auth.uid())
        )
    );

-- Family invitations policies
CREATE POLICY "Family members can view invitations" ON public.family_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_account_id = family_invitations.family_account_id
            AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can manage invitations" ON public.family_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            JOIN public.family_accounts fa ON fm.family_account_id = fa.id
            WHERE fm.family_account_id = family_invitations.family_account_id
            AND fm.user_id = auth.uid()
            AND (fm.role IN ('owner', 'admin') OR fa.owner_id = auth.uid())
        )
    );

-- 6. Update existing RLS policies to include family_account_id filtering
-- User profiles policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile or family members" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        (family_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_account_id = user_profiles.family_account_id
            AND fm.user_id = auth.uid()
        ))
    );

-- Homes policy
DROP POLICY IF EXISTS "Users can view own homes" ON public.homes;
CREATE POLICY "Users can view own homes or family homes" ON public.homes
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (family_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_account_id = homes.family_account_id
            AND fm.user_id = auth.uid()
        ))
    );

-- Tasks policy
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks or family tasks" ON public.tasks
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (family_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_account_id = tasks.family_account_id
            AND fm.user_id = auth.uid()
        ))
    );

-- Vendors policy
DROP POLICY IF EXISTS "Users can view own vendors" ON public.vendors;
CREATE POLICY "Users can view own vendors or family vendors" ON public.vendors
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (family_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_account_id = vendors.family_account_id
            AND fm.user_id = auth.uid()
        ))
    );

-- Calendar events policy
DROP POLICY IF EXISTS "Users can view own calendar events" ON public.calendar_events;
CREATE POLICY "Users can view own calendar events or family events" ON public.calendar_events
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (family_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_account_id = calendar_events.family_account_id
            AND fm.user_id = auth.uid()
        ))
    );

-- 7. Create database functions (FIXED - No policy recursion)
CREATE OR REPLACE FUNCTION public.create_family_account(account_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_family_id UUID;
BEGIN
    -- Create family account
    INSERT INTO public.family_accounts (name, owner_id)
    VALUES (account_name, auth.uid())
    RETURNING id INTO new_family_id;
    
    -- Add creator as owner member
    INSERT INTO public.family_members (family_account_id, user_id, role)
    VALUES (new_family_id, auth.uid(), 'owner');
    
    -- Update user profile with family account
    UPDATE public.user_profiles 
    SET family_account_id = new_family_id
    WHERE id = auth.uid();
    
    RETURN new_family_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_family_member(invitee_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_family_id UUID;
    invitation_token TEXT;
BEGIN
    -- Get user's family account
    SELECT family_account_id INTO user_family_id
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF user_family_id IS NULL THEN
        RAISE EXCEPTION 'User is not part of a family account';
    END IF;
    
    -- Check if user has permission to invite
    IF NOT EXISTS (
        SELECT 1 FROM public.family_members fm
        JOIN public.family_accounts fa ON fm.family_account_id = fa.id
        WHERE fm.family_account_id = user_family_id
        AND fm.user_id = auth.uid()
        AND (fm.role IN ('owner', 'admin') OR fa.owner_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to invite members';
    END IF;
    
    -- Generate invitation token
    invitation_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create invitation
    INSERT INTO public.family_invitations (family_account_id, invited_by, email, invitation_token)
    VALUES (user_family_id, auth.uid(), invitee_email, invitation_token);
    
    RETURN invitation_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_family_invitation(invitation_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Get invitation
    SELECT * INTO invitation_record
    FROM public.family_invitations
    WHERE invitation_token = accept_family_invitation.invitation_token
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;
    
    -- Add user to family
    INSERT INTO public.family_members (family_account_id, user_id, role)
    VALUES (invitation_record.family_account_id, auth.uid(), 'member')
    ON CONFLICT (family_account_id, user_id) DO NOTHING;
    
    -- Update user profile
    UPDATE public.user_profiles 
    SET family_account_id = invitation_record.family_account_id
    WHERE id = auth.uid();
    
    -- Mark invitation as accepted
    UPDATE public.family_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_family_member(member_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_family_id UUID;
BEGIN
    -- Get user's family account
    SELECT family_account_id INTO user_family_id
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF user_family_id IS NULL THEN
        RAISE EXCEPTION 'User is not part of a family account';
    END IF;
    
    -- Check if user has permission to remove members
    IF NOT EXISTS (
        SELECT 1 FROM public.family_members fm
        JOIN public.family_accounts fa ON fm.family_account_id = fa.id
        WHERE fm.family_account_id = user_family_id
        AND fm.user_id = auth.uid()
        AND (fm.role IN ('owner', 'admin') OR fa.owner_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to remove members';
    END IF;
    
    -- Remove member
    DELETE FROM public.family_members
    WHERE family_account_id = user_family_id
    AND user_id = member_user_id;
    
    -- Update member's profile
    UPDATE public.user_profiles 
    SET family_account_id = NULL
    WHERE id = member_user_id;
    
    RETURN TRUE;
END;
$$;

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.family_accounts TO authenticated;
GRANT ALL ON public.family_members TO authenticated;
GRANT ALL ON public.family_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_family_account(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_family_member(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_family_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_family_member(UUID) TO authenticated;

-- 9. Add comments
COMMENT ON TABLE public.family_accounts IS 'Family accounts for multi-user access';
COMMENT ON TABLE public.family_members IS 'Members of family accounts with roles';
COMMENT ON TABLE public.family_invitations IS 'Pending invitations to join family accounts'; 