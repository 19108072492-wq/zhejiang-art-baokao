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

// ===== 子门类定义 =====
// 音乐类细分：音乐教育（声乐主项/器乐主项）、音乐表演（声乐/器乐）
// 表导演类细分：戏剧影视表演、戏剧影视导演
const SUBCATS={
  music:[
    {k:'musEdu',l:'音乐教育',i:'📖',children:[
      {k:'musEduVocal',l:'声乐主项',i:'🎤'},
      {k:'musEduInstr',l:'器乐主项',i:'🎹'}
    ]},
    {k:'musPerf',l:'音乐表演',i:'🎼',children:[
      {k:'musPerfVocal',l:'声乐',i:'🎤'},
      {k:'musPerfInstr',l:'器乐',i:'🎻'}
    ]}
  ],
  acting:[
    {k:'actPerform',l:'戏剧影视表演',i:'🎬'},
    {k:'actDirect',l:'戏剧影视导演',i:'🎥'}
  ]
};

// 获取某门类的子门类列表（含children）
function getSubcats(catKey){return SUBCATS[catKey]||[];}

// 根据子门类 key 过滤记录
function filterBySubcat(records,subcatKey){
  if(!subcatKey||subcatKey==='all')return records;
  return records.filter(function(r){
    var sc=r.subCategory||'';
    var mn=(r.majorName||'').toLowerCase();
    switch(subcatKey){
      // 音乐教育
      case 'musEdu':
        return sc==='音教声乐'||sc==='音教器乐'||/音乐学.*师范|音乐教育/.test(r.majorName||'');
      case 'musEduVocal':
        return sc==='音教声乐'||/音乐学.*声乐.*师范|音乐学.*声乐主项|音乐教育.*声乐/.test(r.majorName||'');
      case 'musEduInstr':
        return sc==='音教器乐'||/音乐学.*器乐.*师范|音乐学.*钢琴主项|音乐学.*器乐方向|音乐教育.*器乐/.test(r.majorName||'');
      // 音乐表演
      case 'musPerf':
        return sc==='音表声乐'||sc==='音表器乐'||/音乐表演/.test(r.majorName||'');
      case 'musPerfVocal':
        return sc==='音表声乐'||/音乐表演.*声乐|音乐表演.*演唱|音乐表演.*美声|音乐表演.*民声|音乐表演.*合唱/.test(r.majorName||'');
      case 'musPerfInstr':
        return sc==='音表器乐'||/音乐表演.*器乐|音乐表演.*钢琴|音乐表演.*弦|音乐表演.*管|音乐表演.*二胡|音乐表演.*古筝|音乐表演.*低音|音乐表演.*小提琴|音乐表演.*大提琴|音乐表演.*中提琴/.test(r.majorName||'');
      // 表导演 - 戏剧影视表演
      case 'actPerform':
        return /戏剧影视表演|表演(?!.*导演)|表演艺术|音乐剧|表演.*影视|表演.*话剧|表演.*舞台|表演.*歌舞|表演.*时尚|表演.*服装|表演.*服饰|表演.*模特|时尚表演/.test(r.majorName||'');
      // 表导演 - 戏剧影视导演
      case 'actDirect':
        return /戏剧影视导演|导演/.test(r.majorName||'');
      default:return true;
    }
  });
}

function loadData(k){if(window.__D__&&window.__D__[k])return window.__D__[k];console.warn('[Core] 数据尚未加载: '+k+'，返回空数组');return[];}
function saveData(k,d){localStorage.setItem('zjyk_'+k,JSON.stringify(d));}
function clearData(k){localStorage.removeItem('zjyk_'+k);}
function totalCount(){let s=0;CATS.forEach(c=>s+=loadData(c.k).length);return s;}

