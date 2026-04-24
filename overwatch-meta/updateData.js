const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// ⚠️ 진짜 Supabase 주소와 키 넣기!
const supabaseUrl = 'https://cdityivlzcekjjipfhhe.supabase.co';
const supabaseKey = 'sb_publishable_MqJASS-M1uq_Gt0mCpTZ6Q_OiWWWcOo'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateData() {
  try {
    console.log('🤖 깃허브 로봇: 데이터 수집을 시작합니다...');
    
    const response = await axios.get('https://overfast-api.tekrop.fr/heroes/stats?platform=pc&gamemode=competitive&region=asia');
    const currentStats = response.data;

    const insertData = currentStats.map(stat => ({
      hero_key: stat.hero,
      winrate: stat.winrate,
      pickrate: stat.pickrate
    }));

    const { error } = await supabase.from('hero_stats_history').insert(insertData);
    
    if (error) throw error;
    
    console.log('✅ 깃허브 로봇: 데이터 자동 저장 완료!');
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    process.exit(1); 
  }
}

updateData();