// src/collector.js
import { supabase } from './supabase.js'; // 아까 만든 설정 파일을 불러옵니다.
import axios from 'axios';

async function collect() {
  console.log("🚀 데이터 수집 및 저장 시작...");
  try {
    // 1. 오버워치 API에서 실시간 데이터 가져오기
    const res = await axios.get('https://overfast-api.tekrop.fr/heroes/stats?platform=pc&gamemode=competitive&region=asia');
    const stats = res.data;

    // 2. DB 테이블 구조에 맞게 데이터 변환
    const insertData = stats.map(s => ({
      hero_key: s.hero,
      winrate: s.winrate,
      pickrate: s.pickrate
    }));

    // 3. Supabase의 hero_stats_history 테이블에 저장
    const { error } = await supabase.from('hero_stats_history').insert(insertData);
    
    if (error) throw error;

    console.log("✅ 저장 완료! DB를 확인해보세요.");
  } catch (err) {
    console.error("❌ 에러 발생:", err.message);
  }
}

collect();