// ===== 省份/城市筛选 =====
// 省份列表（含标签和emoji）
var PROVINCES=[
  {k:'zhejiang',l:'浙江省',i:'🏛️'},
  {k:'jiangsu',l:'江苏省',i:'🌸'},
  {k:'shanghai',l:'上海市',i:'🌃'},
  {k:'anhui',l:'安徽省',i:'🏔️'},
  {k:'fujian',l:'福建省',i:'🌴'},
  {k:'jiangxi',l:'江西省',i:'🍃'},
  {k:'shandong',l:'山东省',i:'⚓'},
  {k:'henan',l:'河南省',i:'🎪'},
  {k:'hubei',l:'湖北省',i:'🏯'},
  {k:'hunan',l:'湖南省',i:'🌶️'},
  {k:'guangdong',l:'广东省',i:'🍲'},
  {k:'guangxi',l:'广西壮族自治区',i:'🌺'},
  {k:'hainan',l:'海南省',i:'🏖️'},
  {k:'chongqing',l:'重庆市',i:'🌆'},
  {k:'sichuan',l:'四川省',i:'🐼'},
  {k:'guizhou',l:'贵州省',i:'⛰️'},
  {k:'yunnan',l:'云南省',i:'🌈'},
  {k:'beijing',l:'北京市',i:'🏤'},
  {k:'tianjin',l:'天津市',i:'🎡'},
  {k:'hebei',l:'河北省',i:'🌾'},
  {k:'shanxi',l:'山西省',i:'🏺'},
  {k:'shaanxi',l:'陕西省',i:'🏛️'},
  {k:'liaoning',l:'辽宁省',i:'🏭'},
  {k:'jilin',l:'吉林省',i:'❄️'},
  {k:'heilongjiang',l:'黑龙江省',i:'🌲'},
  {k:'neimenggu',l:'内蒙古自治区',i:'🏇'},
  {k:'xinjiang',l:'新疆维吾尔自治区',i:'🏜️'},
  {k:'ningxia',l:'宁夏回族自治区',i:'🕌'},
  {k:'gansu',l:'甘肃省',i:'🏜️'},
  {k:'qinghai',l:'青海省',i:'🏔️'},
  {k:'xizang',l:'西藏自治区',i:'🏔️'}
];

// 省份关键词 → 省份 key 映射
var PROVINCE_KEYWORDS={
  '浙江':'zhejiang','江苏':'jiangsu','上海':'shanghai','安徽':'anhui','福建':'fujian',
  '江西':'jiangxi','山东':'shandong','河南':'henan','湖北':'hubei','湖南':'hunan',
  '广东':'guangdong','广西':'guangxi','海南':'hainan','重庆':'chongqing','四川':'sichuan',
  '贵州':'guizhou','云南':'yunnan','北京':'beijing','天津':'tianjin','河北':'hebei',
  '山西':'shanxi','陕西':'shaanxi','辽宁':'liaoning','吉林':'jilin','黑龙江':'heilongjiang',
  '内蒙古':'neimenggu','新疆':'xinjiang','宁夏':'ningxia','甘肃':'gansu','青海':'qinghai',
  '西藏':'xizang'
};

// 根据省份key筛选记录
function filterByProvince(records,provinceKey){
  if(!provinceKey||provinceKey==='all')return records;
  // 找到省份关键词
  var keyword='';
  for(var kw in PROVINCE_KEYWORDS){
    if(PROVINCE_KEYWORDS[kw]===provinceKey){keyword=kw;break;}
  }
  if(!keyword)return records;
  return records.filter(function(r){
    var city=(r.city||'').toString();
    return city.indexOf(keyword)===0;
  });
}

// 根据城市名筛选记录
function filterByCity(records,cityName){
  if(!cityName||cityName==='all')return records;
  return records.filter(function(r){return (r.city||'').toString()===cityName;});
}

// 获取某省份下的所有城市（从记录中提取）
function getCitiesByProvince(records,provinceKey){
  var keyword='';
  for(var kw in PROVINCE_KEYWORDS){
    if(PROVINCE_KEYWORDS[kw]===provinceKey){keyword=kw;break;}
  }
  if(!keyword)return [];
  var citySet={};
  for(var i=0;i<records.length;i++){
    var city=(records[i].city||'').toString();
    if(city.indexOf(keyword)===0&&city.length>keyword.length){
      if(!citySet[city])citySet[city]=0;
      citySet[city]++;
    }
  }
  // 排序按记录数降序
  var arr=[];
  for(var c in citySet)arr.push({name:c,cnt:citySet[c]});
  arr.sort(function(a,b){return b.cnt-a.cnt;});
  return arr;
}

