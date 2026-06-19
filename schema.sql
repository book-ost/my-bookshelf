CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  nationality TEXT DEFAULT '',
  year TEXT DEFAULT '',
  color TEXT DEFAULT '#4a2c1a',
  progress INTEGER DEFAULT 100,
  keywords TEXT[] DEFAULT '{}',
  summary TEXT DEFAULT '',
  reflection TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read books" ON books FOR SELECT USING (true);
CREATE POLICY "Anyone can read comments" ON comments FOR SELECT USING (true);

CREATE INDEX idx_books_year ON books(year);
CREATE INDEX idx_comments_book_id ON comments(book_id);
