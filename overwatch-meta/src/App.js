/* eslint-disable */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { supabase } from './supabase';

// 특정 기간 전의 데이터와 현재 데이터를 비교하는 함수
const calculateDiff = (history, days) => {
  const now = new Date();
  // 1. 기준 날짜 설정 (예: 7일 전)
  const targetDate = new Date(now.setDate(now.getDate() - days));
  
  // 2. 영웅별로 그룹화하여 가장 최근 데이터와 과거 데이터를 추출
  const result = history.reduce((acc, curr) => {
    const hero = curr.hero_key;
    const currDate = new Date(curr.created_at);

    if (!acc[hero]) {
      acc[hero] = { current: curr, past: curr };
    }

    // 가장 최근 데이터 업데이트
    if (currDate > new Date(acc[hero].current.created_at)) {
      acc[hero].current = curr;
    }

    // targetDate와 가장 가까운 과거 데이터 찾기
    const pastDiff = Math.abs(new Date(acc[hero].past.created_at) - targetDate);
    const newDiff = Math.abs(currDate - targetDate);
    if (newDiff < pastDiff) {
      acc[hero].past = curr;
    }

    return acc;
  }, {});

  // 3. 차이값 계산해서 리턴
  return Object.keys(result).map(hero => ({
    name: hero,
    diff: (result[hero].current.winrate - result[hero].past.winrate).toFixed(1),
    currWinrate: result[hero].current.winrate,
    prevWinrate: result[hero].past.winrate
  }));
};


// --- 전장 데이터 ---
const MAP_GROUPS = [
  { label: '쟁탈', maps: [{ key: 'antarctic-peninsula', name: '남극 반도' }, { key: 'nepal', name: '네팔' }, { key: 'lijiang-tower', name: '리장 타워' }, { key: 'busan', name: '부산' }, { key: 'samoa', name: '사모아' }, { key: 'oasis', name: '오아시스' }, { key: 'ilios', name: '일리오스' }] },
  { label: '호위', maps: [{ key: 'route-66', name: '66번 국도' }, { key: 'watchpoint-gibraltar', name: '감시 기지: 지브롤터' }, { key: 'dorado', name: '도라도' }, { key: 'rialto', name: '리알토' }, { key: 'shambali-monastery', name: '샴발리 수도원' }, { key: 'circuit-royal', name: '서킷 로얄' }, { key: 'junkertown', name: '쓰레기촌' }, { key: 'havana', name: '하바나' }] },
  { label: '플래시포인트', maps: [{ key: 'new-junk-city', name: '뉴 정크 시티' }, { key: 'suravasa', name: '수라바사' }, { key: 'aatlis', name: '아틀리스' }] },
  { label: '혼합', maps: [{ key: 'numbani', name: '눔바니' }, { key: 'midtown', name: '미드타운' }, { key: 'blizzard-world', name: '블리자드 월드' }, { key: 'eichenwalde', name: '아이헨발데' }, { key: 'kings-row', name: '왕의 길' }, { key: 'paraiso', name: '파라이수' }, { key: 'hollywood', name: '할리우드' }] },
  { label: '밀기', maps: [{ key: 'new-queen-street', name: '뉴 퀸 스트리트' }, { key: 'runasapi', name: '루나사피' }, { key: 'esperanca', name: '이스페란사' }, { key: 'colosseo', name: '콜로세오' }] }
];