// ===== 合并数据源 =====
// 返回所有记录（内置 + localStorage），用于院校浏览、专业浏览、数据分析
function getAllRecords(){
  var cacheKey='zjyk_all_records_v2';
  var cached=sessionStorage.getItem(cacheKey);
  if(cached){try{return JSON.parse(cached);}catch(e){}}
  var all=[];
  for(var i=0;i<CATS.length;i++){
    var cat=CATS[i];
    var records=loadData(cat.k);
    for(var j=0;j<records.length;j++){
      var r=records[j];
      // 确保每条记录有 rawCategory 和 catKey
      r.catKey=r.catKey||cat.k;
      r.rawCategory=r.rawCategory||cat.l;
      // 过滤脏数据：schoolName 为纯数字/过短 或 compositeScore 异常低（< 50 且为预估分）
      if(/^\d+$/.test(String(r.schoolName||''))||(r.scoreSource==='estimated'&&typeof r.compositeScore==='number'&&r.compositeScore<50)){
        continue;
      }
      // 解析布尔标志
      if(r.schoolType&&!(r.isPublic!==undefined)){
        var st=r.schoolType||'';
        r.is985=/985/.test(st);r.is211=/211/.test(st);r.isDoubleFirst=/双一流/.test(st);
        r.isPublic=/公办/.test(st)&&!/民办/.test(st);r.isPrivate=/民办/.test(st)||/独立学院/.test(st);
      }
      all.push(r);
    }
  }
  try{sessionStorage.setItem(cacheKey,JSON.stringify(all));}catch(e){}
  return all;
}
// 清除缓存（数据更新后调用）
function clearAllRecordsCache(){sessionStorage.removeItem('zjyk_all_records_v2');}

// ===== 院校聚合 =====
// 将所有记录按 schoolCode 聚合
function aggregateBySchool(records){
  var map={};
  for(var i=0;i<records.length;i++){
    var r=records[i];
    var key=r.schoolCode||r.schoolName;
    if(!map[key]){
      map[key]={
        schoolCode:r.schoolCode,schoolName:r.schoolName,city:r.city||'',
        schoolType:r.schoolType||'',is985:r.is985,is211:r.is211,
        isDoubleFirst:r.isDoubleFirst,isPublic:r.isPublic,isPrivate:r.isPrivate,
        rankLevel:r.rankLevel||'',records:[],majorNames:{},categories:{}
      };
    }
    var school=map[key];
    school.records.push(r);
    school.majorNames[r.majorName||'']=true;
    if(r.catKey)school.categories[r.catKey]=true;
    // 用最新的/优先级最高的 city
    if(!school.city||school.city==='')school.city=r.city||'';
  }
  // 计算聚合统计
  var schools=[];
  var keys=Object.keys(map);
  for(var i=0;i<keys.length;i++){
    var s=map[keys[i]];
    var scores=[];
    for(var j=0;j<s.records.length;j++){
      var sc=s.records[j].compositeScore;
      if(typeof sc=='number'&&sc>0)scores.push(sc);
    }
    scores.sort(function(a,b){return a-b;});
    s.compositeMin=scores[0]||0;
    s.compositeMax=scores[scores.length-1]||0;
    s.compositeAvg=scores.length?Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length*100)/100:0;
    s.majorCount=Object.keys(s.majorNames).length;
    s.tuitionMin=999999;s.tuitionMax=0;
    for(var j=0;j<s.records.length;j++){
      var t=s.records[j].tuition;
      if(typeof t=='number'&&t>0){if(t<s.tuitionMin)s.tuitionMin=t;if(t>s.tuitionMax)s.tuitionMax=t;}
    }
    if(s.tuitionMin===999999){s.tuitionMin=0;s.tuitionMax=0;}
    schools.push(s);
  }
  return schools;
}

