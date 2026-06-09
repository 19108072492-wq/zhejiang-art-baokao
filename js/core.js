/**
 * 非凡教育 · 浙江艺考志愿助手 — 核心引擎
 * 综合分计算 + 数据管理 + 匹配引擎
 */
// ===== 综合分公式 =====
const FORMULA={
  finearts:{cw:.5,aw:.5,am:2.5,t:'文化×50%+统考×2.5×50%'},
  music:{cw:.5,aw:.5,am:2.5,t:'文化×50%+统考×2.5×50%'},
  dance:{cw:.5,aw:.5,am:2.5,t:'文化×50%+统考×2.5×50%'},
  acting:{cw:.5,aw:.5,am:2.5,t:'文化×50%+统考×2.5×50%'},
  calligraphy:{cw:.5,aw:.5,am:2.5,t:'文化×50%+统考×2.5×50%'},
  broadcast:{cw:.8,aw:.2,am:2.5,t:'文化×80%+统考×2.5×20%'},
};
function calcScore(c,a,k){const f=FORMULA[k];if(!f)throw new Error('未知门类');const v=Math.round((c*f.cw+a*f.am*f.aw)*100)/100;return{score:v,text:f.t};}

// ===== 数据管理 =====
const CATS=[{k:'finearts',l:'美术与设计类',i:'🎨'},{k:'music',l:'音乐类',i:'🎵'},{k:'dance',l:'舞蹈类',i:'💃'},{k:'broadcast',l:'播音与主持类',i:'🎙️'},{k:'acting',l:'表（导）演类',i:'🎭'},{k:'calligraphy',l:'书法类',i:'✒️'}];
function loadData(k){if(window.__D__&&window.__D__[k])return window.__D__[k];return[];}
function saveData(k,d){localStorage.setItem('zjyk_'+k,JSON.stringify(d));}
function clearData(k){localStorage.removeItem('zjyk_'+k);}
function totalCount(){let s=0;CATS.forEach(c=>s+=loadData(c.k).length);return s;}

// ===== 匹配引擎 v5 =====
const CULTURE_MIN={finearts:369,broadcast:369,calligraphy:369,dance:320,music:320,acting:320};
const TIER=[{t:'reach',l:'🔴 冲',min:-Infinity,max:0},{t:'match',l:'🟡 稳',min:0,max:15},{t:'safety',l:'🟢 保',min:15,max:35}];

