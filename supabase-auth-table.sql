-- 浙江艺考志愿助手 — 授权用户表
-- 在 Supabase SQL Editor 中执行此文件

-- 1. 创建表
CREATE TABLE IF NOT EXISTS authorized_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  name text DEFAULT '',
  major_direction text DEFAULT '',
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT null,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 开启行级安全
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- 3. 删除已有策略（避免重复）
DROP POLICY IF EXISTS "Allow anon select" ON authorized_users;
DROP POLICY IF EXISTS "Allow anon insert" ON authorized_users;
DROP POLICY IF EXISTS "Allow anon update" ON authorized_users;
DROP POLICY IF EXISTS "Allow anon delete" ON authorized_users;

-- 4. 创建策略（允许匿名 key 完整访问）
CREATE POLICY "Allow anon select" ON authorized_users
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert" ON authorized_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update" ON authorized_users
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete" ON authorized_users
  FOR DELETE USING (true);

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_authorized_users_phone ON authorized_users(phone);
CREATE INDEX IF NOT EXISTS idx_authorized_users_active ON authorized_users(is_active);

-- ============================================================
-- 如果表已存在，只需执行以下两句添加新字段：
-- ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS name text DEFAULT '';
-- ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS major_direction text DEFAULT '';
-- ============================================================