// ===== 专业聚合 =====
// 将所有记录按 majorName 聚合（可选指定门类）
function aggregateByMajor(records){
  var map={};
  for(var i=0;i<records.length;i++){
    var r=records[i];
    var key=(r.majorName||'').trim();
    if(!key)continue;
    if(!map[key]){
      map[key]={
        majorName:key,
        majorCode:r.majorCode||'',
        recordCount:0,
        schoolCount:0,
        schools:{},
        categories:{},
        scores:[],
        tuitions:[],
        records:[]
      };
    }
    var major=map[key];
    major.recordCount++;
    if(!major.schools[r.schoolName]){
      major.schools[r.schoolName]=true;
      major.schoolCount++;
    }
    if(r.catKey)major.categories[r.catKey]=true;
    if(typeof r.compositeScore=='number'&&r.compositeScore>0){
      major.scores.push(r.compositeScore);
    }
    if(typeof r.tuition=='number'&&r.tuition>0){
      major.tuitions.push(r.tuition);
    }
    major.records.push(r);
  }
  var majors=[];
  var keys=Object.keys(map);
  for(var i=0;i<keys.length;i++){
    var m=map[keys[i]];
    m.scores.sort(function(a,b){return a-b;});
    m.scoreMin=m.scores[0]||0;
    m.scoreMax=m.scores[m.scores.length-1]||0;
    m.scoreAvg=m.scores.length?Math.round((m.scores.reduce(function(a,b){return a+b;},0)/m.scores.length)*100)/100:0;
    m.tuitionAvg=m.tuitions.length?Math.round((m.tuitions.reduce(function(a,b){return a+b;},0)/m.tuitions.length)):0;
    // 按综合分降序排列 records
    m.records.sort(function(a,b){return (b.compositeScore||0)-(a.compositeScore||0);});
    majors.push(m);
  }
  // 按开设院校数降序
  majors.sort(function(a,b){return b.schoolCount-a.schoolCount;});
  return majors;
}

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
  // 推荐20校：冲6+稳8+保6，12维度严格评分，本专科分流
  // 本专科检测：识别高职/专科/职业技术类院校
  function isVocational(r){
    const name=(r.schoolName||'')+(r.majorName||'');
    return /职业|专科|高职|技术学院|职业技术学院|高等专科/.test(name);
  }
  // 艺术学院/美院检测：八大美院+六大艺术学院+其他艺术类院校
  function isArtAcademy(r){
    const n=(r.schoolName||'');
    return /美术学?院|艺术学?院|音乐学?院|舞蹈学?院|戏曲学?院|电影学?院|戏剧学?院|传媒学?院|中央美术|中国美术|天津美术|西安美术|四川美术|鲁迅美术|湖北美术|广州美术|南京艺术|广西艺术|云南艺术|山东艺术|吉林艺术|新疆艺术|北京电影|中央戏剧|中国戏曲|上海戏剧|北京舞蹈|浙江传媒/i.test(n);
  }

  function scoredScore(r,raw){
    // 1. 分差接近度 (weight: 25): 平方衰减
    const diffAbs=Math.abs(r.diff||0);
    const proximity=Math.pow(Math.max(0,1-diffAbs/50),2);

    // 2. 院校层次 (weight: 20): 8档细分
    let tierScore=0.05,tierLabel='民办';
    if(r.is985){tierScore=0.95;tierLabel='985';}
    else if(r.is211){tierScore=0.78;tierLabel='211';}
    else if(r.isDoubleFirst){tierScore=0.62;tierLabel='双一流';}
    else if(isArtAcademy(r)){
      // 艺术类院校单独加分档
      const name=r.schoolName||'';
      if(/中央美术|中国美术/.test(name)){tierScore=0.82;tierLabel='顶级美院';}
      else if(/八大美院|天津美术|西安美术|四川美术|鲁迅美术|湖北美术|广州美术|北京电影|中央戏剧|上海戏剧/.test(name)){tierScore=0.68;tierLabel='重点艺术院校';}
      else if(/南京艺术|广西艺术|云南艺术|山东艺术|吉林艺术|新疆艺术|浙江传媒/.test(name)){tierScore=0.55;tierLabel='省属艺术院校';}
      else{tierScore=0.45;tierLabel='艺术类院校';}
    }
    else if(r.isPublic){
      const rl=String(r.rankLevel||'');
      if(rl.includes('A+')||rl.includes('A ')||rl==='A'){tierScore=0.48;tierLabel='公办(A级)';}
      else if(rl.includes('B+')||rl.includes('B ')){tierScore=0.36;tierLabel='公办(B级)';}
      else{tierScore=0.24;tierLabel='公办(普通)';}
    }else{tierScore=0.12;tierLabel='民办/独立学院';}

    // 3. 软科排名 (weight: 6)
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

    // 4. 专业特色 (weight: 9): 国家级一流/省级一流/特色专业
    const note=(r.note||''),course=(r.courseGuide||''),talent=(r.talentGoal||'');
    let majorScore=0.10;
    if(/国家级/.test(note)||/国家级/.test(course)||/国家一流/.test(note))majorScore=0.95;
    else if(/省级/.test(note)||/省级一流/.test(note)||/省一流/.test(note))majorScore=0.75;
    else if(/特色/.test(note)||/卓越/.test(note)||/重点/.test(note))majorScore=0.52;
    else if(course.length>100||talent.length>80)majorScore=0.32; // 有详细课程/培养方案
    else majorScore=0.15;

    // 5. 培养模式 (weight: 6): 校企合作/实验班/中外合作等
    let cultivateScore=0.08;
    const fullText=(note+course+talent).toLowerCase();
    if(/校企合作|产教融合|订单培养|现代学徒|产业学院/.test(fullText))cultivateScore=0.88;
    else if(/实验班|卓越班|精英班|创新班|拔尖/.test(fullText))cultivateScore=0.72;
    else if(/工作室|导师制|项目制|工作坊/.test(fullText))cultivateScore=0.52;
    else if(/实习基地|实训|实践教学|实习/.test(fullText))cultivateScore=0.32;
    else cultivateScore=0.12;

    // 6. 专科学历 (weight: 4): 本/专科独立评分，本科得满分
    const isVoc=isVocational(r);
    let degreeScore=0;
    if(!isVoc)degreeScore=0.95; // 本科
    else{
      // 专科中再分档：公办专科>民办专科
      if(r.isPublic)degreeScore=0.42;
      else degreeScore=0.18;
    }

    // 7. 数据可信度 (weight: 10)
    const confidence=r.scoreSource==='estimated'?0.20:(r.rankPosition&&r.rankPosition>0?0.95:0.55);

    // 8. 地理位置 (weight: 4): 弱化
    const city=r.city||'';
    let localScore=0;
    if(city.includes('浙江'))localScore=0.55;
    else if(/上海|南京|苏州|无锡|常州|南通/.test(city))localScore=0.38;
    else if(/江苏|安徽|福建|江西/.test(city))localScore=0.20;
    else localScore=0.08;

    // 9. 学费合理度 (weight: 4): 压分
    const t=r.tuition||0;
    let tuitionScore=0;
    if(t<=6000)tuitionScore=0.95;
    else if(t<=12000)tuitionScore=0.75;
    else if(t<=20000)tuitionScore=0.52;
    else if(t<=35000)tuitionScore=0.30;
    else if(t<=60000)tuitionScore=0.15;
    else tuitionScore=0.05;

    // 10. 计划数 (weight: 3)
    const plan=(r.plan25||r.plan24||0);
    let planScore=0;
    if(plan>=30)planScore=0.85;
    else if(plan>=15)planScore=0.58;
    else if(plan>=8)planScore=0.32;
    else if(plan>=3)planScore=0.15;
    else planScore=0.05;

    // 11. 位次匹配度 (weight: 6)
    let rankMatchScore=0.20;
    if(r.rankPosition&&typeof r.rankPosition==='number'&&r.rankPosition>0){
      const rankGap=Math.abs(r.rankPosition-100);
      rankMatchScore=Math.pow(Math.max(0,1-rankGap/Math.max(r.rankPosition,1)),1.5);
    }

    // 12. 城市级别 (weight: 3)
    let cityLevelScore=0.08;
    if(/杭州|宁波/.test(city))cityLevelScore=0.82;
    else if(/上海|北京|广州|深圳/.test(city))cityLevelScore=0.68;
    else if(/南京|苏州|武汉|成都|重庆|天津|西安|长沙|青岛/.test(city))cityLevelScore=0.48;
    else if(/温州|绍兴|金华|嘉兴|台州|湖州/.test(city))cityLevelScore=0.35;
    else if(/福州|厦门|合肥|南昌|郑州|济南|无锡|常州/.test(city))cityLevelScore=0.22;
    else if(/浙江/.test(city))cityLevelScore=0.15;
    else cityLevelScore=0.10;

    // 13. 招生计划趋势 (weight: 2): plan25 vs plan24
    let planTrendScore=0.50;
    const p25=(r.plan25||0),p24=(r.plan24||0);
    if(p25>0&&p24>0){
      const ratio=p25/p24;
      if(ratio>=1.15)planTrendScore=0.75; // 扩招>15% → 竞争降低
      else if(ratio>=1.05)planTrendScore=0.60;
      else if(ratio>=0.95)planTrendScore=0.50; // 基本持平
      else if(ratio>=0.85)planTrendScore=0.35; // 缩招
      else planTrendScore=0.20; // 大幅缩招 → 竞争加剧
    }else if(p25>0&&p24===0){
      planTrendScore=0.65; // 新增招生计划
    }

    // 加权: 13维
    const w=[0.24,0.19,0.06,0.09,0.06,0.04,0.10,0.04,0.04,0.03,0.06,0.03,0.02];
    const scores=[proximity,tierScore,rankScore,majorScore,cultivateScore,degreeScore,confidence,localScore,tuitionScore,planScore,rankMatchScore,cityLevelScore,planTrendScore];
    let total=0;
    for(let i=0;i<w.length;i++)total+=w[i]*scores[i];
    total=Math.round(total*100);

    if(raw)return{
      total,
      details:{
        proximity:{score:Math.round(proximity*100),weight:24,label:'分差接近度',raw:w[0]*proximity},
        tier:{score:Math.round(tierScore*100),weight:19,label:'院校层次',extra:tierLabel,raw:w[1]*tierScore},
        rank:{score:Math.round(rankScore*100),weight:6,label:'软科排名',raw:w[2]*rankScore},
        major:{score:Math.round(majorScore*100),weight:9,label:'专业特色',raw:w[3]*majorScore},
        cultivate:{score:Math.round(cultivateScore*100),weight:6,label:'培养模式',raw:w[4]*cultivateScore},
        degree:{score:Math.round(degreeScore*100),weight:4,label:'学历层次',extra:isVoc?'专科':'本科',raw:w[5]*degreeScore},
        confidence:{score:Math.round(confidence*100),weight:10,label:'数据可信度',raw:w[6]*confidence},
        local:{score:Math.round(localScore*100),weight:4,label:'地理位置',raw:w[7]*localScore},
        tuition:{score:Math.round(tuitionScore*100),weight:4,label:'学费合理度',raw:w[8]*tuitionScore},
        plan:{score:Math.round(planScore*100),weight:3,label:'招生计划数',raw:w[9]*planScore},
        rankMatch:{score:Math.round(rankMatchScore*100),weight:6,label:'位次匹配度',raw:w[10]*rankMatchScore},
        cityLevel:{score:Math.round(cityLevelScore*100),weight:3,label:'城市级别',raw:w[11]*cityLevelScore},
        planTrend:{score:Math.round(planTrendScore*100),weight:2,label:'计划趋势',extra:p25>p24?'扩招':p25<p24?'缩招':'持平',raw:w[12]*planTrendScore},
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
