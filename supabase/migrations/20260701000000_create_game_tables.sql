-- 开启 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建房间表 (存储游戏基本配置)
CREATE TABLE public.rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'WAITING', -- WAITING, PLAYING, FINISHED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建游戏状态表 (高频更新表，用于前端 Realtime 实时同步)
-- 包含序列化后的 GameState
CREATE TABLE public.game_states (
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE PRIMARY KEY,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 开启 RLS (Row Level Security)。当前 MVP 测试阶段先开放匿名读写权限。
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select on rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select on game_states" ON public.game_states FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on game_states" ON public.game_states FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on game_states" ON public.game_states FOR UPDATE USING (true);

-- 为 game_states 表开启 Realtime 广播，允许前端 WebSocket 订阅
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_states;
