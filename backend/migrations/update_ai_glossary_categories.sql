-- Update AI Glossary table to use the 5 required categories
-- This script updates the check constraint to allow exactly: character, item, place, term, other

-- Drop the existing check constraint
ALTER TABLE ai_glossary DROP CONSTRAINT IF EXISTS ai_glossary_category_check;

-- Add the new check constraint with the 5 required categories
ALTER TABLE ai_glossary ADD CONSTRAINT ai_glossary_category_check
CHECK (category IN ('character', 'item', 'place', 'term', 'other'));

-- Update any existing entries to map to the new categories
UPDATE ai_glossary SET category = 'term' WHERE category IN ('skill', 'technique', 'ability', 'power', 'magic', 'spell');
UPDATE ai_glossary SET category = 'other' WHERE category IN ('organization', 'guild', 'clan', 'concept', 'system', 'title', 'rank');
UPDATE ai_glossary SET category = 'other' WHERE category NOT IN ('character', 'item', 'place', 'term', 'other');
