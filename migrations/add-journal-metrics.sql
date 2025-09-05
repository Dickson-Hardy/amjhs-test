-- Create journal_metrics table for storing journal impact factors and metadata
CREATE TABLE IF NOT EXISTS journal_metrics (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
    impact_factor DECIMAL(4,2) DEFAULT 1.8,
    jci_score DECIMAL(4,2) DEFAULT 0.42,
    h_index INTEGER DEFAULT 12,
    total_citations INTEGER DEFAULT 245,
    online_issn VARCHAR(20) DEFAULT '2672-4596',
    print_issn VARCHAR(20) DEFAULT '2672-4588',
    established_year INTEGER DEFAULT 2020,
    publisher TEXT DEFAULT 'Bayelsa Medical University',
    frequency TEXT DEFAULT 'Quarterly (4 issues per year)',
    subject_areas JSON DEFAULT '["Medicine", "Health Sciences", "Clinical Research", "Public Health", "Medical Technology"]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default journal metrics data
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
    1.8,
    0.42,
    12,
    245,
    '2672-4596',
    '2672-4588',
    2020,
    'Bayelsa Medical University',
    'Quarterly (4 issues per year)',
    '["Medicine", "Health Sciences", "Clinical Research", "Public Health", "Medical Technology"]'
) ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;