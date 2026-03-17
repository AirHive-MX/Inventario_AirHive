-- ============================================
-- Inventario Air Hive - Supabase Schema
-- ============================================

-- 1. Create the inventario_airhive_items table
CREATE TABLE inventario_airhive_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 0,
  type VARCHAR(100) NOT NULL,
  in_use INT DEFAULT 0,
  description TEXT,
  location VARCHAR(255),
  supplier VARCHAR(255),
  part_number VARCHAR(100),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the inventario_airhive_activity_log table
CREATE TABLE inventario_airhive_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES inventario_airhive_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventario_airhive_items_updated_at
  BEFORE UPDATE ON inventario_airhive_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security
ALTER TABLE inventario_airhive_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_airhive_activity_log ENABLE ROW LEVEL SECURITY;

-- 5. Allow all operations with anon key (single-user app)
CREATE POLICY "Allow read items" ON inventario_airhive_items FOR SELECT USING (true);
CREATE POLICY "Allow insert items" ON inventario_airhive_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update items" ON inventario_airhive_items FOR UPDATE USING (true);
CREATE POLICY "Allow delete items" ON inventario_airhive_items FOR DELETE USING (true);

CREATE POLICY "Allow read logs" ON inventario_airhive_activity_log FOR SELECT USING (true);
CREATE POLICY "Allow insert logs" ON inventario_airhive_activity_log FOR INSERT WITH CHECK (true);

-- 6. Create storage bucket for inventory photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inventario-airhive-photos', 'inventario-airhive-photos', true);

-- 7. Storage policies for inventario-airhive-photos bucket
CREATE POLICY "Public read inventory photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'inventario-airhive-photos');

CREATE POLICY "Allow upload inventory photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'inventario-airhive-photos');

CREATE POLICY "Allow update inventory photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'inventario-airhive-photos');

CREATE POLICY "Allow delete inventory photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'inventario-airhive-photos');
