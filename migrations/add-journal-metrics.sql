-- Create journal_metrics table for storing journal impact factors and metadata
CREATE TABLE IF NOT EXISTS journal_metrics (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
    impact_factor DECIMAL(4,2) DEFAULT NULL,
    jci_score DECIMAL(4,2) DEFAULT NULL,
    h_index INTEGER DEFAULT NULL,
    total_citations INTEGER DEFAULT 0,
    online_issn VARCHAR(20) DEFAULT NULL,
    print_issn VARCHAR(20) DEFAULT NULL,
    established_year INTEGER DEFAULT 2025,
    publisher TEXT DEFAULT 'AMHSJ Publishing',
    frequency TEXT DEFAULT 'By volumes (continuous publishing)',
    subject_areas JSONB DEFAULT '["Medicine", "Health Sciences", "Clinical Research", "Public Health", "Biomedical Sciences", "Medical Education", "Healthcare Policy"]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert actual journal metrics data
INSERT INTO journal_metrics (
    id,
    impact_factor,
    jci_score,
    h_index,
    total_citations,
    online_issn,
    print_issn,
    established_year,
    publisher,
    frequency,
    subject_areas
) VALUES (
    'current',
    NULL,  -- Will be populated when journal gets indexed and receives impact factor
    NULL,  -- Will be populated when journal gets JCI indexing
    NULL,  -- Will be calculated as citations accumulate
    0,     -- Starting with zero citations for new journal
    NULL,  -- Online ISSN will be assigned when journal is officially registered
    NULL,  -- Print ISSN will be assigned when journal is officially registered  
    2025,  -- Current establishment year
    'AMHSJ Publishing',  -- Actual publisher name
    'By volumes (continuous publishing)',  -- Actual publishing frequency
    '["Medicine", "Health Sciences", "Clinical Research", "Public Health", "Biomedical Sciences", "Medical Education", "Healthcare Policy"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    updated_at = CURRENT_TIMESTAMP;