function matchSchools(userScore,artKey,cultureScore,pool){
  pool=pool.filter(r=>!r.isSuspended);
  const stats={reach:0,match:0,safety:0,out:0};
  const results=[];
  for(const row of pool){
    const s=row.compositeScore;
    if(!(typeof s==='number'&&s>0))continue;
    const diff=userScore-s;
    let tier='out';
    for(const c of TIER){if(diff>=c.min&&diff<=c.max){tier=c.t;break;}}
    if(row.scoreSource==='estimated'){if(tier==='match')tier='reach';else if(tier==='safety')tier='match';}
    stats[tier]++;
    results.push({schoolCode:row.schoolCode,schoolName:row.schoolName,majorCode:row.majorCode,majorName:row.majorName,city:row.city,schoolType:row.schoolType,is985:row.is985,is211:row.is211,isDoubleFirst:row.isDoubleFirst,isPublic:row.isPublic,isPrivate:row.isPrivate,tuition:row.tuition,dorm:row.dorm,campus:row.campus,plan24:row.plan24,plan25:row.plan25,rankLevel:row.rankLevel,scoreLineReq:row.scoreLineReq,rankPosition:row.rankPosition,note:row.note,courseGuide:row.courseGuide,talentGoal:row.talentGoal,subCategory:row.subCategory,compositeScore:s,diff,tier,confidence:row.scoreSource==='estimated'?'low':(row.isNew?'medium':'high'),scoreSource:row.scoreSource||'actual',isNew:!!row.isNew});
  }
  const ord={reach:0,match:1,safety:2,out:3};
  results.sort((a,b)=>ord[a.tier]-ord[b.tier]||Math.abs(a.diff)-Math.abs(b.diff));
  // 推荐20校：冲6+稳8+保6，9维度严格评分
  function scoredScore(r,raw){
    // 1. 分差接近度 (weight: 30): 采用平方衰减，拉开差距
    const diffAbs=Math.abs(r.diff||0);
    const proximity=Math.pow(Math.max(0,1-diffAbs/50),2); // 平方加速衰减

    // 2. 院校层次 (weight: 22): 档位区间拉大，最高0.95→最低0.05
    let tierScore=0.05,tierLabel='民办';
    if(r.is985){tierScore=0.95;tierLabel='985';}
    else if(r.is211){tierScore=0.78;tierLabel='211';}
    else if(r.isDoubleFirst){tierScore=0.62;tierLabel='双一流';}
    else if(r.isPublic){
      const rl=String(r.rankLevel||'');
      // 细拆公办内部
      if(rl.includes('A+')||rl.includes('A ')||rl==='A'){tierScore=0.48;tierLabel='公办(A级)';}
      else if(rl.includes('B+')||rl.includes('B ')){tierScore=0.36;tierLabel='公办(B级)';}
      else{tierScore=0.24;tierLabel='公办(普通)';}
    }else{tierScore=0.12;tierLabel='民办/独立学院';}

    // 3. 软科排名 (weight: 8): 得分区间压缩，A+才0.9
    let rankScore=0;
    const rl=String(r.rankLevel||'');
    if(rl.includes('A+'))rankScore=0.90;
    else if(rl.includes('A')&&!rl.includes('+'))rankScore=0.72;
    else if(rl.includes('A-'))rankScore=0.58;
    else if(rl.includes('B+'))rankScore=0.45;
    else if(rl.includes('B')&&!rl.includes('+')&&!rl.includes('-'))rankScore=0.33;
    else if(rl.includes('B-'))rankScore=0.22;
    else if(rl.includes('C+'))rankScore=0.14;
    else if(rl.includes('C'))rankScore=0.08;
    else rankScore=0.04;

    // 4. 数据可信度 (weight: 12)
    const confidence=r.scoreSource==='estimated'?0.2:(r.rankPosition&&r.rankPosition>0?0.95:0.55);

    // 5. 地理位置 (weight: 6): 降低省内权重，避免过度偏向
    const city=r.city||'';
    let localScore=0;
    if(city.includes('浙江'))localScore=0.70;
    else if(/上海|南京|苏州|无锡|常州|南通|杭州/.test(city))localScore=0.45;
    else if(/江苏|安徽|福建|江西/.test(city))localScore=0.25;
    else localScore=0.08;

    // 6. 学费合理度 (weight: 6): 压分
    const t=r.tuition||0;
    let tuitionScore=0;
    if(t<=6000)tuitionScore=0.95;
    else if(t<=12000)tuitionScore=0.75;
    else if(t<=20000)tuitionScore=0.52;
    else if(t<=35000)tuitionScore=0.30;
    else if(t<=60000)tuitionScore=0.15;
    else tuitionScore=0.05;

    // 7. 计划数 (weight: 5): 压分
    const plan=(r.plan25||r.plan24||0);
    let planScore=0;
    if(plan>=30)planScore=0.90;
    else if(plan>=15)planScore=0.60;
    else if(plan>=8)planScore=0.35;
    else if(plan>=3)planScore=0.18;
    else planScore=0.06;

    // 8. 位次匹配度 (weight: 8)
    let rankMatchScore=0.25;
    if(r.rankPosition&&typeof r.rankPosition==='number'&&r.rankPosition>0){
      const rankGap=Math.abs(r.rankPosition-100);
      rankMatchScore=Math.pow(Math.max(0,1-rankGap/Math.max(r.rankPosition,1)),1.5);
    }

    // 9. 城市级别 (weight: 3): 继续压权
    let cityLevelScore=0.08;
    if(/杭州|宁波/.test(city))cityLevelScore=0.85;
    else if(/上海|北京|广州|深圳/.test(city))cityLevelScore=0.72;
    else if(/南京|苏州|武汉|成都|重庆|天津|西安|长沙|青岛/.test(city))cityLevelScore=0.52;
    else if(/温州|绍兴|金华|嘉兴|台州|湖州/.test(city))cityLevelScore=0.38;
    else if(/福州|厦门|合肥|南昌|郑州|济南|无锡|常州/.test(city))cityLevelScore=0.25;
    else if(/浙江/.test(city))cityLevelScore=0.18;
    else cityLevelScore=0.10;

    // 加权: 原始分 × 权重 → 归一化为0-1
    const w=[0.30,0.22,0.08,0.12,0.06,0.06,0.05,0.08,0.03];
    const scores=[proximity,tierScore,rankScore,confidence,localScore,tuitionScore,planScore,rankMatchScore,cityLevelScore];
    let total=0;
    for(let i=0;i<w.length;i++)total+=w[i]*scores[i];
    // 缩放至100分制
    total=Math.round(total*100);

    if(raw)return{
      total,
      details:{
        proximity:{score:Math.round(proximity*100),weight:30,label:'分差接近度',raw:w[0]*proximity},
        tier:{score:Math.round(tierScore*100),weight:22,label:'院校层次',extra:tierLabel,raw:w[1]*tierScore},
        rank:{score:Math.round(rankScore*100),weight:8,label:'软科排名',raw:w[2]*rankScore},
        confidence:{score:Math.round(confidence*100),weight:12,label:'数据可信度',raw:w[3]*confidence},
        local:{score:Math.round(localScore*100),weight:6,label:'地理位置',raw:w[4]*localScore},
        tuition:{score:Math.round(tuitionScore*100),weight:6,label:'学费合理度',raw:w[5]*tuitionScore},
        plan:{score:Math.round(planScore*100),weight:5,label:'招生计划数',raw:w[6]*planScore},
        rankMatch:{score:Math.round(rankMatchScore*100),weight:8,label:'位次匹配度',raw:w[7]*rankMatchScore},
        cityLevel:{score:Math.round(cityLevelScore*100),weight:3,label:'城市级别',raw:w[8]*cityLevelScore},
      }
    };
    return total;
  }
  const rec=[];
  const seen=new Set();
  function pickByTier(tierKey,maxCount){
    const pool=results.filter(r=>r.tier===tierKey&&!seen.has(r.schoolName));
    pool.sort((a,b)=>scoredScore(b)-scoredScore(a));
    for(const r of pool){
      if(rec.filter(x=>x.tier===tierKey).length>=maxCount)break;
      seen.add(r.schoolName);rec.push(r);
    }
  }
  pickByTier('reach',6);
  pickByTier('match',8);
  pickByTier('safety',6);
  // 不足20时从剩余补齐 (也按评分排序)
  const rest=[];
  for(const r of results){if(!seen.has(r.schoolName)){seen.add(r.schoolName);rest.push(r);}}
  rest.sort((a,b)=>scoredScore(b)-scoredScore(a));
  for(const r of rest){
    if(rec.length>=20)break;
    rec.push(r);
  }
  // 为每个结果附上评分详情（用于前端展示）
  for(const r of results){
    r.scoreDetail=scoredScore(r,true).details;
    r.recScore=scoredScore(r);
  }
  // 为推荐结果也附上
  for(const r of rec){
    if(!r.scoreDetail)r.scoreDetail=scoredScore(r,true).details;
    if(r.recScore===undefined)r.recScore=scoredScore(r);
  }
  return{results,stats,rec20:rec};
}
