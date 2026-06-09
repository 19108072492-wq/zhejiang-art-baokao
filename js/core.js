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
  // 推荐20校：冲6+稳8+保6，多维度评分
  function scoredScore(r){
    // 分差接近度 (40%): 分差越小越好
    const diffAbs=Math.abs(r.diff||0);
    const proximity=1-Math.min(diffAbs/35,1);
    // 院校层次 (25%): 985>211>双一流>公办>民办
    let tier=0;
    if(r.is985)tier=1.0;else if(r.is211)tier=0.8;else if(r.isDoubleFirst)tier=0.6;else if(r.isPublic)tier=0.4;else tier=0.2;
    // 数据可信度 (15%)
    const confidence=r.scoreSource==='estimated'?0.3:1.0;
    // 浙江省内 (10%)
    const local=(r.city||'').includes('浙江')?1:0;
    // 学费合理度 (10%)
    const t=r.tuition||0;
    let tuition=0;if(t<=15000)tuition=1;else if(t<=30000)tuition=0.7;else if(t<=60000)tuition=0.4;else tuition=0.1;
    return proximity*0.4+tier*0.25+confidence*0.15+local*0.1+tuition*0.1;
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
  return{results,stats,rec20:rec};
}
