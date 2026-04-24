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
  "domina": {
    // 돌격 (Tank)
    "zarya": { advantage: 'favorable', label: '유리', desc: '' },
    "junker-queen": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' },
    "domina": { advantage: 'neutral', label: '중립', desc: '' },
    "hazard": { advantage: 'neutral', label: '중립', desc: '' },
    "winston": { advantage: 'neutral', label: '중립', desc: '' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' },
    "roadhog": { advantage: 'unfavorable', label: '불리', desc: '' },
    "mauga": { advantage: 'unfavorable', label: '불리', desc: '' },
    "sigma": { advantage: 'unfavorable', label: '불리', desc: '' },
    "doomfist": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "reinhardt": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "wrecking-ball": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 공격 (Damage)
    "genji": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "widowmaker": { advantage: 'favorable', label: '유리', desc: '' },
    "ashe": { advantage: 'neutral', label: '중립', desc: '' },
    "sojourn": { advantage: 'unfavorable', label: '불리', desc: '' },
    "echo": { advantage: 'unfavorable', label: '불리', desc: '' },
    "pharah": { advantage: 'unfavorable', label: '불리', desc: '' },
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '' },
    "reaper": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "vendetta": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "junkrat": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 지원 (Support)
    "ana": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "lifeweaver": { advantage: 'favorable', label: '유리', desc: '' },
    "lucio": { advantage: 'favorable', label: '유리', desc: '' },
    "mercy": { advantage: 'favorable', label: '유리', desc: '' },
    "moira": { advantage: 'favorable', label: '유리', desc: '' },
    "mizuki": { advantage: 'favorable', label: '유리', desc: '' },
    "brigitte": { advantage: 'favorable', label: '유리', desc: '' },
    "wooyang": { advantage: 'neutral', label: '중립', desc: '' },
    "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "zenyatta": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "ramattra": {
    // 돌격 (Tank)
    "dva": { advantage: 'favorable', label: '유리', desc: '' },
    "domina": { advantage: 'favorable', label: '유리', desc: '' },
    "reinhardt": { advantage: 'favorable', label: '유리', desc: '' },
    "sigma": { advantage: 'favorable', label: '유리', desc: '' },
    "zarya": { advantage: 'favorable', label: '유리', desc: '' },
    "ramattra": { advantage: 'neutral', label: '중립', desc: '' },
    "winston": { advantage: 'neutral', label: '중립', desc: '' },
    "junker-queen": { advantage: 'neutral', label: '중립', desc: '' },
    "hazard": { advantage: 'neutral', label: '중립', desc: '' },
    "doomfist": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "mauga": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "wrecking-ball": { advantage: 'unfavorable', label: '불리', desc: '' },
    "roadhog": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 공격 (Damage)
    "genji": { advantage: 'favorable', label: '유리', desc: '' },
    "venture": { advantage: 'favorable', label: '유리', desc: '' },
    "sombra": { advantage: 'favorable', label: '유리', desc: '' },
    "symmetra": { advantage: 'favorable', label: '유리', desc: '' },
    "anran": { advantage: 'favorable', label: '유리', desc: '' },
    "cassidy": { advantage: 'favorable', label: '유리', desc: '' },
    "torbjorn": { advantage: 'favorable', label: '유리', desc: '' },
    "hanzo": { advantage: 'favorable', label: '유리', desc: '' },
    "sojourn": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "bastion": { advantage: 'neutral', label: '중립', desc: '' },
    "vendetta": { advantage: 'neutral', label: '중립', desc: '' },
    "ashe": { advantage: 'neutral', label: '중립', desc: '' },
    "widowmaker": { advantage: 'neutral', label: '중립', desc: '' },
    "freya": { advantage: 'neutral', label: '중립', desc: '' },
    "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "soldier-76": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "echo": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' },
    "tracer": { advantage: 'unfavorable', label: '불리', desc: '' },
    "reaper": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 지원 (Support)
    "brigitte": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "baptiste": { advantage: 'favorable', label: '유리', desc: '' },
    "kiriko": { advantage: 'favorable', label: '유리', desc: '' },
    "mercy": { advantage: 'neutral', label: '중립', desc: '' },
    "juno": { advantage: 'neutral', label: '중립', desc: '' },
    "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '' },
    "lucio": { advantage: 'unfavorable', label: '불리', desc: '' },
    "moira": { advantage: 'unfavorable', label: '불리', desc: '' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '' },
    "illari": { advantage: 'unfavorable', label: '불리', desc: '' },
    "jetpack-cat": { advantage: 'unfavorable', label: '불리', desc: '' },
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' }
  },
  "dva": {
    // 돌격 (Tank)
    "hazard": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "winston": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '' },
    "reinhardt": { advantage: 'neutral', label: '중립', desc: '' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '' },
    "mauga": { advantage: 'neutral', label: '중립', desc: '' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' },
    "junker-queen": { advantage: 'unfavorable', label: '불리', desc: '' },
    "zarya": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 공격 (Damage)
    "ashe": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "emre": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "cassidy": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "tracer": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "pharah": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "freya": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "bastion": { advantage: 'favorable', label: '유리', desc: '' },
    "widowmaker": { advantage: 'favorable', label: '유리', desc: '' },
    "hanzo": { advantage: 'favorable', label: '유리', desc: '' },
    "sojourn": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '' },
    "soldier-76": { advantage: 'neutral', label: '중립', desc: '' },
    "sombra": { advantage: 'neutral', label: '중립', desc: '' },
    "junkrat": { advantage: 'neutral', label: '중립', desc: '' },
    "echo": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '' },
    "anran": { advantage: 'unfavorable', label: '불리', desc: '' },
    "torbjorn": { advantage: 'unfavorable', label: '불리', desc: '' },
    "genji": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "vendetta": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "venture": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "symmetra": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 지원 (Support)
    "mercy": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "moira": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "ana": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "illari": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "jetpack-cat": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "juno": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "lifeweaver": { advantage: 'neutral', label: '중립', desc: '' },
    "lucio": { advantage: 'neutral', label: '중립', desc: '' },
    "wooyang": { advantage: 'neutral', label: '중립', desc: '' },
    "kiriko": { advantage: 'neutral', label: '중립', desc: '' },
    "zenyatta": { advantage: 'unfavorable', label: '약간 불리', desc: '소규모 교전 시 유리' },
    "baptiste": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "mizuki": { advantage: 'unfavorable', label: '불리', desc: '' },
    "brigitte": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "doomfist": {
    // 돌격 (Tank)
    "domina": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "winston": { advantage: 'favorable', label: '유리', desc: '' },
    "ramattra": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "wrecking-ball": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '' },
    "zarya": { advantage: 'neutral', label: '중립', desc: '' },
    "junker-queen": { advantage: 'neutral', label: '중립', desc: '' },
    "hazard": { advantage: 'neutral', label: '중립', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "reinhardt": { advantage: 'unfavorable', label: '불리', desc: '대인전 시' },
    "roadhog": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "mauga": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 공격 (Damage)
    "soldier-76": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "genji": { advantage: 'favorable', label: '유리', desc: '' },
    "bastion": { advantage: 'favorable', label: '유리', desc: '수색 모드' },
    "anran": { advantage: 'favorable', label: '유리', desc: '' },
    "emre": { advantage: 'favorable', label: '유리', desc: '' },
    "venture": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "sojourn": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "symmetra": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "vendetta": { advantage: 'neutral', label: '중립', desc: '' },
    "ashe": { advantage: 'neutral', label: '중립', desc: '' },
    "hanzo": { advantage: 'neutral', label: '중립', desc: '' },
    "cassidy": { advantage: 'neutral', label: '중립', desc: '' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '' },
    "torbjorn": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "reaper": { advantage: 'unfavorable', label: '불리', desc: '1대1' },
    "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' },
    "freya": { advantage: 'unfavorable', label: '불리', desc: '' },
    "mei": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "bastion": { advantage: 'unfavorable', label: '매우 불리', desc: '강습 모드' },
    "sombra": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 지원 (Support)
    "lifeweaver": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "lucio": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "wooyang": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "baptiste-past": { advantage: 'favorable', label: '유리', desc: '과거 기준' },
    "juno": { advantage: 'favorable', label: '유리', desc: '' },
    "moira": { advantage: 'neutral', label: '중립', desc: '' },
    "baptiste": { advantage: 'neutral', label: '중립', desc: '' },
    "brigitte": { advantage: 'neutral', label: '중립', desc: '' },
    "jetpack-cat": { advantage: 'neutral', label: '중립', desc: '' },
    "illari": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "kiriko": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "mercy": { advantage: 'unfavorable', label: '불리', desc: '운영 능력' },
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' },
    "mizuki": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "ana": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "reinhardt": {
    // 돌격군 (Tank)
    "sigma": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "domina": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "zarya": { advantage: 'favorable', label: '유리', desc: '' },
    "junker-queen": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "hazard": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '대인전 유리 / 운영 불리' },
    "dva": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "mauga": { advantage: 'unfavorable', label: '불리', desc: '' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' },
    "winston": { advantage: 'unfavorable', label: '불리', desc: '' },
    "wrecking-ball": { advantage: 'unfavorable', label: '불리', desc: '방패 강타 특전 시 중립' },
    "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 공격군 (Damage)
    "genji": { advantage: 'favorable', label: '매우 유리', desc: '용검 시 매우 유리 / 평상시 불리' },
    "widowmaker": { advantage: 'favorable', label: '유리', desc: '' },
    "ashe": { advantage: 'favorable', label: '유리', desc: '' },
    "sojourn": { advantage: 'favorable', label: '유리', desc: '' },
    "venture": { advantage: 'favorable', label: '유리', desc: '' },
    "soldier-76": { advantage: 'favorable', label: '유리', desc: '대치 시 유리 / 그 외 불리' },
    "vendetta": { advantage: 'neutral', label: '중립', desc: '' },
    "torbjorn": { advantage: 'neutral', label: '중립', desc: '' },
    "hanzo": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "sombra": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "cassidy": { advantage: 'unfavorable', label: '불리', desc: '' },
    "reaper": { advantage: 'unfavorable', label: '불리', desc: '' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '' },
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '' },
    "tracer": { advantage: 'unfavorable', label: '불리', desc: '' },
    "pharah": { advantage: 'unfavorable', label: '불리', desc: '' },
    "echo": { advantage: 'unfavorable', label: '불리', desc: '' },
    "junkrat": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "freya": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 지원군 (Support)
    "mizuki": { advantage: 'favorable', label: '유리', desc: '' },
    "brigitte": { advantage: 'favorable', label: '유리', desc: '' },
    "mercy": { advantage: 'neutral', label: '중립', desc: '' },
    "moira": { advantage: 'neutral', label: '중립', desc: '' },
    "baptiste": { advantage: 'neutral', label: '중립', desc: '' },
    "illari": { advantage: 'neutral', label: '중립', desc: '' },
    "juno": { advantage: 'neutral', label: '중립', desc: '' },
    "ana": { advantage: 'neutral', label: '중립', desc: '스킬 적중 여부에 따라 상극' },
    "lucio": { advantage: 'unfavorable', label: '불리', desc: '' },
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' },
    "wooyang": { advantage: 'unfavorable', label: '불리', desc: '' },
    "lifeweaver": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "roadhog": {
    // 1. 돌격 (Tank)
    "winston": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "doomfist": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "ramattra": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "hazard": { advantage: 'favorable', label: '유리', desc: '' },
    "wrecking-ball": { advantage: 'favorable', label: '유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' },
    "reinhardt": { advantage: 'neutral', label: '중립', desc: '' },
    "mauga": { advantage: 'neutral', label: '중립', desc: '' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '' },
    "junker-queen": { advantage: 'neutral', label: '중립', desc: '' },
    "zarya": { advantage: 'neutral', label: '중립', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '불리', desc: '하드 카운터' },

    // 2. 공격 (Damage)
    "genji": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "vendetta": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "anran": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "venture": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "mei": { advantage: 'favorable', label: '유리', desc: '' },
    "sombra": { advantage: 'favorable', label: '유리', desc: '' },
    "symmetra": { advantage: 'favorable', label: '유리', desc: '' },
    "cassidy": { advantage: 'favorable', label: '유리', desc: '' },
    "torbjorn": { advantage: 'favorable', label: '유리', desc: '' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '' },
    "ashe": { advantage: 'neutral', label: '중립', desc: '' }, // ash -> ashe 수정
    "hanzo": { advantage: 'neutral', label: '중립', desc: '' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '' }, // 트레이서 추가
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '' }, // 바스티온 추가
    "echo": { advantage: 'unfavorable', label: '불리', desc: '' }, // 에코 추가
    "junkrat": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "sojourn": { advantage: 'unfavorable', label: '불리', desc: '' },
    "soldier-76": { advantage: 'unfavorable', label: '불리', desc: '' },
    "widowmaker": { advantage: 'unfavorable', label: '불리', desc: '' },
    "pharah": { advantage: 'unfavorable', label: '불리', desc: '' },
    "freya": { advantage: 'unfavorable', label: '불리', desc: '' },

    // 3. 지원 (Support)
    "lucio": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "baptiste": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "wooyang": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "juno": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "mercy": { advantage: 'favorable', label: '유리', desc: '' },
    "illari": { advantage: 'favorable', label: '유리', desc: '' },
    "kiriko": { advantage: 'favorable', label: '유리', desc: '' },
    "lifeweaver": { advantage: 'neutral', label: '중립', desc: '' },
    "moira": { advantage: 'neutral', label: '중립', desc: '' },
    "brigitte": { advantage: 'neutral', label: '중립', desc: '' }, // 브리기테 추가
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' },
    "jetpack-cat": { advantage: 'unfavorable', label: '불리', desc: '' },
    "ana": { advantage: 'unfavorable', label: '매우 불리', desc: '최악의 천적' }
  },
  "mauga": {
    // 1. 돌격 (Tank)
    "doomfist": { advantage: 'favorable', label: '매우 유리', desc: '모든 스킬 카운터' },
    "reinhardt": { advantage: 'favorable', label: '유리', desc: '' },
    "winston": { advantage: 'favorable', label: '유리', desc: '' },
    "hazard": { advantage: 'favorable', label: '유리', desc: '' },
    "ramattra": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '' },
    "mauga": { advantage: 'neutral', label: '중립', desc: '' },
    "orisa": { advantage: 'neutral', label: '유동적', desc: '특전에 따라 상성 역전 가능' },
    "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "zarya": { advantage: 'unfavorable', label: '불리', desc: '고에너지 시 주의' },
    "sigma": { advantage: 'unfavorable', label: '매우 불리', desc: '하드 카운터' },

    // 2. 공격 (Damage)
    "venture": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "cassidy": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "soldier-76": { advantage: 'favorable', label: '유리', desc: '' },
    "pharah": { advantage: 'favorable', label: '유리', desc: '' },
    "genji": { advantage: 'neutral', label: '중립', desc: '' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '' },
    "sombra": { advantage: 'neutral', label: '중립', desc: '' },
    "echo": { advantage: 'neutral', label: '중립', desc: '' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '' },
    "torbjorn": { advantage: 'neutral', label: '중립', desc: '' },
    "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '' },
    "vendetta": { advantage: 'unfavorable', label: '불리', desc: '' },
    "sojourn": { advantage: 'unfavorable', label: '불리', desc: '' },
    "ashe": { advantage: 'unfavorable', label: '불리', desc: '' },
    "widowmaker": { advantage: 'unfavorable', label: '불리', desc: '' },
    "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' },
    "freya": { advantage: 'unfavorable', label: '불리', desc: '' },
    "hanzo": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 3. 지원 (Support)
    "lucio": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "mercy": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "juno": { advantage: 'favorable', label: '유리', desc: '' },
    "lifeweaver": { advantage: 'neutral', label: '중립', desc: '' },
    "moira": { advantage: 'neutral', label: '중립', desc: '' },
    "baptiste": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "brigitte": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "illari": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "kiriko": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '치유 감소 취약' },
    "wooyang": { advantage: 'unfavorable', label: '불리', desc: '팀파이트 시 주의' },
    "zenyatta": { advantage: 'unfavorable', label: '매우 불리', desc: '부조화의 구슬 주의' }
  },
  "sigma": {
    // 1. 돌격 (Tank)
    "mauga": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "domina": { advantage: 'favorable', label: '유리', desc: '' },
    "roadhog": { advantage: 'favorable', label: '유리', desc: '' },
    "orisa": { advantage: 'favorable', label: '유리', desc: '기본형 기준 / 보호 방벽 특전 시 불리' },
    "hazard": { advantage: 'favorable', label: '유리', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '' },
    "dva": { advantage: 'neutral', label: '유동적', desc: '맵과 지형에 따라 상이' },
    "zarya": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' },
    "reinhardt": { advantage: 'unfavorable', label: '매우 불리', desc: '근접 공격 및 방벽 무시' },
    "winston": { advantage: 'unfavorable', label: '매우 불리', desc: '근접 공격 및 방벽 무시' },

    // 2. 공격 (Damage)
    "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "emre": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "genji": { advantage: 'favorable', label: '유리', desc: '' },
    "sojourn": { advantage: 'favorable', label: '유리', desc: '' },
    "soldier-76": { advantage: 'favorable', label: '유리', desc: '' },
    "cassidy": { advantage: 'favorable', label: '유리', desc: '' },
    "freya": { advantage: 'favorable', label: '유리', desc: '' },
    "bastion": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "ashe": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "torbjorn": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '' },
    "venture": { advantage: 'neutral', label: '중립', desc: '' },
    "hanzo": { advantage: 'neutral', label: '중립', desc: '' },
    "vendetta": { advantage: 'neutral', label: '유동적', desc: '에임과 강착 적중률에 따라 상이' },
    "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "sombra": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "anran": { advantage: 'unfavorable', label: '불리', desc: '' },
    "echo": { advantage: 'unfavorable', label: '불리', desc: '' },
    "junkrat": { advantage: 'unfavorable', label: '불리', desc: '' },
    "tracer": { advantage: 'unfavorable', label: '불리', desc: '' },
    "symmetra": { advantage: 'unfavorable', label: '매우 불리', desc: '안티 배리어' },

    // 3. 지원 (Support)
    "ana": { advantage: 'favorable', label: '유리', desc: '' },
    "illari": { advantage: 'favorable', label: '유리', desc: '' },
    "zenyatta": { advantage: 'favorable', label: '유리', desc: '' },
    "mercy": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "baptiste": { advantage: 'neutral', label: '중립', desc: '' },
    "kiriko": { advantage: 'neutral', label: '중립', desc: '' },
    "brigitte": { advantage: 'neutral', label: '유동적', desc: '근접 허용 시 불리' },
    "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '' },
    "lucio": { advantage: 'unfavorable', label: '불리', desc: '' },
    "moira": { advantage: 'unfavorable', label: '불리', desc: '' },
    "wooyang": { advantage: 'unfavorable', label: '불리', desc: '' },
    "jetpack-cat": { advantage: 'unfavorable', label: '불리', desc: '' },
    "juno": { advantage: 'unfavorable', label: '불리', desc: '난전 유도 및 궁극기 카운터' }
  },
  "orisa": {
    // 돌격 (Tank)
    "reinhardt": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "junker-queen": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "roadhog": { advantage: 'favorable', label: '유리', desc: '' },
    "wrecking-ball": { advantage: 'favorable', label: '유리', desc: '' },
    "doomfist": { advantage: 'favorable', label: '유리', desc: '' },
    "hazard": { advantage: 'favorable', label: '유리', desc: '' },
    "ramattra": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "orisa": { advantage: 'neutral', label: '중립', desc: '미러전' },
    "mauga": { advantage: 'unfavorable', label: '불리', desc: '보호 방벽 시 유리' },
    "winston": { advantage: 'favorable', label: '유리', desc: '보호 방벽 시 불리' },
    "zarya": { advantage: 'unfavorable', label: '매우 불리', desc: '보호 방벽 시 중립' },
    "sigma": { advantage: 'unfavorable', label: '매우 불리', desc: '보호 방벽 시 유리' },

    // 공격 (Damage)
    "mei": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "cassidy": { advantage: 'favorable', label: '유리', desc: '' },
    "vendetta": { advantage: 'favorable', label: '유리', desc: '보호 방벽 시 불리' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '' },
    "sombra": { advantage: 'neutral', label: '중립', desc: '' },
    "venture": { advantage: 'neutral', label: '중립', desc: '' },
    "soldier-76": { advantage: 'neutral', label: '중립', desc: '' },
    "sojourn": { advantage: 'neutral', label: '중립', desc: '' },
    "freya": { advantage: 'neutral', label: '중립', desc: '' },
    "echo": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "hanzo": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "widowmaker": { advantage: 'unfavorable', label: '불리', desc: '보호 방벽 시 유리' },
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '' },
    "tracer": { advantage: 'unfavorable', label: '불리', desc: '' },
    "pharah": { advantage: 'unfavorable', label: '불리', desc: '' },
    "junkrat": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 지원 (Support)
    "brigitte": { advantage: 'favorable', label: '유리', desc: '' },
    "ana": { advantage: 'favorable', label: '유리', desc: '' },
    "jetpack-cat": { advantage: 'favorable', label: '유리', desc: '' },
    "mercy": { advantage: 'neutral', label: '중립', desc: '' },
    "baptiste": { advantage: 'neutral', label: '중립', desc: '' },
    "illari": { advantage: 'neutral', label: '중립', desc: '' },
    "moira": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "lucio": { advantage: 'unfavorable', label: '불리', desc: '' },
    "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '' },
    "wooyang": { advantage: 'unfavorable', label: '불리', desc: '' },
    "juno": { advantage: 'unfavorable', label: '불리', desc: '' },
    "kiriko": { advantage: 'unfavorable', label: '불리', desc: '' },
    "zenyatta": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "winston": {
    // 1. 돌격 (Tank)
    "zarya": { advantage: 'favorable', label: '매우 유리', desc: '기동성 차이로 운영 압승' },
    "domina": { advantage: 'favorable', label: '유리', desc: '도미나의 방벽 관통 공격 주의' },
    "sigma": { advantage: 'favorable', label: '약간 유리', desc: '방벽으로 시그마 공격 방어 및 기술 무시 타격' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '방벽 밖으로 밀려나는 것 주의' },
    "ramattra": { advantage: 'neutral', label: '중립', desc: '탐식의 소용돌이 및 네메시스 폼 주의' },
    "reinhardt": { advantage: 'neutral', label: '중립', desc: '거리 조절을 통한 일방적 딜교 가능' },
    "hazard": { advantage: 'neutral', label: '중립', desc: '가시벽 퇴로 봉쇄 주의' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '서로 잡기 힘듦' },
    "dva": { advantage: 'unfavorable', label: '약간 불리', desc: '정면 교전은 불리하나 드리블 가능' },
    "orisa": { advantage: 'unfavorable', label: '약간 불리', desc: '투창에 의한 진입 차단 주의' },
    "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '고티어에서는 고지대 선점으로 우세 가능' },
    "roadhog": { advantage: 'unfavorable', label: '매우 불리', desc: '아나/젠야타 도움 없이는 픽 변경 권장' },
    "mauga": { advantage: 'unfavorable', label: '매우 불리', desc: '케이지 혈투 시 탈출 불가' },

    // 2. 공격 (Damage)
    "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '위도우를 견제하는 극상성' },
    "genji": { advantage: 'favorable', label: '매우 유리', desc: '테슬라 캐논은 튕겨내기 무시' },
    "tracer": { advantage: 'favorable', label: '유리', desc: '' },
    "sombra": { advantage: 'favorable', label: '유리', desc: '은신 찾기 용이 및 방벽으로 해킹 차단' },
    "hanzo": { advantage: 'favorable', label: '유리', desc: '폭풍 화살 폭딜 주의' },
    "symmetra": { advantage: 'favorable', label: '유리', desc: '포탑 제거 용이 / 3단계 빨대 주의' },
    "anran": { advantage: 'favorable', label: '유리', desc: '' },
    "emre": { advantage: 'favorable', label: '유리', desc: '' },
    "ashe": { advantage: 'favorable', label: '약간 유리', desc: '충격 샷건 유무 확인 후 진입' },
    "sojourn": { advantage: 'favorable', label: '약간 유리', desc: '방벽으로 레일건 충전 최소화' },
    "mei": { advantage: 'favorable', label: '약간 유리', desc: '지붕이 높은 곳에서 교전 유리' },
    "pharah": { advantage: 'favorable', label: '약간 유리', desc: '우클릭 견제 및 공중 타격 가능' },
    "echo": { advantage: 'favorable', label: '약간 유리', desc: '우클릭 견제 및 공중 타격 가능' },
    "venture": { advantage: 'neutral', label: '중립', desc: '드릴 돌진 넉백 주의' },
    "freya": { advantage: 'neutral', label: '중립', desc: '우클릭 견제 필수' },
    "cassidy": { advantage: 'unfavorable', label: '불리 / 유리', desc: '은탄환 특전 선택 시 유리해짐' },
    "junkrat": { advantage: 'unfavorable', label: '약간 불리', desc: '강철 덫 변수 주의' },
    "vendetta": { advantage: 'unfavorable', label: '불리', desc: '모든 공격이 방벽을 무시' },
    "torbjorn": { advantage: 'unfavorable', label: '불리', desc: '과부하 시 화력 주의' },
    "reaper": { advantage: 'unfavorable', label: '매우 불리', desc: '흡혈량이 윈스턴 딜량을 상쇄' },
    "bastion": { advantage: 'unfavorable', label: '매우 불리', desc: '강습 모드 시 심리전 필수' },

    // 3. 지원 (Support)
    "kiriko": { advantage: 'favorable', label: '매우 유리', desc: '원시의 분노로 여우길 훼방 가능' },
    "baptiste": { advantage: 'favorable', label: '유리', desc: '불사 장치 소모 유도' },
    "wooyang": { advantage: 'favorable', label: '유리', desc: '' },
    "illari": { advantage: 'favorable', label: '약간 유리', desc: '태양석 제거 또는 무시' },
    "lifeweaver": { advantage: 'favorable', label: '약간 유리', desc: '방벽으로 힐 차단 가능' },
    "juno": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "mizuki": { advantage: 'favorable', label: '약간 유리', desc: '속박 사슬 주의' },
    "mercy": { advantage: 'neutral', label: '중립', desc: '수호천사 추격이 관건' },
    "moira": { advantage: 'neutral', label: '중립', desc: '다른 타깃 노리는 것이 효율적' },
    "lucio": { advantage: 'neutral', label: '중립', desc: '넉백으로 인한 템포 방해 주의' },
    "brigitte": { advantage: 'neutral', label: '중립', desc: '테슬라 캐논으로 방벽 무시 가능' },
    "jetpack-cat": { advantage: 'neutral', label: '중립', desc: '사거리 안으로 유도 필요' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '방벽 심리전으로 수면총/힐밴 유도' },
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '부조화의 구슬 주의' }
  },
  "zarya": {
    // 돌격 (Tank)
    "dva": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "orisa": { advantage: 'favorable', label: '매우 유리', desc: '보호 방벽 특전 시 중립' },
    "junker-queen": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "sigma": { advantage: 'favorable', label: '유리', desc: '대인전 유리 / 팀파이트 약간 불리' },
    "hazard": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '' },
    "zarya": { advantage: 'neutral', label: '중립', desc: '미러전' },
    "domina": { advantage: 'unfavorable', label: '불리', desc: '' },
    "ramattra": { advantage: 'unfavorable', label: '불리', desc: '' },
    "reinhardt": { advantage: 'unfavorable', label: '불리', desc: '' },
    "wrecking-ball": { advantage: 'unfavorable', label: '불리', desc: '' },
    "winston": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 공격 (Damage)
    "genji": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "sombra": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "junkrat": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "cassidy": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "anran": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "tracer": { advantage: 'favorable', label: '유리', desc: '' },
    "bastion": { advantage: 'favorable', label: '유리', desc: '수색 모드' },
    "venture": { advantage: 'favorable', label: '유리', desc: '' },
    "torbjorn": { advantage: 'favorable', label: '유리', desc: '' },
    "vendetta": { advantage: 'neutral', label: '유동적', desc: '' },
    "freya": { advantage: 'unfavorable', label: '불리', desc: '대인전 불리 / 운영 유리' },
    "soldier-76": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "ashe": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '' },
    "sojourn": { advantage: 'unfavorable', label: '불리', desc: '' },
    "echo": { advantage: 'unfavorable', label: '불리', desc: '' },
    "emre": { advantage: 'unfavorable', label: '불리', desc: '' },
    "widowmaker": { advantage: 'unfavorable', label: '불리', desc: '' },
    "bastion": { advantage: 'unfavorable', label: '매우 불리', desc: '강습 모드' },
    "hanzo": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 지원 (Support)
    "ana": { advantage: 'favorable', label: '유리', desc: '' },
    "illari": { advantage: 'favorable', label: '유리', desc: '' },
    "lucio": { advantage: 'favorable', label: '유리', desc: '' },
    "mercy": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "mizuki": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "moira": { advantage: 'neutral', label: '중립', desc: '' },
    "juno": { advantage: 'neutral', label: '중립', desc: '' },
    "baptiste": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '' },
    "wooyang": { advantage: 'unfavorable', label: '불리', desc: '' },
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '' },
    "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "junker-queen": {
    // 돌격 (Tank)
    "ramattra": { advantage: 'favorable', label: '유리', desc: '' },
    "reinhardt": { advantage: 'favorable', label: '유리', desc: '' },
    "wrecking-ball": { advantage: 'favorable', label: '유리', desc: '' },
    "winston": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "hazard": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "mauga": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "dva": { advantage: 'neutral', label: '중립', desc: '' },
    "domina": { advantage: 'neutral', label: '중립', desc: '' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '' },
    "roadhog": { advantage: 'neutral', label: '중립', desc: '' },
    "sigma": { advantage: 'neutral', label: '중립', desc: '' },
    "junker-queen": { advantage: 'neutral', label: '중립', desc: '미러전' },
    "zarya": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "orisa": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 공격 (Damage)
    "symmetra": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "bastion": { advantage: 'favorable', label: '유리', desc: '' },
    "anran": { advantage: 'favorable', label: '유리', desc: '' },
    "tracer": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "genji": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "venture": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '' },
    "vendetta": { advantage: 'neutral', label: '중립', desc: '' },
    "cassidy": { advantage: 'neutral', label: '중립', desc: '' },
    "torbjorn": { advantage: 'neutral', label: '중립', desc: '' },
    "sojourn": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "soldier-76": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "sombra": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "hanzo": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "mei": { advantage: 'unfavorable', label: '불리', desc: '' },
    "ashe": { advantage: 'unfavorable', label: '불리', desc: '' },
    "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "widowmaker": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "junkrat": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "freya": { advantage: 'unfavorable', label: '매우 불리', desc: '' },

    // 지원 (Support)
    "moira": { advantage: 'favorable', label: '매우 유리', desc: '' },
    "lifeweaver": { advantage: 'favorable', label: '유리', desc: '' },
    "mercy": { advantage: 'favorable', label: '유리', desc: '' },
    "mizuki": { advantage: 'favorable', label: '유리', desc: '' },
    "wooyang": { advantage: 'favorable', label: '유리', desc: '' },
    "zenyatta": { advantage: 'favorable', label: '유리', desc: '' },
    "juno": { advantage: 'favorable', label: '유리', desc: '' },
    "illari": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "baptiste": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "brigitte": { advantage: 'neutral', label: '중립', desc: '' },
    "lucio": { advantage: 'unfavorable', label: '약간 불리', desc: '' },
    "ana": { advantage: 'unfavorable', label: '불리', desc: '' },
    "kiriko": { advantage: 'unfavorable', label: '매우 불리', desc: '' },
    "jetpack-cat": { advantage: 'unfavorable', label: '매우 불리', desc: '' }
  },
  "hazard": {
    // 1. 돌격 (Tank)
    "winston": { advantage: 'favorable', label: '약간 유리', desc: '기동성 봉쇄 및 방벽 너머로 아군 보호 가능' },
    "doomfist": { advantage: 'neutral', label: '중립', desc: '서로의 방어/이동기를 끊을 수 있는 까다로운 상대' },
    "ramattra": { advantage: 'neutral', label: '중립', desc: '정직한 1:1은 불리하나 기동성으로 뒷라인 공략 가능' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '서로 잡기 힘드나 가시벽으로 변수 차단 가능' },
    "hazard": { advantage: 'neutral', label: '중립', desc: '미러전, 뒷라인 척살 속도 및 상황 판단 싸움' },
    "dva": { advantage: 'unfavorable', label: '약간 불리', desc: '매트릭스에 공격 대부분이 상쇄됨' },
    "reinhardt": { advantage: 'unfavorable', label: '약간 불리', desc: '근접 체급 차이 및 방벽에 화력 차단' },
    "zarya": { advantage: 'unfavorable', label: '약간 불리', desc: '유도 가시가 자리야 에너지를 채워주는 역효과' },
    "junker-queen": { advantage: 'unfavorable', label: '약간 불리', desc: '지속력에 밀리나 살육을 가시 소나기로 차단 가능' },
    "sigma": { advantage: 'unfavorable', label: '약간 불리', desc: '강착과 손아귀에 취약하므로 시그마 패싱 권장' },
    "roadhog": { advantage: 'unfavorable', label: '불리', desc: '갈고리에 저항과 궁극기가 쉽게 차단됨' },
    "mauga": { advantage: 'unfavorable', label: '불리', desc: '화력 차이 극심, 가시벽으로 심장 턴 낭비 유도 필수' },
    "orisa": { advantage: 'unfavorable', label: '불리', desc: '모든 스킬이 카운터당하므로 정면 대결 회피 요망' },
    "domina": { advantage: 'unknown', label: '-', desc: '상세 상성 정보 부족' },

    // 2. 공격 (Damage)
    "soldier-76": { advantage: 'favorable', label: '매우 유리', desc: '생체장 무시하는 폭딜로 도주 전 처치 가능' },
    "hanzo": { advantage: 'favorable', label: '매우 유리', desc: '고지대 점령 무력화 및 저항으로 폭풍 화살 상쇄' },
    "venture": { advantage: 'favorable', label: '유리', desc: '근접전 우위 및 가시벽으로 잠복 후 상황 제어' },
    "sojourn": { advantage: 'favorable', label: '유리', desc: '이동기 차단 시 확정 킬, 전자포 피해 누적 낮음' },
    "widowmaker": { advantage: 'favorable', label: '유리', desc: '갈고리 도주를 덤벼들기로 재추격 가능' },
    "ashe": { advantage: 'favorable', label: '유리', desc: '충격 샷건보다 덤벼들기 쿨타임이 빨라 추격 용이' },
    "symmetra": { advantage: 'favorable', label: '약간 유리', desc: '포탑 즉시 철거 가능 및 체급 압승' },
    "mei": { advantage: 'favorable', label: '약간 유리', desc: '빙벽을 기동성으로 극복하며 메이를 가두기 쉬움' },
    "cassidy": { advantage: 'favorable', label: '약간 유리', desc: '가시벽으로 이격 시 유리하나 섬광탄 주의' },
    "vendetta": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "genji": { advantage: 'neutral', label: '중립', desc: '튕겨내기에 스킬이 막히나 체급 자체는 우위' },
    "reaper": { advantage: 'neutral', label: '중립', desc: '근접 체급이 비슷하므로 무리한 교전보다 타깃 변경 권장' },
    "tracer": { advantage: 'neutral', label: '중립', desc: '서로 맞추기 힘드나 가시벽으로 퇴로 차단 가능' },
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '강습 모드 시 즉시 탈출 필요, 가시벽도 쉽게 파괴됨' },
    "sombre": { advantage: 'unfavorable', label: '불리', desc: '해킹 시 생존 및 딜링 능력이 급락함' },
    "torbjorn": { advantage: 'unfavorable', label: '불리', desc: '포탑 철거가 어렵고 과부하 시 맞딜 불리' },
    "junkrat": { advantage: 'unfavorable', label: '불리', desc: '덫 변수와 근접 평타 폭딜이 매우 위협적' },
    "pharah": { advantage: 'unfavorable', label: '매우 불리', desc: '대공 공격 수단 전무' },
    "echo": { advantage: 'unfavorable', label: '매우 불리', desc: '복제 시 위험도 급증 및 대공 능력 부족' },
    "freya": { advantage: 'unfavorable', label: '매우 불리', desc: '공중 체류 능력이 좋아 추격 불가' },
    "anran": { advantage: 'unknown', label: '-', desc: '상세 상성 정보 부족' },
    "emre": { advantage: 'unknown', label: '-', desc: '상세 상성 정보 부족' },
    "sierra": { advantage: 'unknown', label: '-', desc: '상세 상성 정보 부족' },

    // 3. 지원 (Support)
    "baptiste": { advantage: 'favorable', label: '매우 유리', desc: '모든 스킬이 불사 장치를 카운터침' },
    "juno": { advantage: 'favorable', label: '매우 유리', desc: '수평 비행의 한계로 인해 사냥하기 쉬움' },
    "lucio": { advantage: 'favorable', label: '매우 유리', desc: '러쉬 조합의 기동성을 가시 소나기로 완벽 차단' },
    "moira": { advantage: 'favorable', label: '유리', desc: '1:1은 압도하나 모이라의 세이브 능력은 주의' },
    "illari": { advantage: 'favorable', label: '유리', desc: '태양석만 치우면 도주기 쿨타임 차이로 사냥 가능' },
    "kiriko": { advantage: 'favorable', label: '유리', desc: '히트박스가 작아 에임이 중요하나 운영상 우위' },
    "mercy": { advantage: 'neutral', label: '중립', desc: '비행 영웅 조합 여부에 따라 상성 급변' },
    "ana": { advantage: 'neutral', label: '중립', desc: '수면총/힐밴에 취약하나 가시벽으로 고립 시 사냥 가능' },
    "brigitte": { advantage: 'unfavorable', label: '약간 불리', desc: '넉백과 방밀로 진입을 방해받음' },
    "lifeweaver": { advantage: 'unfavorable', label: '불리', desc: '구원의 손길과 연꽃 단상이 킬각을 계속 방해' },
    "zenyatta": { advantage: 'unfavorable', label: '불리', desc: '부조화와 밀어차기 저항 시 해저드가 먼저 녹음' },
    "jetpack-cat": { advantage: 'unfavorable', label: '약간 불리', desc: '비행 회피 및 낙사 변수 주의' },
    "mizuki": { advantage: 'unknown', label: '-', desc: '상세 상성 정보 부족' },
    "wooyang": { advantage: 'unknown', label: '-', desc: '상세 상성 정보 부족' }
  },
  "wrecking-ball": {
    // 1. 돌격 (Tank)
    "domina": { advantage: 'favorable', label: '매우 유리', desc: '기동성 압승 및 판옵티콘 무력화 가능' },
    "winston": { advantage: 'favorable', label: '유리', desc: '서로 잡기 힘들지만 운영 및 진형 파괴력 우위' },
    "ramattra": { advantage: 'favorable', label: '유리 (팀파이트)', desc: '뒷라인 공략 시 라마트라의 케어 능력 부재 활용' },
    "zarya": { advantage: 'favorable', label: '유리', desc: '변칙적 기동성으로 자리야의 전선 유지 방해' },
    "dva": { advantage: 'neutral', label: '중립', desc: '기동성(볼) vs DPS 및 매트릭스 케어(디바)의 눈치 싸움' },
    "wrecking-ball": { advantage: 'neutral', label: '중립', desc: '에임, 보호막 수급, 지형지물 활용 숙련도 싸움' },
    "junker-queen": { advantage: 'neutral', label: '중립', desc: '결정력 부족한 정커퀸 vs 근접전 부담스러운 레킹볼' },
    "hazard": { advantage: 'neutral', label: '중립', desc: '서로 잡기 힘든 기동력, 가시벽의 변수 주의' },
    "reinhardt": { advantage: 'neutral', label: '중립 (특전 대응)', desc: '기본적으론 유리하나 방패 강타 특전에 불공 차단 주의' },
    "sigma": { advantage: 'neutral', label: '중립 (1대1)', desc: '팀파이트는 유리하나 강착 및 방벽의 지뢰 철거 주의' },
    "doomfist": { advantage: 'unfavorable', label: '약간 불리', desc: '큰 덩치로 인해 둠피스트의 스킬 적중 및 충전 허용' },
    "orisa": { advantage: 'unfavorable', label: '불리', desc: '방어 강화 및 투창으로 모든 넉백과 진입 차단' },
    "roadhog": { advantage: 'unfavorable', label: '매우 불리', desc: '갈고리 CC기 및 근접 원콤 콤보에 극히 취약' },
    "mauga": { advantage: 'unfavorable', label: '매우 불리 (1대1)', desc: '압도적 DPS에 녹아내림, 케이지 혈투 시 확정 사망' },

    // 2. 공격 (Damage)
    "widowmaker": { advantage: 'favorable', label: '매우 유리', desc: '최악의 카운터, 헤드 판정 없이 끝까지 추격 가능' },
    "sojourn": { advantage: 'favorable', label: '매우 유리', desc: '공 모드로 레일건 충전 및 치명타 억제' },
    "genji": { advantage: 'favorable', label: '유리', desc: '기동성 우위 및 지뢰밭으로 겐지의 동선 완벽 봉쇄' },
    "soldier-76": { advantage: 'favorable', label: '유리', desc: 'CC기 없는 솔저를 근접전에서 압살 가능' },
    "ashe": { advantage: 'favorable', label: '유리', desc: '고지대 점령 무력화, 밥을 보호막 수급용으로 활용' },
    "tracer": { advantage: 'favorable', label: '유리', desc: '서로 잡기 힘드나 파일드라이버 한 방에 빈사' },
    "pharah": { advantage: 'favorable', label: '유리', desc: '히트스캔 기관포로 견제 가능 및 포화 시 무방비' },
    "freya": { advantage: 'favorable', label: '유리', desc: '기동성 차이로 추격 우위, 올가미만 피하면 낙승' },
    "hanzo": { advantage: 'favorable', label: '약간 유리', desc: '폭풍 화살 폭딜만 주의하면 기습으로 처치 용이' },
    "junkrat": { advantage: 'favorable', label: '약간 유리', desc: '거리 조절 시 유리하나 강철 덫 변수 주의' },
    "anran": { advantage: 'neutral', label: '중립', desc: '기동성 우위 vs 화상 압박 및 세이브 능력' },
    "venture": { advantage: 'neutral', label: '중립', desc: '서로 잡기 힘든 체급과 이동기 보유' },
    "mei": { advantage: 'unfavorable', label: '약간 불리', desc: '냉각수 슬로우와 빙벽으로 인한 퇴로 차단 치명적' },
    "symmetra": { advantage: 'unfavorable', label: '약간 불리', desc: '감시 포탑의 감속으로 가속도 무력화' },
    "bastion": { advantage: 'unfavorable', label: '불리', desc: '강습 모드의 압도적 화력 주의, 수색 모드 유도 필요' },
    "sombre": { advantage: 'unfavorable', label: '불리', desc: '해킹으로 인한 모드 강제 해제 및 스킬 봉쇄' },
    "cassidy": { advantage: 'unfavorable', label: '불리', desc: '섬광탄 적중 시 모든 기동 스킬 봉인 및 난사 확정' },
    "torbjorn": { advantage: 'unfavorable', label: '불리', desc: '포탑의 위치 노출 및 과부하 본체의 강력한 근접 화력' },
    "reaper": { advantage: 'unfavorable', label: '불리', desc: '큰 히트박스에 박히는 샷건 폭딜과 피흡 감당 불가' },
    "echo": { advantage: 'unfavorable', label: '불리', desc: '점착 폭탄 및 광선 집중 폭딜에 순식간에 해체' },
    "vendetta": { advantage: 'unfavorable', label: '불리', desc: '정면 싸움 체급 열세 및 지속적인 감속 마킹' },

    // 3. 지원 (Support)
    "baptiste": { advantage: 'favorable', label: '매우 유리', desc: '진형 붕괴로 불사 장치 및 치유 파동 무력화' },
    "kiriko": { advantage: 'favorable', label: '유리', desc: '쿠나이 위협 낮음, 지뢰밭으로 여우길 카운터' },
    "mercy": { advantage: 'favorable', label: '유리', desc: '부활 끊기 용이, 기습 파일드라이버에 취약' },
    "wooyang": { advantage: 'favorable', label: '유리', desc: '' },
    "juno": { advantage: 'favorable', label: '유리', desc: '뚜벅이급 맷집과 CC기 부재로 좋은 먹잇감' },
    "jetpack-cat": { advantage: 'favorable', label: '약간 유리', desc: '' },
    "moira": { advantage: 'favorable', label: '약간 유리', desc: '잡기는 힘들지만 지뢰밭으로 융화 운영 방해 가능' },
    "illari": { advantage: 'favorable', label: '약간 유리', desc: '태양석만 제거하면 주도권 확보 가능' },
    "lifeweaver": { advantage: 'neutral', label: '중립', desc: '연꽃 단상과 나무로 킬각 방해 및 동선 차단 변수' },
    "lucio": { advantage: 'neutral', label: '중립', desc: '넉백으로 볼 가속도 방해 및 소리 방벽으로 궁 카운터' },
    "ana": { advantage: 'unknown', label: '유동적', desc: '수면총 적중 여부에 따라 상성이 극과 극으로 갈림' },
    "zenyatta": { advantage: 'unknown', label: '유동적', desc: '부조화의 위협 vs 젠야타의 물몸 암살 가능성' },
    "brigitte": { advantage: 'unfavorable', label: '불리', desc: '방벽, 넉백, 밀쳐내기로 진입 시 가속도 완벽 차단' },
    "mizuki": { advantage: 'unfavorable', label: '불리', desc: '속박 사슬 CC기로 인한 기동성 제어' }
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
                                                
                                                // 영웅 정보가 없거나 역할군이 다르면 무시
                                                if (!hInfo || hInfo.role !== roleGroup) return false;
                                                
                                                // 글자 '포함'이 아니라 '완벽 일치'할 때만 넣도록 빡빡하게 수정!
                                                if (grade.filter === '매우 유리') return v.label === '매우 유리';
                                                if (grade.filter === '유리') return v.label === '유리' || v.label === '약간 유리';
                                                if (grade.filter === '중립') return v.label === '중립' || v.label === '유동적';
                                                if (grade.filter === '불리') return v.label === '불리' || v.label === '약간 불리';
                                                if (grade.filter === '매우 불리') return v.label === '매우 불리';
                                                
                                                return false;
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