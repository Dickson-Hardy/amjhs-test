-- Create editor assignments table for tracking assignment requests and responses
-- This table manages the editor assignment workflow with conflict of interest declarations

CREATE TABLE IF NOT EXISTS editor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    editor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Assignment details
    assigned_by UUID REFERENCES users(id), -- who made the assignment (system or admin)
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deadline TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '3 days'),
    
    -- Editor response
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    response_at TIMESTAMP WITH TIME ZONE,
    
    -- Conflict of interest declaration
    conflict_declared BOOLEAN DEFAULT FALSE,
    conflict_details TEXT, -- details if conflict is declared
    
    -- Assignment metadata
    assignment_reason TEXT, -- why this editor was selected
    system_generated BOOLEAN DEFAULT TRUE, -- was this assigned by algorithm or manually
    
    -- Response details
    decline_reason TEXT, -- reason for declining if applicable
    editor_comments TEXT, -- additional comments from editor
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no duplicate active assignments for same article-editor pair
    UNIQUE(article_id, editor_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_editor_assignments_article_id ON editor_assignments(article_id);
CREATE INDEX IF NOT EXISTS idx_editor_assignments_editor_id ON editor_assignments(editor_id);
CREATE INDEX IF NOT EXISTS idx_editor_assignments_status ON editor_assignments(status);
CREATE INDEX IF NOT EXISTS idx_editor_assignments_assigned_at ON editor_assignments(assigned_at);
CREATE INDEX IF NOT EXISTS idx_editor_assignments_deadline ON editor_assignments(deadline);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_editor_assignments_editor_status ON editor_assignments(editor_id, status);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_editor_assignments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_editor_assignments_updated_at
    BEFORE UPDATE ON editor_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_editor_assignments_timestamp();

-- Add function to automatically expire old pending assignments
CREATE OR REPLACE FUNCTION expire_old_editor_assignments()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE editor_assignments 
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'pending' 
        AND deadline < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE editor_assignments IS 'Tracks editor assignment requests and responses with conflict of interest declarations';
COMMENT ON COLUMN editor_assignments.status IS 'Assignment status: pending (awaiting response), accepted (editor accepted), declined (editor declined), expired (deadline passed)';
COMMENT ON COLUMN editor_assignments.conflict_declared IS 'TRUE if editor declared a conflict of interest';
COMMENT ON COLUMN editor_assignments.system_generated IS 'TRUE if assigned by algorithm, FALSE if manually assigned';
COMMENT ON COLUMN editor_assignments.deadline IS 'Deadline for editor to respond to assignment';
