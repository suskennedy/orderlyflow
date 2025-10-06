-- =====================================================
-- FAMILY SHARING SYSTEM - DATABASE IMPLEMENTATION
-- =====================================================
-- This file implements a complete family sharing system
-- where users can create family accounts and invite up to 4 members
-- =====================================================

-- =====================================================
-- 1. CREATE NEW TABLES FOR FAMILY SYSTEM
-- =====================================================

-- Family accounts table - stores family account information
CREATE TABLE IF NOT EXISTS family_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members table - links users to family accounts with roles
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_account_id UUID REFERENCES family_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_account_id, user_id)
);

-- Family invitations table - manages email invitations
CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_account_id UUID REFERENCES family_accounts(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. ADD FAMILY_ACCOUNT_ID TO EXISTING TABLES
-- =====================================================

-- Add family_account_id to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to homes
ALTER TABLE homes 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to vendors
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to calendar_events
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to appliances
ALTER TABLE appliances 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to filters
ALTER TABLE filters 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to paint_colors
ALTER TABLE paint_colors 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to tiles
ALTER TABLE tiles 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to cabinets
ALTER TABLE cabinets 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to light_fixtures
ALTER TABLE light_fixtures 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- Add family_account_id to infrastructure_locations
ALTER TABLE infrastructure_locations 
ADD COLUMN IF NOT EXISTS family_account_id UUID REFERENCES family_accounts(id);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Family accounts indexes
CREATE INDEX IF NOT EXISTS idx_family_accounts_owner_id ON family_accounts(owner_id);

-- Family members indexes
CREATE INDEX IF NOT EXISTS idx_family_members_family_account ON family_members(family_account_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_role ON family_members(role);

-- Family invitations indexes
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_account ON family_invitations(family_account_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_token ON family_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_family_invitations_email ON family_invitations(email);
CREATE INDEX IF NOT EXISTS idx_family_invitations_status ON family_invitations(status);
CREATE INDEX IF NOT EXISTS idx_family_invitations_expires_at ON family_invitations(expires_at);

-- Family account indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_user_profiles_family_account ON user_profiles(family_account_id);
CREATE INDEX IF NOT EXISTS idx_tasks_family_account ON tasks(family_account_id);
CREATE INDEX IF NOT EXISTS idx_homes_family_account ON homes(family_account_id);
CREATE INDEX IF NOT EXISTS idx_vendors_family_account ON vendors(family_account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_family_account ON calendar_events(family_account_id);
CREATE INDEX IF NOT EXISTS idx_appliances_family_account ON appliances(family_account_id);
CREATE INDEX IF NOT EXISTS idx_filters_family_account ON filters(family_account_id);
CREATE INDEX IF NOT EXISTS idx_paint_colors_family_account ON paint_colors(family_account_id);
CREATE INDEX IF NOT EXISTS idx_tiles_family_account ON tiles(family_account_id);
CREATE INDEX IF NOT EXISTS idx_cabinets_family_account ON cabinets(family_account_id);
CREATE INDEX IF NOT EXISTS idx_light_fixtures_family_account ON light_fixtures(family_account_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_locations_family_account ON infrastructure_locations(family_account_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE family_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Family accounts policies
CREATE POLICY "Users can view their family account" ON family_accounts
  FOR SELECT USING (
    id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their family account" ON family_accounts
  FOR UPDATE USING (
    id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can create family accounts" ON family_accounts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Family members policies
CREATE POLICY "Users can view members in their family" ON family_members
  FOR SELECT USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage members" ON family_members
  FOR ALL USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Family invitations policies
CREATE POLICY "Users can view invitations for their family" ON family_invitations
  FOR SELECT USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage invitations" ON family_invitations
  FOR ALL USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 6. UPDATE EXISTING RLS POLICIES FOR FAMILY FILTERING
-- =====================================================

-- Tasks policies
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
CREATE POLICY "Users can view tasks in their family account" ON tasks
  FOR SELECT USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
CREATE POLICY "Users can insert tasks in their family account" ON tasks
  FOR INSERT WITH CHECK (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
CREATE POLICY "Users can update tasks in their family account" ON tasks
  FOR UPDATE USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;
CREATE POLICY "Users can delete tasks in their family account" ON tasks
  FOR DELETE USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

-- Homes policies
DROP POLICY IF EXISTS "Users can view their own homes" ON homes;
CREATE POLICY "Users can view homes in their family account" ON homes
  FOR SELECT USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can insert their own homes" ON homes;
CREATE POLICY "Users can insert homes in their family account" ON homes
  FOR INSERT WITH CHECK (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can update their own homes" ON homes;
CREATE POLICY "Users can update homes in their family account" ON homes
  FOR UPDATE USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can delete their own homes" ON homes;
CREATE POLICY "Users can delete homes in their family account" ON homes
  FOR DELETE USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

-- Vendors policies
DROP POLICY IF EXISTS "Users can view their own vendors" ON vendors;
CREATE POLICY "Users can view vendors in their family account" ON vendors
  FOR SELECT USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can insert their own vendors" ON vendors;
CREATE POLICY "Users can insert vendors in their family account" ON vendors
  FOR INSERT WITH CHECK (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can update their own vendors" ON vendors;
CREATE POLICY "Users can update vendors in their family account" ON vendors
  FOR UPDATE USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can delete their own vendors" ON vendors;
CREATE POLICY "Users can delete vendors in their family account" ON vendors
  FOR DELETE USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

-- Calendar events policies
DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
CREATE POLICY "Users can view calendar events in their family account" ON calendar_events
  FOR SELECT USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can insert their own calendar events" ON calendar_events;
CREATE POLICY "Users can insert calendar events in their family account" ON calendar_events
  FOR INSERT WITH CHECK (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can update their own calendar events" ON calendar_events;
CREATE POLICY "Users can update calendar events in their family account" ON calendar_events
  FOR UPDATE USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

DROP POLICY IF EXISTS "Users can delete their own calendar events" ON calendar_events;
CREATE POLICY "Users can delete calendar events in their family account" ON calendar_events
  FOR DELETE USING (
    family_account_id IN (
      SELECT family_account_id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR family_account_id IS NULL
  );

-- =====================================================
-- 7. CREATE DATABASE FUNCTIONS FOR FAMILY OPERATIONS
-- =====================================================

-- Function to create a new family account
CREATE OR REPLACE FUNCTION create_family_account(
  account_name VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
  new_account_id UUID;
BEGIN
  -- Check if user already has a family account
  IF EXISTS (
    SELECT 1 FROM family_members 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is already part of a family account';
  END IF;
  
  -- Create the family account
  INSERT INTO family_accounts (name, owner_id)
  VALUES (account_name, auth.uid())
  RETURNING id INTO new_account_id;
  
  -- Add the current user as the owner
  INSERT INTO family_members (family_account_id, user_id, role)
  VALUES (new_account_id, auth.uid(), 'owner');
  
  -- Update the user's profile
  UPDATE user_profiles 
  SET family_account_id = new_account_id
  WHERE id = auth.uid();
  
  RETURN new_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite a user to the family account
CREATE OR REPLACE FUNCTION invite_family_member(
  invitee_email VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
  invitation_id UUID;
  current_family_account_id UUID;
  invitation_token VARCHAR(255);
BEGIN
  -- Get the current user's family account
  SELECT family_account_id INTO current_family_account_id
  FROM family_members 
  WHERE user_id = auth.uid();
  
  IF current_family_account_id IS NULL THEN
    RAISE EXCEPTION 'User is not part of a family account';
  END IF;
  
  -- Check if user has owner/admin role
  IF NOT EXISTS (
    SELECT 1 FROM family_members 
    WHERE user_id = auth.uid() 
    AND family_account_id = current_family_account_id 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to invite members';
  END IF;
  
  -- Check if account has reached member limit
  IF (
    SELECT COUNT(*) FROM family_members 
    WHERE family_account_id = current_family_account_id
  ) >= (
    SELECT max_members FROM family_accounts WHERE id = current_family_account_id
  ) THEN
    RAISE EXCEPTION 'Family account has reached maximum member limit';
  END IF;
  
  -- Check if email is already invited
  IF EXISTS (
    SELECT 1 FROM family_invitations 
    WHERE email = invitee_email 
    AND family_account_id = current_family_account_id 
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Invitation already sent to this email';
  END IF;
  
  -- Generate invitation token
  invitation_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create invitation
  INSERT INTO family_invitations (
    family_account_id, 
    invited_by, 
    email, 
    invitation_token
  )
  VALUES (
    current_family_account_id,
    auth.uid(),
    invitee_email,
    invitation_token
  )
  RETURNING id INTO invitation_id;
  
  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION accept_family_invitation(
  invitation_token VARCHAR(255)
) RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM family_invitations
  WHERE invitation_token = accept_family_invitation.invitation_token
  AND status = 'pending'
  AND expires_at > NOW();
  
  IF invitation_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- Check if user is already part of a family account
  IF EXISTS (
    SELECT 1 FROM family_members 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is already part of a family account';
  END IF;
  
  -- Check if family account has reached member limit
  IF (
    SELECT COUNT(*) FROM family_members 
    WHERE family_account_id = invitation_record.family_account_id
  ) >= (
    SELECT max_members FROM family_accounts WHERE id = invitation_record.family_account_id
  ) THEN
    RAISE EXCEPTION 'Family account has reached maximum member limit';
  END IF;
  
  -- Add user to the family account
  INSERT INTO family_members (family_account_id, user_id, role)
  VALUES (invitation_record.family_account_id, auth.uid(), 'member');
  
  -- Update user's profile
  UPDATE user_profiles 
  SET family_account_id = invitation_record.family_account_id
  WHERE id = auth.uid();
  
  -- Mark invitation as accepted
  UPDATE family_invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = invitation_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a family member
CREATE OR REPLACE FUNCTION remove_family_member(
  member_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  current_family_account_id UUID;
BEGIN
  -- Get the current user's family account
  SELECT family_account_id INTO current_family_account_id
  FROM family_members 
  WHERE user_id = auth.uid();
  
  IF current_family_account_id IS NULL THEN
    RAISE EXCEPTION 'User is not part of a family account';
  END IF;
  
  -- Check if user has owner/admin role
  IF NOT EXISTS (
    SELECT 1 FROM family_members 
    WHERE user_id = auth.uid() 
    AND family_account_id = current_family_account_id 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to remove members';
  END IF;
  
  -- Check if trying to remove owner
  IF EXISTS (
    SELECT 1 FROM family_members 
    WHERE user_id = member_user_id 
    AND family_account_id = current_family_account_id 
    AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Cannot remove the owner from the family account';
  END IF;
  
  -- Remove the member
  DELETE FROM family_members
  WHERE user_id = member_user_id 
  AND family_account_id = current_family_account_id;
  
  -- Update the removed user's profile
  UPDATE user_profiles 
  SET family_account_id = NULL
  WHERE id = member_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update updated_at timestamp on family_accounts
CREATE OR REPLACE FUNCTION update_family_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_family_accounts_updated_at
  BEFORE UPDATE ON family_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_family_accounts_updated_at();

-- =====================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE family_accounts IS 'Family accounts that can have up to 4 members sharing data';
COMMENT ON TABLE family_members IS 'Links users to family accounts with specific roles';
COMMENT ON TABLE family_invitations IS 'Email invitations to join family accounts';

COMMENT ON COLUMN family_accounts.owner_id IS 'The user who created the family account';
COMMENT ON COLUMN family_accounts.max_members IS 'Maximum number of members allowed (default: 4)';
COMMENT ON COLUMN family_members.role IS 'Role in the family: owner, admin, or member';
COMMENT ON COLUMN family_invitations.invitation_token IS 'Unique token for invitation validation';
COMMENT ON COLUMN family_invitations.expires_at IS 'When the invitation expires (7 days from creation)';

-- =====================================================
-- 10. CLEANUP OLD INVITATIONS (OPTIONAL)
-- =====================================================

-- Function to clean up expired invitations (can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE family_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF FAMILY SHARING DATABASE IMPLEMENTATION
-- ===================================================== 