// ⭐ 사장님이 주신 1~13번 모든 리스트를 100% 반영한 데이터
const MATCHUP_DATA = {
  "mauga": {
    "doomfist": { advantage: 'favorable', label: '매우 유리', desc: '기동성을 제외한 모든 정면 싸움 압도' },
    "lucio": { advantage: 'favorable', label: '매우 유리', desc: '이속 버프를 무시하는 저지력' },
    "reinhardt": { advantage: 'favorable', label: '유리', desc: '방벽 철거 및 근접전 우위' },
    "winston": { advantage: 'favorable', label: '유리', desc: '거대한 피격 판정으로 인한 흡혈 최적화' },
    "hazard": { advantage: 'favorable', label: '유리', desc: '맞딜 시 압도적인 화력 차이' },
    "venture": { advantage: 'favorable', label: '유리', desc: '진입하는 벤처를 역으로 녹이기 쉬움' },
    "soldier-76": { advantage: 'favorable', label: '유리', desc: '원거리 포킹만 주의하면 유지력 차이로 압승' },
    "pharah": { advantage: 'favorable', label: '유리', desc: '히트스캔 특성상 공중 견제 용이' },
    "mercy": { advantage: 'favorable', label: '유리', desc: '메르시 본체 및 연결된 대상 포커싱에 강함' },
    "juno": { advantage: 'favorable', label: '유리', desc: '단조로운 주노의 기동성을 저지하기 쉬움' },
    "ramattra": { advantage: 'favorable', label: '약간 유리', desc: '네메시스 모드 시 덩치가 커져 흡혈하기 좋음' },
    "dva": { advantage: 'neutral', label: '중립', desc: '매트릭스 관리와 돌진 타이밍 싸움' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '잡기는 힘들지만 거점 비비기 저지력은 높음' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '숨돌리기 vs 마우가 화력 싸움' },
    "mauga": { advantage: 'neutral', label: '중립', desc: '미러전: 심장각 및 자원 관리 싸움' },
    "genji": { advantage: 'neutral', label: '중립', desc: '튕겨내기 타이밍 조절 필요' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '근접 맞딜 시 리퍼의 폭딜 주의' },
    "echo": { advantage: 'neutral', label: '중립', desc: '비행 시 견제 가능하나 광선 폭딜 주의' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '에임 실력에 따라 극명하게 갈림' },
    "sombra": { advantage: 'neutral', label: '중립', desc: '해킹으로 인한 심장 박동 정지 주의' },
    "lifeweaver": { advantage: 'neutral', label: '중립', desc: '구원의 손길로 인한 킬 캐치 방해' },
    "moira": { advantage: 'neutral', label: '중립', desc: '킬을 따기는 힘들지만 위협도 낮음' },
    "zarya": { advantage: 'unfavorable', label: '약간 불리', desc: '고에너지 자리야의 방벽은 마우가 최대의 적' },
    "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '작은 히트박스와 치유 차단 궁극기' },
    "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '빙벽으로 인한 시야 및 퇴로 차단' },
    "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '덩치 큰 마우가 상대로 광선 충전이 매우 빠름' },
    "baptiste": { advantage: 'unfavorable', label: '약간 불리', desc: '불사 장치로 인한 흡혈 타이밍 무력화' },
    "kiriko": { advantage: 'unfavorable', label: '약간 불리', desc: '정화의 방울로 발화 상태 정화' },
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '강습 모드 맞딜 시 마우가가 먼저 녹음' },
    "vendetta": { advantage: 'unfavorable', label: '불리', desc: '근접전에서 마우가의 딜을 상쇄함' },
    "ash": { advantage: 'unfavorable', label: '불리', desc: '원거리 다이너마이트 포킹 및 충격 샷건' },
    "widowmaker": { advantage: 'unfavorable', label: '불리', desc: '거대한 헤드 판정으로 인해 저격에 매우 취약' },
    "junkrat": { advantage: 'unfavorable', label: '불리', desc: '좁은 골목에서의 유탄 폭딜 감당 불가' },
    "freya": { advantage: 'unfavorable', label: '불리', desc: '변칙적인 움직임으로 인해 탄 퍼짐이 심한 마우가에 불리' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '생체 수류탄(힐밴)은 마우가의 생존을 원천 봉쇄' },
    "wooyang": { advantage: 'unfavorable', label: '불리', desc: '팀 단위 세이브 및 힐량 증폭으로 킬 저지' },
    "illari": { advantage: 'unfavorable', label: '불리', desc: '태양 작렬 및 태양석을 통한 유지력 싸움 밀림' },
    "sigma": { advantage: 'unfavorable', label: '매우 불리', desc: '방벽, 키네틱 손아귀, 강착까지 모든 스킬이 카운터' },
    "sojourn": { advantage: 'unfavorable', label: '매우 불리', desc: '마우가를 샌드백 삼아 레일건 에너지 무한 충전' },
    "hanzo": { advantage: 'unfavorable', label: '매우 불리', desc: '폭풍 화살 연사 시 생존 불가능' },
    "zenyatta": { advantage: 'unfavorable', label: '매우 불리', desc: '부조화의 구슬이 박히는 순간 녹아내림' }
  },
  "orisa": {
    "doomfist": { advantage: 'favorable', label: '매우 유리', desc: '강착과 방어 강화로 둠피스트의 모든 진입을 차단' },
    "junker-queen": { advantage: 'favorable', label: '매우 유리', desc: '톱니칼과 도륙을 수호의 창으로 씹으며 대인전 압살' },
    "reinhardt": { advantage: 'favorable', label: '유리', desc: '돌진을 방어 강화로 막고 투창으로 방벽 너머 스턴' },
    "mauga": { advantage: 'favorable', label: '유리', desc: '방어 강화 시 마우가의 흡혈을 봉쇄하며 투창으로 돌진 끊기 가능' },
    "ramattra": { advantage: 'favorable', label: '유리', desc: '네메시스 모드의 접근을 투창과 수호의 창으로 밀어내기 최적화' },
    "hog": { advantage: 'favorable', label: '유리', desc: '그랩을 방어 강화로 씹고, 숨돌리기를 투창으로 끊음' },
    "genji": { advantage: 'favorable', label: '유리', desc: '투창은 튕겨내기에 막히지 않으며(기절 판정), 대인전 우위' },
    "reaper": { advantage: 'favorable', label: '약간 유리', desc: '근접 시 수호의 창으로 밀어내며 시간을 끌기 용이' },
    "wrecking-ball": { advantage: 'favorable', label: '약간 유리', desc: '파일드라이버를 방어 강화로 씹고 투창으로 볼의 기동성 저지' },
    "dva": { advantage: 'neutral', label: '중립', desc: '방어 매트릭스로 투창을 지울 수 있으나 체급 싸움은 오리사가 우위' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '방벽과 투창의 심리전, 강착을 방어 강화로 씹는 것이 핵심' },
    "bastion": { advantage: 'neutral', label: '중립', desc: '강습 모드 시 투창으로 끊거나 방어 강화로 버텨야 함' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '맞추기는 힘들지만 오리사를 한 번에 녹이기도 힘든 구조' },
    "sombra": { advantage: 'neutral', label: '중립', desc: '해킹으로 방어 강화가 끊기면 위험하나 투창 변수가 큼' },
    "cassidy": { advantage: 'neutral', label: '중립', desc: '섬광탄과 구르기 무빙에 따라 투창 적중 여부가 갈림' },
    "moira": { advantage: 'neutral', label: '중립', desc: '잡기는 불가능에 가깝지만 모이라의 딜로는 오리사를 못 뚫음' },
    "lucio": { advantage: 'unfavorable', label: '약간 불리', desc: '오리사의 정직한 투사체를 피하기 쉽고 팀을 이끌고 우회함' },
    "ana": { advantage: 'unfavorable', label: '약간 불리', desc: '투창 폼에서 수면총 적중이 쉬우며 힐밴에 취약' },
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '부조화가 박히면 방어 강화를 켜도 금방 녹음' },
    "hanzo": { advantage: 'unfavorable', label: '불리', desc: '거리 유지를 하며 폭풍 화살로 헤드라인을 긁으면 답 없음' },
    "widowmaker": { advantage: 'unfavorable', label: '불리', desc: '원거리 저격에 대항 수단이 전무함' },
    "sojourn": { advantage: 'unfavorable', label: '불리', desc: '헤드 판정이 큰 오리사는 소전의 좋은 레일건 충전기' },
    "mei": { advantage: 'unfavorable', label: '매우 불리', desc: '빙벽으로 고립되면 방어 강화가 있어도 일점사에 폭사' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '공중에 뜬 파라를 견제할 수단이 사실상 투창 뽀록뿐' },
    "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '고지대 및 공중 포킹 후 광선 마무리에 취약' },
    "zarya": { advantage: 'unfavorable', label: '매우 불리', desc: '투창과 주무기가 모두 방벽 에너지 셔틀이 됨' }
  },
  "reinhardt": {
    "doomfist": { advantage: 'favorable', label: '유리', desc: '펀치 충돌 시 동반 다운 및 근접 망치질 우위' },
    "junker-queen": { advantage: 'favorable', label: '약간 유리', desc: '체급과 방벽으로 압박 가능하나 도륙 관통 주의' },
    "mauga": { advantage: 'unfavorable', label: '불리', desc: '방벽이 순식간에 녹으며 흡혈 샌드백이 되기 쉬움' },
    "ramattra": { advantage: 'unfavorable', label: '매우 불리', desc: '네메시스 모드의 펀치가 방벽을 관통하여 직격함' },
    "orisa": { advantage: 'unfavorable', label: '불리', desc: '돌진은 방어 강화에 막히고 망치질은 투창에 끊김' },
    "hog": { advantage: 'neutral', label: '중립', desc: '그랩 방어 vs 돼재앙 밀쳐내기 싸움' },
    "sigma": { advantage: 'favorable', label: '유리', desc: '방벽을 무시하고 근접하여 망치로 시그마의 모든 방어기 무력화' },
    "winston": { advantage: 'favorable', label: '유리', desc: '진입한 윈스턴을 망치로 때려내며 진영 사수 용이' },
    "dva": { advantage: 'favorable', label: '약간 유리', desc: '매트릭스로 망치를 막을 수 없으며 자폭을 방벽으로 완벽 차단' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '잡기는 힘들지만 거점 진입을 망치와 돌진으로 견제 가능' },
    "genji": { advantage: 'favorable', label: '유리', desc: '튕겨내기를 무시하는 광역 망치 판정' },
    "tracer": { advantage: 'unfavorable', label: '약간 불리', desc: '뒤를 잡히면 대응이 불가능하며 펄스 폭탄 부착에 취약' },
    "sombra": { advantage: 'unfavorable', label: '매우 불리', desc: '해킹당하는 순간 방벽이 내려가며 고철 덩어리로 전락' },
    "reaper": { advantage: 'unfavorable', label: '불리', desc: '방벽 안으로 파고드는 리퍼의 샷건 화력을 버티기 힘듦' },
    "bastion": { advantage: 'unfavorable', label: '매우 불리', desc: '강습 모드 1초당 방벽 내구도 수천이 갈려나감' },
    "mei": { advantage: 'unfavorable', label: '매우 불리', desc: '빙벽 분단 후 냉각포 슬로우는 라인하르트의 재앙' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '하늘에 떠 있는 적에게 망치를 휘두를 수 없음' },
    "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '공중 포킹 및 방벽 내구도 낮은 시점의 광선 마무리' },
    "symmetra": { advantage: 'unfavorable', label: '불리', desc: '방벽을 때리며 탄환을 보충하고 광선 위력을 풀충전함' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '방벽을 내리는 찰나의 수면총과 힐밴에 매우 취약' },
    "zenyatta": { advantage: 'unfavorable', label: '매우 불리', desc: '부조화가 붙으면 방벽 뒤에서도 압박감이 극심함' },
    "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '어렵게 맞춘 돌진이나 대지분쇄를 구원의 손길/나무로 카운터' },
    "lucio": { advantage: 'favorable', label: '유리(아군일 때)', desc: '속도 증폭 없는 라인하르트는 뚜벅이에 불과함' },
    "kiriko": { advantage: 'unfavorable', label: '약간 불리', desc: '대지분쇄 넉다운을 정화의 방울로 즉시 해제' }
  },
  "zarya": {
    "dva": { advantage: 'favorable', label: '매우 유리', desc: '매트릭스로 막을 수 없는 입자 광선으로 디바를 압살' },
    "orisa": { advantage: 'favorable', label: '매우 유리', desc: '투창과 주무기가 모두 방벽 에너지 셔틀이 되며 수호의 창을 광선으로 관통' },
    "junker-queen": { advantage: 'favorable', label: '매우 유리', desc: '톱니칼, 도륙, 살육의 힐밴을 방벽 하나로 모두 무력화 및 정화' },
    "genji": { advantage: 'favorable', label: '매우 유리', desc: '튕겨내기를 무시하는 광선과 용검을 차단하는 방벽의 존재' },
    "sombra": { advantage: 'favorable', label: '매우 유리', desc: '해킹을 방벽으로 즉시 정화하며 위치 변환기 도주 경로에 우클릭 견제 용이' },
    "junkrat": { advantage: 'favorable', label: '매우 유리', desc: '정크랫의 정직한 유탄은 자리야의 에너지를 순식간에 100으로 만듦' },
    "cassidy": { advantage: 'favorable', label: '매우 유리', desc: '섬광탄을 방벽으로 씹기 쉽고 덩치 큰 캐서디는 광선의 좋은 먹잇감' },
    "anlan": { advantage: 'favorable', label: '매우 유리', desc: '부상과 힐밴 디버프를 방벽으로 간단히 지우며 대응' },
    "sigma": { advantage: 'favorable', label: '유리', desc: '키네틱 손아귀를 광선으로 무시하며 방벽 에너지 수급이 쉬움 (단, 팀파이트 시 장거리 포킹 주의)' },
    "hazard": { advantage: 'favorable', label: '약간 유리', desc: '해저드의 가시 공격을 방벽으로 받아내며 에너지 충전' },
    "venture": { advantage: 'favorable', label: '유리', desc: '진입하는 벤처의 콤보를 방벽으로 흡수하고 역공' },
    "torbjorn": { advantage: 'favorable', label: '유리', desc: '포탑의 자동 사격을 이용해 확정적으로 에너지를 채울 수 있음' },
    "tracer": { advantage: 'favorable', label: '유리', desc: '펄스 폭탄을 방벽으로 무력화하며 트레이서의 물몸을 광선으로 지짐' },
    "bastion": { advantage: 'favorable', label: '유리', desc: '수색 모드 시 유리하나 강습 모드 시 방벽이 순식간에 깨지므로 주의 필요' },
    "ana": { advantage: 'favorable', label: '유리', desc: '힐밴과 수면총을 방벽으로 정화 및 방어 가능' },
    "illari": { advantage: 'favorable', label: '유리', desc: '태양 작렬을 방벽으로 무력화 가능' },
    "lucio": { advantage: 'favorable', label: '유리', desc: '루시우의 밀치기를 무시하며 근접 시 광선으로 압박' },
    "brigitte": { advantage: 'favorable', label: '유리', desc: '브리기테의 방벽을 광선으로 빠르게 철거' },
    "kiriko": { advantage: 'favorable', label: '유리', desc: '헤드샷만 주의하면 정화의 방울을 빼기 쉬운 구조' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '펀치 타이밍에 방벽을 켜느냐, 파워 블락 시 에너지를 안 주느냐의 싸움' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '그랩을 방벽으로 막을 수 있으나 돼재앙의 방벽 파괴력은 경계 대상' },
    "zarya": { advantage: 'neutral', label: '중립', desc: '미러전: 방벽 관리와 에너지 유지력 싸움' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '근접 샷건은 위협적이나 방벽으로 한 턴 버티며 역공 가능' },
    "vendetta": { advantage: 'neutral', label: '유동적', desc: '근접전 화력 싸움에서 방벽 유무에 따라 승패 결정' },
    "moira": { advantage: 'neutral', label: '중립', desc: '모이라의 구슬로 에너지를 채우기 좋으나 처치하기는 어려움' },
    "juno": { advantage: 'neutral', label: '중립', desc: '주노의 기동성을 광선으로 따라가기 까다로움' },
    "mauga": { advantage: 'unfavorable', label: '약간 불리', desc: '마우가의 압도적인 화력 앞에 방벽이 너무 빨리 소모됨' },
    "soldier-76": { advantage: 'unfavorable', label: '약간 불리', desc: '거리 유지하며 포킹하는 솔저를 잡기 힘듦' },
    "ashe": { advantage: 'unfavorable', label: '약간 불리', desc: '다이너마이트는 에너지 셔틀이나 원거리 저격은 위협적' },
    "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '서로 광선 싸움이나 시메트라가 방벽을 때려 탄환을 보충함' },
    "domina": { advantage: 'unfavorable', label: '불리', desc: '방벽 너머의 아군 보호 능력이 자리야보다 뛰어남' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '네메시스 펀치가 방벽을 관통하여 본체에 타격' },
    "reinhardt": { advantage: 'unfavorable', label: '불리', desc: '방벽을 무시하고 들어오는 망치질과 방벽을 부수는 돌진' },
    "wrecking-ball": { advantage: 'unfavorable', label: '불리', desc: '볼을 잡기 위해 광선을 낭비하는 사이 진영이 붕괴됨' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '빙벽으로 분단되면 방벽이 있어도 생존이 어려움' },
    "sojourn": { advantage: 'unfavorable', label: '불리', desc: '방벽을 때려 레일건 에너지를 채워 아군 딜러를 저격함' },
    "widowmaker": { advantage: 'unfavorable', label: '불리', desc: '자리야의 사거리 밖에서 아군을 하나씩 끊어냄' },
    "winston": { advantage: 'unfavorable', label: '매우 불리', desc: '방벽 안팎을 오가며 지지는 윈스턴은 자리야 최고의 천적' },
    "hanzo": { advantage: 'unfavorable', label: '매우 불리', desc: '한조의 폭풍 화살은 방벽을 순식간에 깨고 본체를 처치' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '하늘에 떠서 일방적으로 폭격하는 파라를 견제할 수단 없음' },
    "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '비행 기동성과 낙사 변수에 대처 불가능' }
  },
  "wrecking-ball": {
    "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '저격 지점까지 가장 빠르게 접근하여 위도우를 무력화' },
    "hanzo": { advantage: 'favorable', label: '유리', desc: '고지대 점거 중인 한조를 밀어내고 암살하기 용이' },
    "zenyatta": { advantage: 'favorable', label: '유리', desc: '뚜벅이인 젠야타에게 파일드라이버 콤보는 치명적' },
    "ana": { advantage: 'favorable', label: '약간 유리', desc: '수면총만 피한다면 아나의 생존기를 빼기 가장 좋은 영웅' },
    "mercy": { advantage: 'favorable', label: '약간 유리', desc: '수호천사 이동 경로를 몸박으로 방해하며 집요하게 추격 가능' },
    "ashe": { advantage: 'favorable', label: '유리', desc: '충격 샷건의 밀치기를 무시하고 다시 붙을 수 있는 기동성' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '방벽을 무시하고 진영을 흔들 수 있으나 강착 스턴은 주의' },
    "winston": { advantage: 'neutral', label: '중립', desc: '서로 뒷라인을 무는 싸움이나 볼의 생존력이 더 우위' },
    "dva": { advantage: 'neutral', label: '중립', desc: '부스터로 볼을 쫓아올 수 있어 도주가 까다로움' },
    "zarya": { advantage: 'neutral', label: '중립', desc: '자리야에게 에너지를 주기 쉽지만 진형 붕괴 능력으로 커버' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '서로 잡기 힘들지만 볼의 광역 딜이 트레이서에게 압박' },
    "genji": { advantage: 'neutral', label: '중립', desc: '튕겨내기를 무시하는 몸박과 파일드라이버' },
    "lucio": { advantage: 'neutral', label: '중립', desc: '벽타는 루시우를 잡긴 힘들지만 진영 싸움에서 비등함' },
    "doomfist": { advantage: 'unfavorable', label: '약간 불리', desc: '볼의 구르기를 펀치로 끊을 수 있어 기동성이 제약됨' },
    "junker-queen": { advantage: 'unfavorable', label: '불리', desc: '톱니칼에 꽂히면 도주 불가, 파일드라이버 시 도륙 확정 타격' },
    "roadhog": { advantage: 'unfavorable', label: '불리', desc: '거대한 맷집도 호그의 그랩 앞에서는 궁극기 셔틀' },
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '강습 모드 바스티온 앞에서 볼은 순식간에 고철이 됨' },
    "reaper": { advantage: 'unfavorable', label: '불리', desc: '진입했을 때 리퍼의 샷건 화력을 견디기 힘듦' },
    "torbjorn": { advantage: 'unfavorable', label: '불리', desc: '포탑의 자동 조준이 볼의 자유로운 기동을 방해함' },
    "symmetra": { advantage: 'unfavorable', label: '매우 불리', desc: '감시 포탑의 슬로우가 걸리는 순간 볼은 아무것도 못 함' },
    "mei": { advantage: 'unfavorable', label: '매우 불리', desc: '냉각포 슬로우와 빙벽은 볼에게 사형 선고' },
    "sombra": { advantage: 'unfavorable', label: '매우 불리', desc: '해킹당해 공 모드가 풀리는 순간 확정 사망' },
    "ana": { advantage: 'unfavorable', label: '약간 불리', desc: '실패 시 리스크가 크지만 수면총 적중 시 바로 폭사' },
    "brigitte": { advantage: 'unfavorable', label: '매우 불리', desc: '밀쳐내기와 방밀 기절로 볼의 모든 진입을 완벽 차단' },
    "junkrat": { advantage: 'unfavorable', label: '매우 불리', desc: '강철 덫에 걸리면 기동성 캐릭으로서의 장점 소멸' }
  },
  "ramattra": {
    "reinhardt": { advantage: 'favorable', label: '매우 유리', desc: '네메시스 모드의 펀치가 방벽을 무시하고 타격하며, 라인하르트의 접근을 탐식의 소용돌이로 저지' },
    "brigitte": { advantage: 'favorable', label: '매우 유리', desc: '방벽을 관통하는 공격으로 브리기테의 생존력을 무력화' },
    "sigma": { advantage: 'favorable', label: '유리', desc: '방벽과 키네틱 손아귀를 모두 무시하는 네메시스 펀치와 궁극기' },
    "zarya": { advantage: 'favorable', label: '유리', desc: '방벽을 관통하여 본체를 직접 타격할 수 있으며, 소용돌이로 기동 방해' },
    "junkrat": { advantage: 'favorable', label: '유리', desc: '원거리 옴닉 폼의 포킹과 네메시스 폼의 높은 맷집으로 우위' },
    "genji": { advantage: 'favorable', label: '유리', desc: '튕겨내기를 무시하는 펀치 공격과 2단 점프를 봉쇄하는 소용돌이' },
    "widowmaker": { advantage: 'favorable', label: '약간 유리', desc: '원거리 방벽으로 저격을 차단하고 옴닉 폼의 정교한 포킹으로 견제' },
    "mercy": { advantage: 'favorable', label: '약간 유리', desc: '소용돌이로 수호천사 비행을 방해하여 지면으로 끌어내림' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '펀치와 블락의 심리전 싸움, 라마트라가 버티기엔 좋으나 둠피를 잡기는 힘듦' },
    "dva": { advantage: 'neutral', label: '중립', desc: '매트릭스로 펀치를 막을 수 없지만, 디바의 기동성으로 라마트라의 궁극기 범위 탈출 용이' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '소용돌이로 볼의 가속을 멈출 수 있으나 확실한 킬 결정력은 부족' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '네메시스 폼의 방어력으로 버틸 수 있지만, 리퍼의 근접 흡혈 맞딜은 위협적' },
    "moira": { advantage: 'neutral', label: '중립', desc: '서로 잡기 힘든 상성, 절멸(궁극기) 사용 시 모이라의 소멸로 회피 가능' },
    "lucio": { advantage: 'unfavorable', label: '약간 불리', desc: '라마트라의 느린 기동성을 루시우의 이속과 밀쳐내기로 농락' },
    "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '근접전에서 정커퀸의 출혈 유지력과 치유 차단 궁극기에 취약' },
    "mauga": { advantage: 'unfavorable', label: '약간 불리', desc: '네메시스 폼의 거대한 히트박스가 마우가의 흡혈 샌드백이 됨' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '네메시스 변신이나 궁극기 사용 시 수면총과 힐밴의 집중 표적' },
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '부조화의 구슬이 박히면 네메시스 모드의 방어력 증가가 무의미해짐' },
    "hanzo": { advantage: 'unfavorable', label: '불리', desc: '폭풍 화살의 순간 화력으로 네메시스 폼을 순식간에 해체' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '고고도 비행 중인 파라를 견제할 수단이 전무함' },
    "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '공중 포킹 및 복제(궁극기)를 통한 변수 창출에 대처하기 어려움' },
    "bastion": { advantage: 'unfavorable', label: '매우 불리', desc: '강습 모드의 화력은 라마트라의 가드(블락)조차 뚫어버림' },
    "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '투창과 수호의 창으로 라마트라의 진입을 원거리에서 계속 밀쳐냄' }
  },
  "junker-queen": {
    "ramattra": { advantage: 'favorable', label: '유리', desc: '네메시스 변신 시 커지는 히트박스 덕분에 톱니칼 적중 및 피흡이 용이함' },
    "reinhardt": { advantage: 'favorable', label: '유리', desc: '도륙이 방벽을 관통하며, 자원 싸움에서 우위를 점해 라인을 수동적으로 만듦' },
    "wrecking-ball": { advantage: 'favorable', label: '유리', desc: '파일드라이버로 내려오는 경로가 톱니칼에 취약하며, 끌어당기기로 기동성 저지' },
    "moira": { advantage: 'favorable', label: '매우 유리', desc: '모이라의 낮은 딜로는 퀸을 녹일 수 없으며, 융화 타이밍을 살육으로 완벽 카운터' },
    "symmetra": { advantage: 'favorable', label: '매우 유리', desc: '감시 포탑을 평타로 쉽게 제거하며, 근접 시 시메트라의 생존력이 퀸을 못 버팀' },
    "lifeweaver": { advantage: 'favorable', label: '유리', desc: '살육으로 나무의 힐량을 무시할 수 있으며, 큰 히트박스 덕분에 톱니칼 표적이 됨' },
    "winston": { advantage: 'favorable', label: '약간 유리', desc: '도륙의 방벽 관통과 윈스턴이 도망갈 때 톱니칼로 끌어오기 가능' },
    "mauga": { advantage: 'favorable', label: '약간 유리', desc: '벽을 끼고 갉아먹으며 살육의 치유 차단으로 마우가의 핵심 생존 기믹을 파괴' },
    "hazard": { advantage: 'favorable', label: '약간 유리', desc: '해저드의 가시벽 고립을 살육이나 도륙의 다수 적중으로 버텨내며 역공 가능' },
    "tracer": { advantage: 'favorable', label: '약간 유리', desc: '히트스캔 산탄총의 집탄율이 좋아 트레이서의 역행을 빠르게 강제함' },
    "genji": { advantage: 'favorable', label: '약간 유리', desc: '근접전 우위 및 높은 자가 회복량으로 겐지가 퀸을 따기 매우 어려움' },
    "dva": { advantage: 'neutral', label: '중립', desc: '매트릭스로 칼을 막을 수 있으나 근접 난전 체급은 퀸이 우세 (티어가 높을수록 디바 유리)' },
    "domina": { advantage: 'neutral', label: '중립', desc: '정면 싸움은 불리하나 측면을 파고들어 진형을 무너뜨리면 승산 있음' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '맞딜은 이기지만 둠피의 기동성을 쫓기 힘들고 파워 블락 에너지를 주기 쉬움' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '살육이 숨돌리기를 막지만, 호그의 그랩 원콤과 돼재앙의 궁 캔슬 위험이 공존' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '강착에 도륙이 끊길 위험이 크며 사거리 차이로 인해 진입 난이도가 높음' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '둘 다 근접 최강자, 지휘의 외침과 리퍼의 망령화 교환 타이밍 싸움' },
    "sojourn": { advantage: 'unfavorable', label: '약간 불리', desc: '레일건 포킹과 슬라이딩의 기동성을 퀸의 뚜벅이 성능으로 잡기 까다로움' },
    "lucio": { advantage: 'unfavorable', label: '약간 불리', desc: '도륙 타이밍에 밀쳐내기로 방해하며, 살육을 비트(소리 방벽)로 상쇄함' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '살육 시전 시 수면총에 취약하며, 퀸 본인이 힐밴을 맞으면 생존 수단이 없음' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '빙벽으로 진입로가 차단되고 냉각수 슬로우에 걸리면 퀸의 장점인 기동 이속이 무력화' },
    "zarya": { advantage: 'unfavorable', label: '매우 불리', desc: '퀸의 모든 출혈 디버프와 힐밴을 방벽 하나로 지워버리며 에너지 셔틀이 됨' },
    "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '방어 강화로 넉백 무시, 수호의 창으로 칼과 도륙 방어, 투창으로 살육 캔슬 가능' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '하늘에 떠 있는 파라를 견제할 수단이 톱니칼 뽀록 외엔 전혀 없음' },
    "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '공중 포킹에 무력하며 에코가 퀸을 복제할 경우 대응책이 부재함' },
    "widowmaker": { advantage: 'unfavorable', label: '매우 불리', desc: '접근 자체가 불가능한 맵이 많으며 원거리 저격에 아군이 터지는 것을 구경만 해야 함' },
    "kiriko": { advantage: 'unfavorable', label: '매우 불리', desc: '정화의 방울이 살육의 힐밴과 모든 출혈을 즉시 제거하는 하드 카운터' },
    "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '공중 기동성을 따라잡을 수 없으며 머리 잡기 낙사에 속수무책' }
  },
  "dva": {
    "pharah": { advantage: 'favorable', label: '매우 유리', desc: '부스터로 근접하여 미사일 폭딜 및 매트릭스로 포화 완벽 차단' },
    "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '저격 위치까지 가장 빠르게 도달하여 위도우의 프리딜을 원천 봉쇄' },
    "winston": { advantage: 'favorable', label: '유리', desc: '윈스턴의 테슬라 캐논을 몸으로 버티며 산탄총으로 헤드 판정 압살' },
    "mercy": { advantage: 'favorable', label: '유리', desc: '수호천사로 도망가는 메르시를 끝까지 추격하여 처치 가능' },
    "ashe": { advantage: 'favorable', label: '유리', desc: '다이너마이트와 밥(B.O.B)의 사격을 매트릭스로 모두 지워버림' },
    "bastion": { advantage: 'favorable', label: '약간 유리', desc: '강습 모드의 화력을 매트릭스로 받아내며 팀원이 진입할 시간을 벌어줌' },
    "junkrat": { advantage: 'favorable', label: '약간 유리', desc: '유탄과 타이어 폭발(타이밍 중요)을 매트릭스로 무력화' },
    "soldier-76": { advantage: 'favorable', label: '약간 유리', desc: '전술 조준경 사용 시 매트릭스만 켜고 있어도 1인분' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '둠피의 펀치는 못 막지만, 그 외 모든 투사체를 지우며 기동성 대결' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '그랩에 끌려가면 치명적이나, 아군이 끌려갔을 때 매트릭스 세이브 가능' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '강착은 못 막아도 주무기와 궁극기를 매트릭스로 지우는 심리전' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '근접 샷건은 위협적이나 죽음의 꽃을 매트릭스로 완벽 카운터' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '잡기는 힘들지만 트레이서의 포킹을 지속적으로 방해 가능' },
    "hanzo": { advantage: 'neutral', label: '중립', desc: '폭풍 화살을 지울 수 있으나 원거리 헤드샷 한 방에 메카가 터질 위험' },
    "ana": { advantage: 'unfavorable', label: '약간 불리', desc: '수면총과 힐밴을 지울 수 있지만, 하나라도 허용하는 순간 메카 해체' },
    "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '톱니칼과 도륙의 근접 출혈 딜은 매트릭스로 막을 수 없음' },
    "somba": { advantage: 'unfavorable', label: '불리', desc: '해킹당하는 순간 매트릭스와 부스터가 봉인되어 샌드백으로 전락' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '매트릭스를 무시하는 냉각포 슬로우와 빙벽 분단에 매우 취약' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '네메시스 모드의 펀치는 매트릭스를 관통하여 본체 타격' },
    "reinhardt": { advantage: 'unfavorable', label: '불리', desc: '방벽을 뚫을 화력이 부족하며 망치질과 돌진은 매트릭스로 방어 불가' },
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '부조화가 붙으면 메카 내구도가 순식간에 녹아내림' },
    "brigitte": { advantage: 'unfavorable', label: '매우 불리', desc: '도리깨 투척과 방밀 등 매트릭스를 무시하는 CC기가 너무 많음' },
    "symmetra": { advantage: 'unfavorable', label: '매우 불리', desc: '광선이 매트릭스를 관통하며, 메카 체급이 커서 광선 충전 셔틀이 됨' },
    "zarya": { advantage: 'unfavorable', label: '매우 불리', desc: '디바의 최대 천적. 광선은 매트릭스를 무시하며 자폭도 방벽에 막힘' }
  },
  "doomfist": {
    "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '최상급 기동성으로 저격 위치를 급습하여 원콤 가능' },
    "hanzo": { advantage: 'favorable', label: '유리', desc: '이단 점프로 도망가는 한조를 추격하여 벽꿍으로 제압' },
    "zenyatta": { advantage: 'favorable', label: '유리', desc: '생존기가 없는 젠야타에게 둠피스트의 콤보는 재앙' },
    "ana": { advantage: 'favorable', label: '유리', desc: '수면총만 빗나가게 유도하면 아나를 가장 확실하게 암살 가능' },
    "genji": { advantage: 'favorable', label: '약간 유리', desc: '튕겨내기를 무시하는 강화 펀치와 지면 강타 판정' },
    "baptiste": { advantage: 'favorable', label: '약간 유리', desc: '불사 장치 밖으로 적을 밀쳐내거나 본체를 먼저 포커싱하기 용이' },
    "wrecking-ball": { advantage: 'favorable', label: '약간 유리', desc: '볼의 구르기 가속을 펀치로 끊어 기동성을 완전히 봉쇄' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '키네틱 손아귀를 펀치로 캔슬 가능하나 강착 스턴은 주의 필요' },
    "winston": { advantage: 'neutral', label: '중립', desc: '서로 뒷라인을 누가 더 잘 터뜨리냐의 기동성 싸움' },
    "reinhardt": { advantage: 'neutral', label: '중립', desc: '방벽을 무시하고 타격 가능하지만 돌진/망치와 맞딜 시 동반 다운 위험' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '잡기는 매우 힘들지만 펀치 한 방에 트레이서를 빈사 상태로 만듦' },
    "junker-queen": { advantage: 'neutral', label: '중립', desc: '퀸의 출혈 딜을 블락으로 견디며 강화 펀치를 채울 수 있으나 맞딜은 밀림' },
    "kiriko": { advantage: 'unfavorable', label: '약간 불리', desc: '벽꿍 각을 잡으면 순보로 도망가고, 강화 펀치 기절을 정화로 해제' },
    "roadhog": { advantage: 'unfavorable', label: '불리', desc: '둠피의 모든 진입이 호그의 그랩 한 번에 사형 선고로 변함' },
    "mauga": { advantage: 'unfavorable', label: '불리', desc: '맞딜 시 마우가의 흡혈을 감당할 수 없으며 파워 블락 시 화상 딜 누적' },
    "cassidy": { advantage: 'unfavorable', label: '불리', desc: '자력 수류탄에 걸리는 순간 모든 기동 스킬이 봉인되어 폭사' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '공중에 떠 있는 파라에게 펀치를 맞추는 것은 불가능에 가까움' },
    "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '포킹과 기동성에서 밀리며, 체력이 낮을 때 광선 마무리에 취약' },
    "mei": { advantage: 'unfavorable', label: '매우 불리', desc: '냉각포 슬로우로 둠피의 속도를 죽이고 빙벽으로 도주로 차단' },
    "sombra": { advantage: 'unfavorable', label: '매우 불리', desc: '둠피스트 최대의 하드 카운터. 해킹 한 번에 고기 방패로 전락' },
    "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '방어 강화로 펀치 무시, 투창으로 블락 캔슬, 수호의 창으로 밀쳐내기까지 모든 스킬이 카운터' },
    "brigitte": { advantage: 'unfavorable', label: '매우 불리', desc: '방패 밀치기로 펀치 맞대응 및 도리깨 투척으로 진입 원천 봉쇄' }
  },
  "domina": {
    "reinhardt": { advantage: 'favorable', label: '매우 유리', desc: '라인의 방벽을 무력화하는 고유 기믹과 근접 제어 능력 우위' },
    "junker-queen": { advantage: 'favorable', label: '유리', desc: '퀸의 진입을 원거리에서 억제하며, 근접 시에도 강한 판정으로 압도' },
    "mauga": { advantage: 'favorable', label: '유리', desc: '마우가의 돌진을 저지하거나 특정 구역에 고립시켜 흡혈 효율을 급감시킴' },
    "doomfist": { advantage: 'favorable', label: '약간 유리', desc: '둠피스트의 변칙적인 진입 경로를 미리 차단하거나 착지 지점을 예측 타격' },
    "genji": { advantage: 'favorable', label: '유리', desc: '튕겨내기로 막을 수 없는 공격 방식과 겐지의 기동성을 묶는 군중 제어기' },
    "tracer": { advantage: 'favorable', label: '유리', desc: '트레이서가 점멸로 피하기 까다로운 광역 판정 및 압박감' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '리퍼의 망령화 타이밍과 도미나의 핵심 스킬 교환 싸움' },
    "dva": { advantage: 'neutral', label: '중립', desc: '매트릭스로 일부 투사체는 지울 수 있으나 도미나의 물리적 압박은 디바에게 치명적' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '그랩에 끌려가면 위험하지만, 호그의 자가 치유를 방해할 수단 보유' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '원거리 포킹전은 시그마 우위, 진영 붕괴 및 근접전은 도미나 우위' },
    "zarya": { advantage: 'unfavorable', label: '약간 불리', desc: '도미나의 강력한 한 방이 자리야의 방벽 에너지를 순식간에 채워줌' },
    "sombra": { advantage: 'unfavorable', label: '불리', desc: '스킬 의존도가 높아 해킹 시 연계 플레이가 완전히 끊김' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '빙벽을 통한 시야 차단과 슬로우 효과는 도미나의 위치 선정에 큰 제약' },
    "hanzo": { advantage: 'unfavorable', label: '불리', desc: '도미나의 히트박스가 노출되는 순간 한조의 고데미지 화살에 노출' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '공중 유닛에 대한 직접적인 타격 수단이 부족하여 일방적으로 맞기 쉬움' },
    "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '비행 기동성과 폭발적인 순간 화력을 도미나의 속도로 따라가기 힘듦' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '덩치가 큰 편이라 수면총 적중률이 높고 힐밴 시 유지력 급락' },
    "zenyatta": { advantage: 'unfavorable', label: '매우 불리', desc: '부조화가 박힌 채로 진입하다가 원거리에서 해체당할 위험 큼' }
  },
  "winston": {
    "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '윈스턴 존재 자체만으로 위도우의 프리딜은 끝, 추격 능력 완벽' },
    "hanzo": { advantage: 'favorable', label: '유리', desc: '폭풍 화살만 방벽으로 넘기면 암살 가능, 2단 점프 추격 용이' },
    "genji": { advantage: 'favorable', label: '유리', desc: '튕겨내기를 무시하는 테슬라 캐논, 겐지의 도주 경로를 점프팩으로 따라감' },
    "zarya": { advantage: 'favorable', label: '매우 유리', desc: '방벽 안팎을 오가는 무빙으로 자리야의 광선을 씹으며 일방적으로 타격' },
    "zenyatta": { advantage: 'favorable', label: '유리', desc: '부조화가 박히기 전 진입하면 생존기 없는 젠야타는 확정 킬' },
    "ana": { advantage: 'favorable', label: '약간 유리', desc: '방벽으로 수면총과 힐밴을 차단하는 것이 핵심, 실패 시 역카운터' },
    "mercy": { advantage: 'favorable', label: '약간 유리', desc: '수호천사 쿨타임보다 윈스턴의 점프팩 압박이 더 강력함' },
    "sigma": { advantage: 'favorable', label: '약간 유리', desc: '시그마의 방벽을 무시하고 본체를 지질 수 있으며 강착 피하기 쉬움' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '서로 뒷라인을 무는 속도 싸움, 윈스턴이 방벽으로 둠피의 힐을 차단 가능' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '잡기는 불가능하나 볼이 진입했을 때 방벽으로 아군 보호 가능' },
    "dva": { advantage: 'unfavorable', label: '유리(산탄총 주의)', desc: '체급 싸움에서 디바에게 밀리며 메카 내구도를 깎기엔 화력이 부족' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '트레이서를 잡긴 힘들지만 윈스턴의 광역 딜이 점멸 동선을 제약함' },
    "sombra": { advantage: 'unfavorable', label: '약간 불리', desc: '진입 시 해킹당하면 점프팩이 봉인되어 그대로 고립됨' },
    "soldier-76": { advantage: 'unfavorable', label: '약간 불리', desc: '장거리 포킹으로 윈스턴의 방벽을 미리 깎고 생체장으로 버티기 가능' },
    "bastion": { advantage: 'unfavorable', label: '매우 불리', desc: '강습 모드 바스티온은 윈스턴의 방벽과 본체를 1초 만에 갈아버림' },
    "reaper": { advantage: 'unfavorable', label: '매우 불리', desc: '테슬라 캐논 간지러운 딜로는 리퍼의 샷건 흡혈을 절대 못 이김' },
    "mauga": { advantage: 'unfavorable', label: '매우 불리', desc: '마우가에게 윈스턴은 걸어 다니는 거대 힐팩이자 궁극기 셔틀' },
    "roadhog": { advantage: 'unfavorable', label: '매우 불리', desc: '그랩에 끌려가는 순간 방벽이고 뭐고 즉시 해체당함' },
    "junker-queen": { advantage: 'unfavorable', label: '불리', desc: '근접전 화력 차이가 극심하며 윈스턴의 큰 덩치는 톱니칼의 좋은 먹잇감' },
    "brigitte": { advantage: 'unfavorable', label: '불리', desc: '도리깨 투척으로 점프 진입을 끊고 방벽 안에서도 윈스턴을 밀쳐냄' },
    "torbjorn": { advantage: 'unfavorable', label: '불리', desc: '포탑의 자동 사격과 토르비욘의 과부하 맞딜을 견디기 힘듦' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '방벽 안으로 들어오는 메이의 냉각포는 윈스턴의 기동성을 완벽 차단' }
  },
  "sigma": {
    "mauga": { advantage: 'favorable', label: '매우 유리', desc: '강착으로 돌진을 끊고, 키네틱 손아귀로 마우가의 모든 탄환을 추가 체력으로 흡수' },
    "bastion": { advantage: 'favorable', label: '유리', desc: '강습 모드 화력을 손아귀로 받아내며 시간을 끌고, 강착으로 모드 해제 유도 가능' },
    "ash": { advantage: 'favorable', label: '유리', desc: '방벽으로 사선을 차단하고 다이너마이트를 손아귀로 흡수하며 밥(B.O.B)을 방벽 뒤에 고립시킴' },
    "widowmaker": { advantage: 'favorable', label: '유리', desc: '원하는 위치에 방벽을 배치해 위도우의 각을 가장 유연하게 차단' },
    "cassidy": { advantage: 'favorable', label: '약간 유리', desc: '섬광탄과 황야의 무법자를 방벽이나 손아귀로 완벽하게 카운터 가능' },
    "soldier-76": { advantage: 'favorable', label: '약간 유리', desc: '솔저의 지속 포킹과 전술 조준경을 방벽 및 손아귀로 무력화' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '그랩을 방벽으로 막느냐, 숨돌리기를 강착으로 끊느냐의 심리전 싸움' },
    "dva": { advantage: 'neutral', label: '중립', desc: '강착은 매트릭스에 안 막히지만, 시그마의 평타와 초중력 붕괴가 매트릭스에 제약됨' },
    "orisa": { advantage: 'neutral', label: '중립', desc: '강착을 방어 강화로 씹히면 불리하나, 방벽으로 오리사의 포킹을 효율적으로 차단' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '파워 블락을 강착으로 뚫을 수 있지만, 둠피의 기동성에 방벽이 무용지물 되기 쉬움' },
    "junker-queen": { advantage: 'neutral', label: '중립', desc: '사거리 우위를 점할 수 있으나 도륙과 톱니칼에 노출되는 근접전은 위험' },
    "genji": { advantage: 'unfavorable', label: '약간 불리', desc: '강착이 튕겨내기에 막히진 않으나, 겐지의 기동성을 평타로 맞추기 매우 어려움' },
    "tracer": { advantage: 'unfavorable', label: '약간 불리', desc: '시그마의 느린 공격 딜레이 사이로 파고드는 트레이서를 떼어내기 힘듦' },
    "wrecking-ball": { advantage: 'unfavorable', label: '약간 불리', desc: '강착으로 멈출 순 있으나 볼이 휘젓고 다니는 진형 파괴에 대처가 느림' },
    "zarya": { advantage: 'unfavorable', label: '불리', desc: '입자 광선은 키네틱 손아귀로 막을 수 없으며, 시그마의 정직한 투사체는 자리야의 좋은 에너지원' },
    "ramattra": { advantage: 'unfavorable', label: '매우 불리', desc: '네메시스 펀치는 방벽과 손아귀를 모두 관통하여 시그마 본체에 타격을 입힘' },
    "reinhardt": { advantage: 'unfavorable', label: '매우 불리', desc: '라인하르트가 방벽을 들고 붙으면 시그마의 모든 방어 기재가 무시당함' },
    "winston": { advantage: 'unfavorable', label: '불리', desc: '방벽을 무시하고 지지는 테슬라 캐논과 방벽 안으로 뛰어드는 진입에 취약' },
    "symmetra": { advantage: 'unfavorable', label: '매우 불리', desc: '방벽을 때려 광선을 풀충전하며, 손아귀를 무시하고 시그마를 녹여버림' },
    "mei": { advantage: 'unfavorable', label: '매우 불리', desc: '냉각포는 손아귀로 못 막으며, 빙벽으로 고립되면 탈출기가 없는 시그마는 확정 사망' },
    "pharah": { advantage: 'unfavorable', label: '불리', desc: '고도가 높은 파라를 맞추기 힘들며 방벽 내구도가 포격에 금방 소모됨' },
    "echo": { advantage: 'unfavorable', label: '불리', desc: '공중 포킹 및 광선 마무리는 손아귀로 막을 수 없는 치명적인 위협' },
    "sombra": { advantage: 'unfavorable', label: '매우 불리', desc: '해킹으로 방벽이 회수되고 손아귀가 끊기면 시그마는 거대한 샌드백일 뿐' }
  },
  "hazard": {
    "mauga": { advantage: 'unfavorable', label: '불리', desc: '마우가의 압도적인 화력에 가시벽이 너무 빨리 파괴되며 흡혈 샌드백이 되기 쉬움' },
    "orisa": { advantage: 'unfavorable', label: '약간 불리', desc: '투창으로 해저드의 진입을 끊기 쉽고, 방어 강화로 해저드의 군중 제어기를 무시함' },
    "reinhardt": { advantage: 'neutral', label: '중립', desc: '근접전은 강력하나 라인의 방벽을 뚫기 어렵고 돌진과 가시벽의 심리전 싸움' },
    "zarya": { advantage: 'unfavorable', label: '약간 불리', desc: '해저드의 가시 파편 공격이 자리야의 방벽 에너지를 채워주기 매우 좋은 먹잇감' },
    "winston": { advantage: 'favorable', label: '약간 유리', desc: '방벽 안으로 들어온 윈스턴을 가시벽으로 고립시켜 점프팩 도주를 차단 가능' },
    "dva": { advantage: 'neutral', label: '중립', desc: '매트릭스로 해저드의 투사체를 지울 수 있으나 근접 난전 체급은 해저드가 우세' },
    "doomfist": { advantage: 'favorable', label: '유리', desc: '둠피스트의 진입로에 가시벽을 세워 기동성을 제약하고 근접 화력으로 압도' },
    "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '퀸의 출혈 유지력과 살육의 치유 차단이 해저드의 버티기 능력을 저하시킴' },
    "sigma": { advantage: 'favorable', label: '유리', desc: '방벽 뒤에 숨은 시그마를 가시벽으로 끌어내거나 고립시켜 근접전 강제 가능' },
    "genji": { advantage: 'favorable', label: '유리', desc: '튕겨내기를 무시하는 광역 가시 공격과 이동 경로를 차단하는 지형 생성' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '트레이서의 점멸 동선을 가시로 제한할 수 있으나 직접 잡기는 매우 까다로움' },
    "reaper": { advantage: 'unfavorable', label: '불리', desc: '근접 맞딜 시 리퍼의 흡혈을 이기기 힘들며 가시벽을 망령화로 유유히 빠져나감' },
    "bastion": { advantage: 'unfavorable', label: '매우 불리', desc: '해저드가 생성하는 가시 구조물은 강습 모드 바스티온에게 순식간에 철거됨' },
    "mei": { advantage: 'unfavorable', label: '매우 불리', desc: '빙벽과 가시벽의 유틸리티 싸움에서 메이의 슬로우 기능이 해저드에게 더 치명적' },
    "sombra": { advantage: 'unfavorable', label: '불리', desc: '해킹당해 가시벽과 생존기를 사용하지 못하면 덩치 큰 샌드백으로 전락' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '가시벽 설치 시전 중 수면총에 취약하며 힐밴 시 자가 회복 능력이 봉쇄됨' },
    "zenyatta": { advantage: 'unfavorable', label: '매우 불리', desc: '부조화가 박힌 해저드는 가시벽을 세우기도 전에 원거리 포킹에 해체당함' },
    "lifeweaver": { advantage: 'favorable', label: '유리', desc: '연꽃 단상 위로 도망가도 가시벽이나 투사체로 압박 가능하며 큰 히트박스를 공략하기 쉬움' }
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('winrate');
  const [heroesInfo, setHeroesInfo] = useState({});
  const [heroStats, setHeroStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbMetaStats, setDbMetaStats] = useState([]);

  const [period, setPeriod] = useState(7);
 
  const [selectedMetaHero, setSelectedMetaHero] = useState(null);
  // 필터 및 정렬 상태
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedMap, setSelectedMap] = useState('all');
  const [sortColumn, setSortColumn] = useState('winrate');
  const [sortOrder, setSortOrder] = useState('desc'); 

  const [expandedHero, setExpandedHero] = useState(null);

  

  const tiers = [
    { id: 'all', name: '전체' }, { id: 'bronze', name: '브론즈' }, { id: 'silver', name: '실버' }, 
    { id: 'gold', name: '골드' }, { id: 'platinum', name: '플래티넘' }, { id: 'diamond', name: '다이아' }, 
    { id: 'master', name: '마스터' }, { id: 'grandmaster', name: '그랜드마스터' }
  ];

  const roles = [
    { id: 'all', name: '전체' }, { id: 'tank', name: '🛡️ 돌격' }, 
    { id: 'damage', name: '⚔️ 공격' }, { id: 'support', name: '💉 지원' }
  ];

  // DB에서 전체 히스토리를 가져와 기간별 변화량을 계산하는 로직
  useEffect(() => {
    const fetchAndAnalyze = async () => {
      // 1. 우리가 수집기로 데이터를 쌓고 있는 히스토리 테이블에서 전체 데이터 가져오기
      const { data, error } = await supabase
        .from('hero_stats_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("데이터 로드 실패:", error.message);
        return;
      }

      if (data && data.length > 0) {
        // 2. 아까 만든 calculateDiff 함수를 실행 (전체 데이터와 선택된 기간 전달)
        // period가 7이면 7일 전 데이터와 현재 데이터를 비교한 결과가 나옵니다.
        const analyzedData = calculateDiff(data, period);
        setDbMetaStats(analyzedData);
      }
    };

    fetchAndAnalyze();
  }, [period]); // 👈 중요! 사용자가 '1주, 1달' 버튼을 눌러서 period가 바뀔 때마다 재계산함

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const heroesRes = await axios.get('https://overfast-api.tekrop.fr/heroes?locale=ko-kr');
        const infoMap = {};
        heroesRes.data.forEach(hero => { infoMap[hero.key] = hero; });
        setHeroesInfo(infoMap);
      } catch (error) {}
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        let url = 'https://overfast-api.tekrop.fr/heroes/stats?platform=pc&gamemode=competitive&region=asia';
        if (selectedTier !== 'all') url += `&competitive_division=${selectedTier}`;
        if (selectedRole !== 'all') url += `&role=${selectedRole}`;
        if (selectedMap !== 'all') url += `&map=${selectedMap}`;
        const response = await axios.get(url);
        setHeroStats(response.data);
      } catch (error) {} 
      finally { setLoading(false); }
    };
    if (Object.keys(heroesInfo).length > 0) { fetchStats(); }
  }, [selectedTier, selectedRole, selectedMap, heroesInfo]);

  const handleSort = (column) => {
    if (sortColumn === column) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    else { setSortColumn(column); setSortOrder('desc'); }
  };

  const sortedStats = [...heroStats].sort((a, b) => {
    if (sortOrder === 'asc') return a[sortColumn] - b[sortColumn];
    return b[sortColumn] - a[sortColumn];
  });

  const toggleHeroExpand = (heroKey) => {
    if (expandedHero === heroKey) setExpandedHero(null);
    else {
      setExpandedHero(heroKey);
    }
  };

  return (
    <>
      <style>{`
        body { margin: 0; padding: 0; background-color: #0f172a; color: #f1f5f9; font-family: sans-serif; }
        .card { background: #1e293b; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; transition: 0.2s; font-weight: bold; }
        th { cursor: pointer; user-select: none; }
        th:hover { color: #fff; }
      `}</style>

      <div style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>📊 OW2 종합 전략 분석기 v2.5</h1>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
            <button onClick={() => setActiveTab('winrate')} className="btn" style={{ backgroundColor: activeTab === 'winrate' ? '#f59e0b' : '#334155', color: '#fff', fontSize: '1.1rem' }}>📈 데이터 및 상성</button>
            <button onClick={() => setActiveTab('meta')} className="btn" style={{ backgroundColor: activeTab === 'meta' ? '#3b82f6' : '#334155', color: '#fff', fontSize: '1.1rem' }}>⚡ 메타 리포트</button>
          </div>

          {activeTab === 'winrate' && (
            <>
              <div className="card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>역할군</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {roles.map(r => <button key={r.id} onClick={() => setSelectedRole(r.id)} className="btn" style={{ backgroundColor: selectedRole === r.id ? '#3b82f6' : '#0f172a', color: '#fff' }}>{r.name}</button>)}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>티어</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {tiers.map(t => <button key={t.id} onClick={() => setSelectedTier(t.id)} className="btn" style={{ backgroundColor: selectedTier === t.id ? '#f59e0b' : '#0f172a', color: '#fff' }}>{t.name}</button>)}
                  </div>
                </div>
                <div style={{ width: '100%', marginTop: '10px', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>전장(맵) 선택</span>
                    <button onClick={() => setSelectedMap('all')} className="btn" style={{ backgroundColor: selectedMap === 'all' ? '#10b981' : '#0f172a', color: '#fff', fontSize: '11px', padding: '4px 12px' }}>모든 전장 보기</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', alignItems: 'start' }}>
                    {MAP_GROUPS.map(group => (
                      <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', paddingBottom: '5px', borderBottom: '1px solid #334155', textAlign: 'center', marginBottom: '4px' }}>{group.label}</div>
                        {group.maps.map(m => (
                          <button key={m.key} onClick={() => setSelectedMap(m.key)} className="btn" style={{ fontSize: '11px', padding: '6px 2px', backgroundColor: selectedMap === m.key ? '#3b82f6' : '#1e293b', color: selectedMap === m.key ? '#fff' : '#94a3b8', border: '1px solid #334155', textAlign: 'center' }}>{m.name}</button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>데이터 분석 중... 🔄</div>
              ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#0f172a', color: '#94a3b8' }}>
                      <tr>
                        <th style={{ padding: '15px' }}>#</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>영웅</th>
                        <th onClick={() => handleSort('winrate')} style={{ padding: '15px' }}>승률 {sortColumn === 'winrate' ? (sortOrder === 'desc' ? '▼' : '▲') : '▽'}</th>
                        <th onClick={() => handleSort('pickrate')} style={{ padding: '15px' }}>픽률 {sortColumn === 'pickrate' ? (sortOrder === 'desc' ? '▼' : '▲') : '▽'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStats.map((stat, idx) => {
                        const hero = heroesInfo[stat.hero];
                        const isExpanded = expandedHero === stat.hero;
                        return (
                          <React.Fragment key={stat.hero}>
                            <tr onClick={() => toggleHeroExpand(stat.hero)} style={{ borderBottom: '1px solid #334155', cursor: 'pointer', backgroundColor: isExpanded ? '#334155' : 'transparent' }}>
                              <td style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                              <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <img src={hero?.portrait} width="40" style={{ borderRadius: '50%' }} alt={hero?.name || "hero"} />
                                <span style={{ fontWeight: 'bold' }}>{hero?.name || stat.hero}</span>
                                <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '5px' }}>{isExpanded ? '▲ 접기' : '▼ 상성 보기'}</span>
                              </td>
                              <td style={{ padding: '15px', textAlign: 'center', color: stat.winrate > 50 ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>{stat.winrate.toFixed(1)}%</td>
                              <td style={{ padding: '15px', textAlign: 'center', color: '#cbd5e1' }}>{stat.pickrate.toFixed(1)}%</td>
                            </tr>
                            
                            {isExpanded && (
                              <tr>
                                <td colSpan="4" style={{ backgroundColor: '#020617', padding: '30px' }}>
                                  <div style={{ borderLeft: '4px solid #f59e0b', paddingLeft: '20px' }}>
                                    <h2 style={{ margin: '0 0 20px 0' }}>🛡️ {hero?.name} 상세 상성 분석표</h2>
                                    
                                    {/* 상단 헤더 (역할군) */}
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: '100px 1fr 1fr 1fr', 
                                      gap: '10px', 
                                      marginBottom: '15px',
                                      textAlign: 'center',
                                      fontWeight: 'bold',
                                      color: '#94a3b8',
                                      fontSize: '14px'
                                    }}>
                                      <div>상성 등급</div>
                                      <div>🛡️ 돌격 (Tank)</div>
                                      <div>⚔️ 공격 (DPS)</div>
                                      <div>💉 지원 (Supp)</div>
                                    </div>

                                    {/* 5단계 상성 데이터 행 */}
                                    {[
                                      { id: 'v_favorable', label: '매우 유리', color: '#064e3b', textColor: '#4ade80', filter: '매우 유리' },
                                      { id: 'favorable', label: '유리', color: '#14532d', textColor: '#86efac', filter: '유리' },
                                      { id: 'neutral', label: '중립', color: '#334155', textColor: '#f1f5f9', filter: '중립' },
                                      { id: 'unfavorable', label: '불리', color: '#7f1d1d', textColor: '#fca5a5', filter: '불리' },
                                      { id: 'v_unfavorable', label: '매우 불리', color: '#991b1b', textColor: '#f87171', filter: '매우 불리' }
                                    ].map(grade => (
                                      <div key={grade.id} style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: '100px 1fr 1fr 1fr', 
                                        gap: '10px', 
                                        marginBottom: '8px' 
                                      }}>
                                        {/* 왼쪽 등급 라벨 */}
                                        <div style={{ 
                                          backgroundColor: grade.color, 
                                          color: grade.textColor, 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center', 
                                          borderRadius: '8px',
                                          fontSize: '13px',
                                          fontWeight: 'bold'
                                        }}>
                                          {grade.label}
                                        </div>

                                        {/* 역할군별 데이터 3열 */}
                                        {['tank', 'damage', 'support'].map(roleGroup => {
                                          const matchedHeroes = MATCHUP_DATA[stat.hero] 
                                            ? Object.entries(MATCHUP_DATA[stat.hero]).filter(([k, v]) => {
                                                const hInfo = heroesInfo[k];
                                                // API 데이터의 역할군과 일치하고, 상성 라벨이 포함되는지 확인
                                                return hInfo?.role === roleGroup && v.label.includes(grade.filter);
                                              })
                                            : [];

                                          return (
                                            <div key={roleGroup} style={{ 
                                              backgroundColor: '#1e293b', 
                                              borderRadius: '8px', 
                                              padding: '10px', 
                                              minHeight: '70px',
                                              display: 'flex',
                                              flexWrap: 'wrap',
                                              gap: '10px',
                                              alignContent: 'start',
                                              border: '1px solid #334155'
                                            }}>
                                              {matchedHeroes.length > 0 ? (
                                                matchedHeroes.map(([hKey, hVal]) => (
                                                  <div key={hKey} title={`${heroesInfo[hKey]?.name}: ${hVal.desc}`} style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    alignItems: 'center', 
                                                    width: '50px' 
                                                  }}>
                                                    <img 
                                                      src={heroesInfo[hKey]?.portrait} 
                                                      alt={hKey} 
                                                      style={{ 
                                                        width: '35px', 
                                                        height: '35px', 
                                                        borderRadius: '6px', 
                                                        marginBottom: '4px', 
                                                        border: `1px solid ${grade.textColor}`,
                                                        backgroundColor: '#0f172a'
                                                      }} 
                                                    />
                                                    <span style={{ 
                                                      fontSize: '10px', 
                                                      textAlign: 'center', 
                                                      color: '#cbd5e1', 
                                                      overflow: 'hidden', 
                                                      textOverflow: 'ellipsis', 
                                                      whiteSpace: 'nowrap', 
                                                      width: '100%' 
                                                    }}>
                                                      {heroesInfo[hKey]?.name || hKey}
                                                    </span>
                                                  </div>
                                                ))
                                              ) : (
                                                <div style={{ margin: 'auto', color: '#475569', fontSize: '11px' }}>-</div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ))}
                                    <p style={{ color: '#64748b', fontSize: '12px', marginTop: '15px' }}>
                                      * 영웅 아이콘에 마우스를 올리면 상세 코멘트를 확인할 수 있습니다.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'meta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. 상단 컨트롤 패널 (기간 선택) */}
              <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>⚔️ 메타 리포트 (패치 대비 승률 변화)</h2>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[
                    { label: '1주', value: 7 },
                    { label: '1달', value: 30 },
                    { label: '2달', value: 60 },
                    { label: '3달', value: 90 }
                  ].map(p => (
                    <button 
                      key={p.value}
                      onClick={() => setPeriod(p.value)}
                      className="btn"
                      style={{ 
                        backgroundColor: period === p.value ? '#f59e0b' : '#1e293b', 
                        color: '#fff', fontSize: '14px', padding: '8px 16px' 
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 역할군별 영웅 초상화 선택 영역 */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>영웅 선택</h3>
                {['tank', 'damage', 'support'].map(role => {
                  // heroesInfo에서 해당 역할군 영웅만 필터링
                  const roleHeroes = Object.values(heroesInfo).filter(h => h.role === role);
                  const roleName = role === 'tank' ? '🛡️ 돌격' : role === 'damage' ? '⚔️ 공격' : '💉 지원';
                  
                  return (
                    <div key={role} style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: '#94a3b8', marginBottom: '10px' }}>{roleName}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {roleHeroes.map(hero => (
                          <div 
                            key={hero.key} 
                            onClick={() => setSelectedMetaHero(hero.key)}
                            style={{
                              cursor: 'pointer',
                              textAlign: 'center',
                              border: selectedMetaHero === hero.key ? '2px solid #f59e0b' : '2px solid transparent',
                              borderRadius: '8px',
                              padding: '5px',
                              transition: '0.2s',
                              opacity: (selectedMetaHero && selectedMetaHero !== hero.key) ? 0.5 : 1
                            }}
                          >
                            <img 
                              src={hero.portrait} 
                              alt={hero.name} 
                              style={{ width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover' }} 
                            />
                            <div style={{ fontSize: '11px', marginTop: '5px' }}>{hero.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. 선택된 영웅의 변동폭 상세 확인 영역 */}
              {selectedMetaHero && (
                <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', backgroundColor: '#1e293b' }}>
                  {(() => {
                    const heroData = heroesInfo[selectedMetaHero];
                    const statData = dbMetaStats.find(s => s.name === selectedMetaHero);
                    if (!statData) return <p>데이터가 부족합니다.</p>;

                    const diffVal = parseFloat(statData.diff);
                    const diffColor = diffVal > 0 ? '#10b981' : diffVal < 0 ? '#ef4444' : '#94a3b8';

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <img src={heroData.portrait} alt={heroData.name} style={{ width: '80px', height: '80px', borderRadius: '8px' }} />
                        <div>
                          <h3 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>{heroData.name}</h3>
                          <div style={{ display: 'flex', gap: '30px', fontSize: '16px' }}>
                            <div>현재 승률: <strong>{statData.currWinrate}%</strong></div>
                            <div>과거 승률: <span style={{ color: '#94a3b8' }}>{statData.prevWinrate}%</span></div>
                            <div>
                              변동폭: <strong style={{ color: diffColor }}>
                                {diffVal > 0 ? '▲' : diffVal < 0 ? '▼' : '-'} {Math.abs(diffVal)}%
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 4. 최하단: 변동폭 TOP 10 영웅 */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>🔥 {period}일 기준 변동폭 TOP 10</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '10px' }}>순위</th>
                      <th style={{ padding: '10px' }}>영웅</th>
                      <th style={{ padding: '10px' }}>현재 승률</th>
                      <th style={{ padding: '10px' }}>변동 수치</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbMetaStats
                      // 절대값(Math.abs) 기준으로 내림차순 정렬하여 가장 많이 변한 10명 추출
                      .sort((a, b) => Math.abs(parseFloat(b.diff)) - Math.abs(parseFloat(a.diff)))
                      .slice(0, 10)
                      .map((stat, index) => {
                        const hero = heroesInfo[stat.name];
                        const diffVal = parseFloat(stat.diff);
                        const diffColor = diffVal > 0 ? '#10b981' : diffVal < 0 ? '#ef4444' : '#94a3b8';

                        return (
                          <tr key={stat.name} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{index + 1}</td>
                            <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {hero && <img src={hero.portrait} alt={hero.name} style={{ width: '30px', height: '30px', borderRadius: '4px' }} />}
                              {hero ? hero.name : stat.name}
                            </td>
                            <td style={{ padding: '10px' }}>{stat.currWinrate}%</td>
                            <td style={{ padding: '10px', color: diffColor, fontWeight: 'bold' }}>
                              {diffVal > 0 ? '▲' : diffVal < 0 ? '▼' : '-'} {Math.abs(diffVal)}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;