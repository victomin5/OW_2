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
    "doomfist": { advantage: 'favorable', label: '매우 유리', desc: '' }, "lucio": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "reinhardt": { advantage: 'favorable', label: '유리', desc: '' }, "winston": { advantage: 'favorable', label: '유리', desc: '' }, "hazard": { advantage: 'favorable', label: '유리', desc: '' }, "venture": { advantage: 'favorable', label: '유리', desc: '' }, "soldier-76": { advantage: 'favorable', label: '유리', desc: '' }, "pharah": { advantage: 'favorable', label: '유리', desc: '' }, "mercy": { advantage: 'favorable', label: '유리', desc: '' }, "juno": { advantage: 'favorable', label: '유리', desc: '' },
    "ramattra": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' }, "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '' }, "roadhog": { advantage: 'neutral', label: '중립', desc: '' }, "mauga": { advantage: 'neutral', label: '중립', desc: '' }, "genji": { advantage: 'neutral', label: '중립', desc: '' }, "reaper": { advantage: 'neutral', label: '중립', desc: '' }, "echo": { advantage: 'neutral', label: '중립', desc: '' }, "tracer": { advantage: 'neutral', label: '중립', desc: '' }, "sombra": { advantage: 'neutral', label: '중립', desc: '' }, "lifeweaver": { advantage: 'neutral', label: '중립', desc: '' }, "moira": { advantage: 'neutral', label: '중립', desc: '' },
    "zarya": { advantage: 'unfavorable', label: '약간 불리', desc: '고에너지 주의' }, "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "baptiste": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "kiriko": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '' }, "vendetta": { advantage: 'unfavorable', label: '불리', desc: '' }, "ash": { advantage: 'unfavorable', label: '불리', desc: '' }, "widowmaker": { advantage: 'unfavorable', label: '불리', desc: '' }, "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' }, "freya": { advantage: 'unfavorable', label: '불리', desc: '' }, "ana": { advantage: 'unfavorable', label: '불리', desc: '' }, "wooyang": { advantage: 'unfavorable', label: '불리', desc: '팀전 주의' }, "illari": { advantage: 'unfavorable', label: '불리', desc: '' },
    "sigma": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "sojourn": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "hanzo": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "zenyatta": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "orisa": {
    "reinhardt": { advantage: 'favorable', label: '매우 유리', desc: '' }, "mei": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "doomfist": { advantage: 'favorable', label: '유리', desc: '' }, "wrecking-ball": { advantage: 'favorable', label: '유리', desc: '' }, "roadhog": { advantage: 'favorable', label: '유리', desc: '' }, "junker-queen": { advantage: 'favorable', label: '유리', desc: '' }, "hazard": { advantage: 'favorable', label: '유리', desc: '' }, "vendetta": { advantage: 'favorable', label: '유리', desc: '' }, "cassidy": { advantage: 'favorable', label: '유리', desc: '' }, "ash": { advantage: 'favorable', label: '유리', desc: '방벽' }, "widowmaker": { advantage: 'favorable', label: '유리', desc: '방벽' }, "brigitte": { advantage: 'favorable', label: '유리', desc: '' }, "ana": { advantage: 'favorable', label: '유리', desc: '' }, "jetpack-cat": { advantage: 'favorable', label: '유리', desc: '' },
    "dva": { advantage: 'favorable', label: '약간 유리', desc: '' }, "ramattra": { advantage: 'favorable', label: '약간 유리', desc: '' }, "winston": { advantage: 'favorable', label: '약간 유리', desc: '' }, "reaper": { advantage: 'favorable', label: '약간 유리', desc: '' }, "sojourn": { advantage: 'favorable', label: '약간 유리', desc: '방벽' }, "soldier-76": { advantage: 'favorable', label: '약간 유리', desc: '방벽' }, "freya": { advantage: 'favorable', label: '약간 유리', desc: '방벽' },
    "orisa": { advantage: 'neutral', label: '중립', desc: '' }, "venture": { advantage: 'neutral', label: '중립', desc: '' }, "sombra": { advantage: 'neutral', label: '중립', desc: '' }, "mercy": { advantage: 'neutral', label: '중립', desc: '' }, "baptiste": { advantage: 'neutral', label: '중립', desc: '' }, "illari": { advantage: 'neutral', label: '중립', desc: '' }, "zarya": { advantage: 'neutral', label: '중립', desc: '방벽' },
    "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "hanzo": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "genji": { advantage: 'unfavorable', label: '약간 불리', desc: '방벽' }, "moira": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "mauga": { advantage: 'unfavorable', label: '불리', desc: '' }, "bastion": { advantage: 'unfavorable', label: '불리', desc: '' }, "pharah": { advantage: 'unfavorable', label: '불리', desc: '' }, "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '' }, "lucio": { advantage: 'unfavorable', label: '불리', desc: '' }, "wooyang": { advantage: 'unfavorable', label: '불리', desc: '' }, "juno": { advantage: 'unfavorable', label: '불리', desc: '' }, "kiriko": { advantage: 'unfavorable', label: '불리', desc: '' }, "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '방벽' },
    "sigma": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "junkrat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "tracer": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "reinhardt": {
    "domina": { advantage: 'favorable', label: '매우 유리', desc: '' }, "sigma": { advantage: 'favorable', label: '매우 유리', desc: '' }, "genji": { advantage: 'favorable', label: '매우 유리', desc: '용검' },
    "zarya": { advantage: 'favorable', label: '유리', desc: '' }, "venture": { advantage: 'favorable', label: '유리', desc: '' }, "sojourn": { advantage: 'favorable', label: '유리', desc: '' }, "widowmaker": { advantage: 'favorable', label: '유리', desc: '' }, "ash": { advantage: 'favorable', label: '유리', desc: '' }, "brigitte": { advantage: 'favorable', label: '유리', desc: '' }, "mizuki": { advantage: 'favorable', label: '유리', desc: '' },
    "junker-queen": { advantage: 'favorable', label: '약간 유리', desc: '' }, "hazard": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '' }, "reinhardt": { advantage: 'neutral', label: '중립', desc: '' }, "dva": { advantage: 'neutral', label: '중립', desc: '' }, "vendetta": { advantage: 'neutral', label: '중립', desc: '' }, "torbjorn": { advantage: 'neutral', label: '중립', desc: '' }, "mercy": { advantage: 'neutral', label: '중립', desc: '' }, "moira": { advantage: 'neutral', label: '중립', desc: '' }, "baptiste": { advantage: 'neutral', label: '중립', desc: '' }, "ana": { advantage: 'neutral', label: '중립', desc: '' }, "juno": { advantage: 'neutral', label: '중립', desc: '' }, "kiriko": { advantage: 'neutral', label: '중립', desc: '' },
    "sombra": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "hanzo": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "doomfist": { advantage: 'unfavorable', label: '불리', desc: '운영' }, "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' }, "wrecking-ball": { advantage: 'unfavorable', label: '불리', desc: '' }, "winston": { advantage: 'unfavorable', label: '불리', desc: '' }, "mauga": { advantage: 'unfavorable', label: '불리', desc: '' }, "reaper": { advantage: 'unfavorable', label: '불리', desc: '' }, "mei": { advantage: 'unfavorable', label: '불리', desc: '' }, "bastion": { advantage: 'unfavorable', label: '불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '불리', desc: '' }, "cassidy": { advantage: 'unfavorable', label: '불리', desc: '' }, "tracer": { advantage: 'unfavorable', label: '불리', desc: '' }, "pharah": { advantage: 'unfavorable', label: '불리', desc: '' }, "lucio": { advantage: 'unfavorable', label: '불리', desc: '' }, "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "junkrat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "freya": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "lifeweaver": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "zarya": {
    "dva": { advantage: 'favorable', label: '매우 유리', desc: '' }, "orisa": { advantage: 'favorable', label: '매우 유리', desc: '' }, "junker-queen": { advantage: 'favorable', label: '매우 유리', desc: '' }, "genji": { advantage: 'favorable', label: '매우 유리', desc: '' }, "sombra": { advantage: 'favorable', label: '매우 유리', desc: '' }, "junkrat": { advantage: 'favorable', label: '매우 유리', desc: '' }, "cassidy": { advantage: 'favorable', label: '매우 유리', desc: '' }, "venture": { advantage: 'favorable', label: '매우 유리', desc: '' }, "anran": { advantage: 'favorable', label: '매우 유리', desc: '' }, "ana": { advantage: 'favorable', label: '매우 유리', desc: '' }, "illari": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "sigma": { advantage: 'favorable', label: '유리', desc: '대인' }, "tracer": { advantage: 'favorable', label: '유리', desc: '' }, "torbjorn": { advantage: 'favorable', label: '유리', desc: '' }, "lucio": { advantage: 'favorable', label: '유리', desc: '' }, "brigitte": { advantage: 'favorable', label: '유리', desc: '' }, "kiriko": { advantage: 'favorable', label: '유리', desc: '' },
    "hazard": { advantage: 'favorable', label: '약간 유리', desc: '' }, "mercy": { advantage: 'favorable', label: '약간 유리', desc: '' }, "mizuki": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '' }, "roadhog": { advantage: 'neutral', label: '중립', desc: '' }, "zarya": { advantage: 'neutral', label: '중립', desc: '' }, "reaper": { advantage: 'neutral', label: '중립', desc: '' }, "vendetta": { advantage: 'neutral', label: '중립', desc: '' }, "moira": { advantage: 'neutral', label: '중립', desc: '' }, "juno": { advantage: 'neutral', label: '중립', desc: '' },
    "mauga": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "soldier-76": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "ash": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "baptiste": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "domina": { advantage: 'unfavorable', label: '불리', desc: '' }, "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' }, "reinhardt": { advantage: 'unfavorable', label: '불리', desc: '' }, "wrecking-ball": { advantage: 'unfavorable', label: '불리', desc: '' }, "mei": { advantage: 'unfavorable', label: '불리', desc: '' }, "sojourn": { advantage: 'unfavorable', label: '불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '불리', desc: '' }, "freya": { advantage: 'unfavorable', label: '불리', desc: '' }, "widowmaker": { advantage: 'unfavorable', label: '불리', desc: '' }, "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' }, "wooyang": { advantage: 'unfavorable', label: '불리', desc: '' },
    "winston": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "bastion": { advantage: 'unfavorable', label: '매우 불리', desc: '강습' }, "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "hanzo": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "lifeweaver": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "wreckingball": {
    "domina": { advantage: 'favorable', label: '매우 유리', desc: '방벽' }, "sojourn": { advantage: 'favorable', label: '매우 유리', desc: '' }, "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '' }, "baptiste": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "reinhardt": { advantage: 'favorable', label: '유리', desc: '' }, "sigma": { advantage: 'favorable', label: '유리', desc: '팀전' }, "winston": { advantage: 'favorable', label: '유리', desc: '' }, "zarya": { advantage: 'favorable', label: '유리', desc: '' }, "genji": { advantage: 'favorable', label: '유리', desc: '' }, "soldier-76": { advantage: 'favorable', label: '유리', desc: '' }, "ash": { advantage: 'favorable', label: '유리', desc: '' }, "tracer": { advantage: 'favorable', label: '유리', desc: '' }, "pharah": { advantage: 'favorable', label: '유리', desc: '' }, "freya": { advantage: 'favorable', label: '유리', desc: '' }, "mercy": { advantage: 'favorable', label: '유리', desc: '' }, "moira": { advantage: 'favorable', label: '유리', desc: '' }, "wooyang": { advantage: 'favorable', label: '유리', desc: '' }, "jetpack-cat": { advantage: 'favorable', label: '유리', desc: '' }, "juno": { advantage: 'favorable', label: '유리', desc: '' }, "kiriko": { advantage: 'favorable', label: '유리', desc: '' },
    "junkrat": { advantage: 'favorable', label: '약간 유리', desc: '' }, "hanzo": { advantage: 'favorable', label: '약간 유리', desc: '' }, "illari": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' }, "ramattra": { advantage: 'neutral', label: '중립', desc: '팀전' }, "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '' }, "junker-queen": { advantage: 'neutral', label: '중립', desc: '' }, "hazard": { advantage: 'neutral', label: '중립', desc: '' }, "venture": { advantage: 'neutral', label: '중립', desc: '' }, "anran": { advantage: 'neutral', label: '중립', desc: '' }, "emre": { advantage: 'neutral', label: '중립', desc: '' }, "lifeweaver": { advantage: 'neutral', label: '중립', desc: '' }, "lucio": { advantage: 'neutral', label: '중립', desc: '' }, "ana": { advantage: 'neutral', label: '중립', desc: '' }, "zenyatta": { advantage: 'neutral', label: '중립', desc: '' },
    "doomfist": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "ramattra-1v1": { advantage: 'unfavorable', label: '약간 불리', desc: '1:1' }, "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '불리', desc: '' }, "reaper": { advantage: 'unfavorable', label: '불리', desc: '' }, "bastion": { advantage: 'unfavorable', label: '불리', desc: '' }, "vendetta": { advantage: 'unfavorable', label: '불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '불리', desc: '' }, "cassidy": { advantage: 'unfavorable', label: '불리', desc: '' }, "torbjorn": { advantage: 'unfavorable', label: '불리', desc: '' }, "mizuki": { advantage: 'unfavorable', label: '불리', desc: '' }, "brigitte": { advantage: 'unfavorable', label: '불리', desc: '' },
    "roadhog": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "mauga": { advantage: 'unfavorable', label: '매우 불리', desc: '1:1' }, "sombra": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "ramattra": {
    "brigitte": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "dva": { advantage: 'favorable', label: '유리', desc: '' }, "domina": { advantage: 'favorable', label: '유리', desc: '' }, "reinhardt": { advantage: 'favorable', label: '유리', desc: '' }, "sigma": { advantage: 'favorable', label: '유리', desc: '' }, "zarya": { advantage: 'favorable', label: '유리', desc: '' }, "genji": { advantage: 'favorable', label: '유리', desc: '' }, "venture": { advantage: 'favorable', label: '유리', desc: '' }, "sojourn": { advantage: 'favorable', label: '유리', desc: '' }, "sombra": { advantage: 'favorable', label: '유리', desc: '' }, "symmetra": { advantage: 'favorable', label: '유리', desc: '' }, "anran": { advantage: 'favorable', label: '유리', desc: '' }, "hanzo": { advantage: 'favorable', label: '유리', desc: '' }, "cassidy": { advantage: 'favorable', label: '유리', desc: '' }, "torbjorn": { advantage: 'favorable', label: '유리', desc: '' }, "baptiste": { advantage: 'favorable', label: '유리', desc: '' }, "kiriko": { advantage: 'favorable', label: '유리', desc: '' },
    "ramattra": { advantage: 'neutral', label: '중립', desc: '' }, "winston": { advantage: 'neutral', label: '중립', desc: '' }, "junker-queen": { advantage: 'neutral', label: '중립', desc: '' }, "hazard": { advantage: 'neutral', label: '중립', desc: '' }, "bastion": { advantage: 'neutral', label: '중립', desc: '' }, "ash": { advantage: 'neutral', label: '중립', desc: '' }, "widowmaker": { advantage: 'neutral', label: '중립', desc: '' }, "freya": { advantage: 'neutral', label: '중립', desc: '' }, "mercy": { advantage: 'neutral', label: '중립', desc: '' }, "juno": { advantage: 'neutral', label: '중립', desc: '' },
    "doomfist": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "orisa": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "mauga": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "wrecking-ball": { advantage: 'unfavorable', label: '불리', desc: '' }, "soldier-76": { advantage: 'unfavorable', label: '불리', desc: '' }, "tracer": { advantage: 'unfavorable', label: '불리', desc: '' }, "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' }, "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '' }, "lucio": { advantage: 'unfavorable', label: '불리', desc: '' }, "moira": { advantage: 'unfavorable', label: '불리', desc: '' }, "ana": { advantage: 'unfavorable', label: '불리', desc: '' }, "illari": { advantage: 'unfavorable', label: '불리', desc: '' }, "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' }, "jetpack-cat": { advantage: 'unfavorable', label: '불리', desc: '' },
    "roadhog": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "reaper": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '네메시스' }
  },
  "junkerqueen": {
    "symmetra": { advantage: 'favorable', label: '매우 유리', desc: '' }, "moira": { advantage: 'favorable', label: '매우 유리', desc: '' }, "mizuki": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "ramattra": { advantage: 'favorable', label: '유리', desc: '' }, "reinhardt": { advantage: 'favorable', label: '유리', desc: '' }, "wrecking-ball": { advantage: 'favorable', label: '유리', desc: '' }, "bastion": { advantage: 'favorable', label: '유리', desc: '' }, "venture": { advantage: 'favorable', label: '유리', desc: '' }, "lifeweaver": { advantage: 'favorable', label: '유리', desc: '' }, "mercy": { advantage: 'favorable', label: '유리', desc: '' }, "wooyang": { advantage: 'favorable', label: '유리', desc: '' }, "zenyatta": { advantage: 'favorable', label: '유리', desc: '' }, "juno": { advantage: 'favorable', label: '유리', desc: '' },
    "mauga": { advantage: 'favorable', label: '약간 유리', desc: '' }, "winston": { advantage: 'favorable', label: '약간 유리', desc: '' }, "genji": { advantage: 'favorable', label: '약간 유리', desc: '' }, "tracer": { advantage: 'favorable', label: '약간 유리', desc: '' }, "baptiste": { advantage: 'favorable', label: '약간 유리', desc: '' }, "illari": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' }, "domina": { advantage: 'neutral', label: '중립', desc: '' }, "doomfist": { advantage: 'neutral', label: '중립', desc: '' }, "roadhog": { advantage: 'neutral', label: '중립', desc: '' }, "junker-queen": { advantage: 'neutral', label: '중립', desc: '' }, "reaper": { advantage: 'neutral', label: '중립', desc: '' }, "vendetta": { advantage: 'neutral', label: '중립', desc: '' }, "cassidy": { advantage: 'neutral', label: '중립', desc: '' }, "torbjorn": { advantage: 'neutral', label: '중립', desc: '' }, "brigitte": { advantage: 'neutral', label: '중립', desc: '' },
    "sigma": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "sojourn": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "soldier-76": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "sombra": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "anran": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "lucio": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "hanzo": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '' }, "ash": { advantage: 'unfavorable', label: '불리', desc: '' }, "ana": { advantage: 'unfavorable', label: '불리', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "zarya": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "widowmaker": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "junkrat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "freya": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "kiriko": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "dva": {
    "hazard": { advantage: 'favorable', label: '매우 유리', desc: '' }, "ash": { advantage: 'favorable', label: '매우 유리', desc: '' }, "emre": { advantage: 'favorable', label: '매우 유리', desc: '' }, "cassidy": { advantage: 'favorable', label: '매우 유리', desc: '' }, "tracer": { advantage: 'favorable', label: '매우 유리', desc: '' }, "pharah": { advantage: 'favorable', label: '매우 유리', desc: '' }, "freya": { advantage: 'favorable', label: '매우 유리', desc: '' }, "mercy": { advantage: 'favorable', label: '매우 유리', desc: '' }, "moira": { advantage: 'favorable', label: '매우 유리', desc: '' }, "ana": { advantage: 'favorable', label: '매우 유리', desc: '' }, "illari": { advantage: 'favorable', label: '매우 유리', desc: '' }, "jetpack-cat": { advantage: 'favorable', label: '매우 유리', desc: '' }, "juno": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "bastion": { advantage: 'favorable', label: '유리', desc: '' }, "widowmaker": { advantage: 'favorable', label: '유리', desc: '' }, "hanzo": { advantage: 'favorable', label: '유리', desc: '' },
    "winston": { advantage: 'favorable', label: '약간 유리', desc: '' }, "sojourn": { advantage: 'favorable', label: '약간 유리', desc: '' }, "zenyatta": { advantage: 'favorable', label: '약간 유리', desc: '소규모' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' }, "domina": { advantage: 'neutral', label: '중립', desc: '' }, "doomfist": { advantage: 'neutral', label: '중립', desc: '' }, "reinhardt": { advantage: 'neutral', label: '중립', desc: '' }, "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '' }, "roadhog": { advantage: 'neutral', label: '중립', desc: '' }, "mauga": { advantage: 'neutral', label: '중립', desc: '' }, "sigma": { advantage: 'neutral', label: '중립', desc: '' }, "reaper": { advantage: 'neutral', label: '중립', desc: '' }, "soldier-76": { advantage: 'neutral', label: '중립', desc: '' }, "sombra": { advantage: 'neutral', label: '중립', desc: '' }, "junkrat": { advantage: 'neutral', label: '중립', desc: '' }, "lifeweaver": { advantage: 'neutral', label: '중립', desc: '' }, "lucio": { advantage: 'neutral', label: '중립', desc: '' }, "wooyang": { advantage: 'neutral', label: '중립', desc: '' }, "kiriko": { advantage: 'neutral', label: '중립', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "torbjorn": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "baptiste": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "zenyatta-op": { advantage: 'unfavorable', label: '약간 불리', desc: '운영' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' }, "junker-queen": { advantage: 'unfavorable', label: '불리', desc: '' }, "mei": { advantage: 'unfavorable', label: '불리', desc: '' }, "anran": { advantage: 'unfavorable', label: '불리', desc: '' }, "mizuki": { advantage: 'unfavorable', label: '불리', desc: '' },
    "zarya": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "genji": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "vendetta": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "venture": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "symmetra": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "brigitte": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "doomfist": {
    "domina": { advantage: 'favorable', label: '매우 유리', desc: '' }, "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '' }, "soldier-76": { advantage: 'favorable', label: '매우 유리', desc: '' }, "lucio": { advantage: 'favorable', label: '매우 유리', desc: '' }, "wooyang": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "reinhardt": { advantage: 'favorable', label: '유리', desc: '운영' }, "winston": { advantage: 'favorable', label: '유리', desc: '' }, "genji": { advantage: 'favorable', label: '유리', desc: '' }, "bastion": { advantage: 'favorable', label: '유리', desc: '수색' }, "venture": { advantage: 'favorable', label: '유리', desc: '' }, "emre": { advantage: 'favorable', label: '유리', desc: '' }, "lifeweaver": { advantage: 'favorable', label: '유리', desc: '' },
    "ramattra": { advantage: 'favorable', label: '약간 유리', desc: '' }, "wrecking-ball": { advantage: 'favorable', label: '약간 유리', desc: '' }, "sojourn": { advantage: 'favorable', label: '약간 유리', desc: '' }, "anran": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' }, "doomfist": { advantage: 'neutral', label: '중립', desc: '' }, "zarya": { advantage: 'neutral', label: '중립', desc: '' }, "junker-queen": { advantage: 'neutral', label: '중립', desc: '' }, "hazard": { advantage: 'neutral', label: '중립', desc: '' }, "reaper": { advantage: 'neutral', label: '중립', desc: '운영' }, "vendetta": { advantage: 'neutral', label: '중립', desc: '' }, "cassidy": { advantage: 'neutral', label: '중립', desc: '' }, "tracer": { advantage: 'neutral', label: '중립', desc: '' }, "moira": { advantage: 'neutral', label: '중립', desc: '' }, "baptiste": { advantage: 'neutral', label: '중립', desc: '' }, "brigitte": { advantage: 'neutral', label: '중립', desc: '' }, "jetpack-cat": { advantage: 'neutral', label: '중립', desc: '' }, "juno": { advantage: 'neutral', label: '중립', desc: '' }, "hanzo": { advantage: 'neutral', label: '중립', desc: '' },
    "reaper-1v1": { advantage: 'unfavorable', label: '약간 불리', desc: '1:1' }, "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "torbjorn": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "illari": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "kiriko": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "reinhardt-1v1": { advantage: 'unfavorable', label: '불리', desc: '대인' }, "sigma": { advantage: 'unfavorable', label: '불리', desc: '' }, "ash": { advantage: 'unfavorable', label: '불리', desc: '' }, "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' }, "freya": { advantage: 'unfavorable', label: '불리', desc: '' }, "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' }, "mercy": { advantage: 'unfavorable', label: '불리', desc: '운영' },
    "roadhog": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "mauga": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "sombra": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "mizuki": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "ana": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "domina": {
    "reinhardt": { advantage: 'favorable', label: '매우 유리', desc: '궁 연계 시' }, "genji": { advantage: 'favorable', label: '매우 유리', desc: '' }, "ana": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "zarya": { advantage: 'favorable', label: '유리', desc: '' }, "widowmaker": { advantage: 'favorable', label: '유리', desc: '' }, "junker-queen": { advantage: 'favorable', label: '유리', desc: '' }, "lifeweaver": { advantage: 'favorable', label: '유리', desc: '' }, "lucio": { advantage: 'favorable', label: '유리', desc: '' }, "mercy": { advantage: 'favorable', label: '유리', desc: '' }, "moira": { advantage: 'favorable', label: '유리', desc: '' }, "mizuki": { advantage: 'favorable', label: '유리', desc: '' }, "brigitte": { advantage: 'favorable', label: '유리', desc: '' }, "juno": { advantage: 'favorable', label: '유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' }, "domina": { advantage: 'neutral', label: '중립', desc: '' }, "winston": { advantage: 'neutral', label: '중립', desc: '' }, "hazard": { advantage: 'neutral', label: '중립', desc: '' }, "ash": { advantage: 'neutral', label: '중립', desc: '' }, "wooyang": { advantage: 'neutral', label: '중립', desc: '' }, "baptiste": { advantage: 'neutral', label: '중립', desc: '' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' }, "wrecking-ball": { advantage: 'unfavorable', label: '불리', desc: '' }, "roadhog": { advantage: 'unfavorable', label: '불리', desc: '' }, "mauga": { advantage: 'unfavorable', label: '불리', desc: '' }, "sigma": { advantage: 'unfavorable', label: '불리', desc: '' }, "orisa": { advantage: 'unfavorable', label: '불리', desc: '' }, "bastion": { advantage: 'unfavorable', label: '불리', desc: '' }, "sojourn": { advantage: 'unfavorable', label: '불리', desc: '' }, "soldier-76": { advantage: 'unfavorable', label: '불리', desc: '' }, "sombra": { advantage: 'unfavorable', label: '불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '불리', desc: '' }, "pharah": { advantage: 'unfavorable', label: '불리', desc: '' },
    "doomfist": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "reinhardt-1": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "vendetta": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "symmetra": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "junkrat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "zenyatta": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "winston": {
    "zarya": { advantage: 'favorable', label: '매우 유리', desc: '' }, "genji": { advantage: 'favorable', label: '매우 유리', desc: '' }, "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '' }, "kiriko": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "sojourn": { advantage: 'favorable', label: '유리', desc: '' }, "soldier-76": { advantage: 'favorable', label: '유리', desc: '' }, "sombra": { advantage: 'favorable', label: '유리', desc: '' }, "symmetra": { advantage: 'favorable', label: '유리', desc: '' }, "hanzo": { advantage: 'favorable', label: '유리', desc: '' }, "baptiste": { advantage: 'favorable', label: '유리', desc: '' }, "juno": { advantage: 'favorable', label: '유리', desc: '' },
    "sigma": { advantage: 'favorable', label: '약간 유리', desc: '' }, "mei": { advantage: 'favorable', label: '약간 유리', desc: '' }, "echo": { advantage: 'favorable', label: '약간 유리', desc: '' }, "ash": { advantage: 'favorable', label: '약간 유리', desc: '' }, "lifeweaver": { advantage: 'favorable', label: '약간 유리', desc: '' }, "illari": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '' }, "ramattra": { advantage: 'neutral', label: '중립', desc: '' }, "reinhardt": { advantage: 'neutral', label: '중립', desc: '' }, "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '' }, "hazard": { advantage: 'neutral', label: '중립', desc: '' }, "venture": { advantage: 'neutral', label: '중립', desc: '' }, "anran": { advantage: 'neutral', label: '중립', desc: '' }, "freya": { advantage: 'neutral', label: '중립', desc: '' }, "lucio": { advantage: 'neutral', label: '중립', desc: '' }, "mercy": { advantage: 'neutral', label: '중립', desc: '' }, "moira": { advantage: 'neutral', label: '중립', desc: '' }, "brigitte": { advantage: 'neutral', label: '중립', desc: '' }, "jetpack-cat": { advantage: 'neutral', label: '중립', desc: '' },
    "dva": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "orisa": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "pharah": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "domina": { advantage: 'unfavorable', label: '불리', desc: '' }, "vendetta": { advantage: 'unfavorable', label: '불리', desc: '' }, "emre": { advantage: 'unfavorable', label: '불리', desc: '' }, "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' }, "cassidy": { advantage: 'unfavorable', label: '불리', desc: '' }, "torbjorn": { advantage: 'unfavorable', label: '불리', desc: '' }, "ana": { advantage: 'unfavorable', label: '불리', desc: '' }, "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' },
    "roadhog": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "mauga": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "reaper": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "bastion": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "sigma": {
    "mauga": { advantage: 'favorable', label: '매우 유리', desc: '' }, "cassidy": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "domina": { advantage: 'favorable', label: '유리', desc: '' }, "orisa": { advantage: 'favorable', label: '유리', desc: '' }, "venture": { advantage: 'favorable', label: '유리', desc: '' }, "sojourn": { advantage: 'favorable', label: '유리', desc: '' }, "soldier-76": { advantage: 'favorable', label: '유리', desc: '' }, "ash": { advantage: 'favorable', label: '유리', desc: '' }, "widowmaker": { advantage: 'favorable', label: '유리', desc: '' }, "torbjorn": { advantage: 'favorable', label: '유리', desc: '' }, "freya": { advantage: 'favorable', label: '유리', desc: '' }, "ana": { advantage: 'favorable', label: '유리', desc: '' }, "illari": { advantage: 'favorable', label: '유리', desc: '' }, "zenyatta": { advantage: 'favorable', label: '유리', desc: '' },
    "winston-h": { advantage: 'favorable', label: '약간 유리', desc: '하이퍼강타' }, "junker-queen": { advantage: 'favorable', label: '약간 유리', desc: '' }, "hazard": { advantage: 'favorable', label: '약간 유리', desc: '' }, "bastion": { advantage: 'favorable', label: '약간 유리', desc: '' }, "mercy": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '' }, "roadhog": { advantage: 'neutral', label: '중립', desc: '' }, "sigma": { advantage: 'neutral', label: '중립', desc: '' }, "reaper": { advantage: 'neutral', label: '중립', desc: '' }, "vendetta": { advantage: 'neutral', label: '중립', desc: '' }, "baptiste": { advantage: 'neutral', label: '중립', desc: '' }, "brigitte": { advantage: 'neutral', label: '중립', desc: '1:1' }, "hanzo": { advantage: 'neutral', label: '중립', desc: '' }, "kiriko": { advantage: 'neutral', label: '중립', desc: '' },
    "dva": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "zarya-t": { advantage: 'unfavorable', label: '약간 불리', desc: '팀전' }, "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "sombra": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "tracer": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' }, "reinhardt": { advantage: 'unfavorable', label: '불리', desc: '' }, "zarya-a": { advantage: 'unfavorable', label: '불리', desc: '대인' }, "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' }, "symmetra": { advantage: 'unfavorable', label: '불리', desc: '' }, "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '' }, "lucio": { advantage: 'unfavorable', label: '불리', desc: '' }, "moira": { advantage: 'unfavorable', label: '불리', desc: '' }, "wooyang": { advantage: 'unfavorable', label: '불리', desc: '' }, "jetpack-cat": { advantage: 'unfavorable', label: '불리', desc: '' }, "juno": { advantage: 'unfavorable', label: '불리', desc: '' },
    "winston": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "hazard": {
    "soldier-76": { advantage: 'favorable', label: '매우 유리', desc: '' }, "hanzo": { advantage: 'favorable', label: '매우 유리', desc: '' }, "lucio": { advantage: 'favorable', label: '매우 유리', desc: '' }, "baptiste": { advantage: 'favorable', label: '매우 유리', desc: '' }, "juno": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "winston": { advantage: 'favorable', label: '유리', desc: '' }, "mei": { advantage: 'favorable', label: '유리', desc: '' }, "venture": { advantage: 'favorable', label: '유리', desc: '' }, "sojourn": { advantage: 'favorable', label: '유리', desc: '' }, "symmetra": { advantage: 'favorable', label: '유리', desc: '' }, "widowmaker": { advantage: 'favorable', label: '유리', desc: '' }, "ash": { advantage: 'favorable', label: '유리', desc: '' }, "illari": { advantage: 'favorable', label: '유리', desc: '' }, "kiriko": { advantage: 'favorable', label: '유리', desc: '' },
    "vendetta": { advantage: 'favorable', label: '약간 유리', desc: '' }, "cassidy": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '' }, "ramattra": { advantage: 'neutral', label: '중립', desc: '' }, "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '' }, "hazard": { advantage: 'neutral', label: '중립', desc: '' }, "genji": { advantage: 'neutral', label: '중립', desc: '' }, "reaper": { advantage: 'neutral', label: '중립', desc: '' }, "tracer": { advantage: 'neutral', label: '중립', desc: '' }, "mercy": { advantage: 'neutral', label: '중립', desc: '' }, "ana": { advantage: 'neutral', label: '중립', desc: '' }, "moira": { advantage: 'neutral', label: '중립', desc: '' },
    "dva": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "reinhardt": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "sigma": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "zarya": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '' }, "jetpack-cat": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "roadhog": { advantage: 'unfavorable', label: '불리', desc: '' }, "mauga": { advantage: 'unfavorable', label: '불리', desc: '' }, "sombra": { advantage: 'unfavorable', label: '불리', desc: '' }, "bastion": { advantage: 'unfavorable', label: '불리', desc: '' }, "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' }, "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '' }, "brigitte": { advantage: 'unfavorable', label: '불리', desc: '' }, "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '' }, "freya": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
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