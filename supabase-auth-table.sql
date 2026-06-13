-- 浙江艺考志愿助手 — 授权用户表
-- 在 Supabase SQL Editor 中执行此文件

-- 1. 创建表
CREATE TABLE IF NOT EXISTS authorized_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT null,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 开启行级安全
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- 3. 允许匿名 key 读取（前端验证手机号是否在授权表中）
CREATE POLICY IF NOT EXISTS "Allow anon select" ON authorized_users
  FOR SELECT USING (true);

-- 4. 允许匿名 key 插入（管理员通过前端 API 添加）
CREATE POLICY IF NOT EXISTS "Allow anon insert" ON authorized_users
  FOR INSERT WITH (true);

-- 5. 允许匿名 key 更新
CREATE POLICY IF NOT EXISTS "Allow anon update" ON authorized_users
  FOR UPDATE USING (true);

-- 6. 允许匿名 key 删除
CREATE POLICY IF NOT EXISTS "Allow anon delete" ON authorized_users
  FOR DELETE USING (true);

-- 7. 索引
CREATE INDEX IF NOT EXISTS idx_authorized_users_phone ON authorized_users(phone);
CREATE INDEX IF NOT EXISTS idx_authorized_users_active ON authorized_users(is_active);

-- 8. 示例数据（可选，手动添加）
-- INSERT INTO authorized_users (phone, is_active, notes) VALUES
--   ('13800000000', true, '测试用户'),
--   ('13900000000', true, '2024届学员')
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- 使用说明：
-- 1. 在 Supabase Dashboard → SQL Editor 中粘贴此文件并执行
-- 2. 进入 Authentication → Policies，确认 authorized_users 表的策略已生效
-- 3. 在 Table Editor → authorized_users 中手动添加授权用户
-- 4. 或通过管理员后台的"授权管理"功能添加
-- ============================================================
