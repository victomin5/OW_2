import { createClient } from '@supabase/supabase-js'

// 1. API URL (이미지 상단의 주소)
const supabaseUrl = 'https://cdtiyivlczekjjipfhhe.supabase.co'

// 2. Publishable key (이미지 중간의 sb_publishable로 시작하는 값)
const supabaseKey = 'sb_publishable_MqJASS-M1uq_Gt0mCpTZ6Q_OiWWW8IqH43O2OByrV5A7T4U-P65l-K60D7Y-YvB8-F6w8D8Y-YvB8' 

export const supabase = createClient(supabaseUrl, supabaseKey)