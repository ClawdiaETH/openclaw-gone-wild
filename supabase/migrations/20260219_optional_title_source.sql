-- Make title and source_link optional
ALTER TABLE posts ALTER COLUMN title DROP NOT NULL;
ALTER TABLE posts ALTER COLUMN source_link DROP NOT NULL;
