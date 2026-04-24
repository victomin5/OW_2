import { createClient } from '@supabase/supabase-js'

// Supabase 대시보드 -> Project Settings (톱니바퀴) -> API 메뉴에서 확인 가능합니다.
const supabaseUrl = 'https://supabase.com/dashboard/project/cdityivlzcekjjipfhhe/settings/api-keys'
const supabaseKey = 'sb_publishable_MqJASS-M1uq_Gt0mCpTZ6Q_OiWWWcOo'

export const supabase = createClient(supabaseUrl, supabaseKey)