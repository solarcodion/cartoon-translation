-- Migration: Add next_page column to chapters table
-- This migration adds the next_page field to track the next available page number for each chapter

-- Add the next_page column with default value of 1
ALTER TABLE chapters ADD COLUMN next_page INTEGER DEFAULT 1;

-- Update existing chapters to set next_page based on their current pages
-- For chapters with no pages, next_page should be 1
-- For chapters with pages, next_page should be max(page_number) + 1

UPDATE chapters 
SET next_page = COALESCE(
  (SELECT MAX(page_number) + 1 
   FROM pages 
   WHERE pages.chapter_id = chapters.id), 
  1
);

-- Add a comment to document the column
COMMENT ON COLUMN chapters.next_page IS 'The next available page number for this chapter';
