/**
 * 非凡教育 · 浙江艺考志愿助手 — UI 交互
 */
let cur=[],curTier='all',sel=new Map(),MAX_CMP=4,curSearch='',curSort='diff';

// ===== 付费用户检查 =====
function isPaidUser(){return typeof __isPaidUser!=='undefined'&&__isPaidUser;}

document.addEventListener('DOMContentLoaded',()=>{
  // 按钮绑定
  document.getElementById('btnGo').addEventListener('click',calc);
  // 子门类联动
  document.getElementById('cat').addEventListener('change',updateSubCatUI);
  document.getElementById('btnGear').addEventListener('click',()=>document.getElementById('lockModal').classList.remove('hidden'));
  document.getElementById('btnUnlock').addEventListener('click',()=>{
    if(document.getElementById('pwdInput').value==='ffjyyyds123456'){window.__adminAccess=true;document.getElementById('lockModal').classList.add('hidden');document.getElementById('adminModal').classList.remove('hidden');renderAdmin();showAdminSection('data');}
    else toast('密码错误',1);
  });
  document.getElementById('btnLockCancel').addEventListener('click',()=>document.getElementById('lockModal').classList.add('hidden'));
  document.getElementById('btnAdminClose').addEventListener('click',()=>document.getElementById('adminModal').classList.add('hidden'));
  document.getElementById('btnClearAll').addEventListener('click',()=>{if(confirm('确定清空全部数据？')){CATS.forEach(c=>clearData(c.k));renderAdmin();toast('已清空');}});
  document.getElementById('btnAddNew').addEventListener('click',addNewRecord);
  document.getElementById('btnSaveEdit').addEventListener('click',()=>{
    if(__editingIdx===-1)saveNewRecord();else saveEditedRecord();
  });
  document.getElementById('btnCancelEdit').addEventListener('click',()=>{
    document.getElementById('editPanel').classList.remove('on');
    __editingIdx=null;
  });
  document.getElementById('adminSearch').addEventListener('input',function(){
    __adminSearch=this.value.trim().toLowerCase();__adminPage=0;renderAdminDetail();
  });
  document.getElementById('btnForm').addEventListener('click',openForm);
  document.getElementById('btnCmp').addEventListener('click',openCmp);
  document.getElementById('btnClr').addEventListener('click',()=>{sel.clear();updateFloat();renderCards();});
  document.getElementById('btnFormClose').addEventListener('click',()=>document.getElementById('formModal').classList.add('hidden'));
  document.getElementById('btnCmpClose').addEventListener('click',()=>document.getElementById('cmpModal').classList.add('hidden'));
  document.getElementById('btnPrint').addEventListener('click',()=>{
    const w=window.open('','_blank');
    const formHtml=document.getElementById('formBody').innerHTML;
    const printCss=`
      *{box-sizing:border-box}
      body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;padding:12mm 10mm;color:#1a1a1a;max-width:210mm;margin:0 auto;font-size:10pt;line-height:1.6}
      h1{font-size:15pt;color:#b08543;text-align:center;margin:0 0 4px 0;font-weight:800;letter-spacing:.04em}
      .sub{text-align:center;color:#888;font-size:9pt;margin-bottom:14px}
      .vsec{margin-bottom:14px;page-break-inside:avoid}
      .vsec h3{font-size:11pt;margin:6px 0 4px 0;padding:3px 10px;border-radius:6px;display:inline-block;color:#fff}
      .vsec table{width:100%;border-collapse:collapse;font-size:9pt;margin-top:4px}
      .vsec th{padding:5px 6px;background:#f5f0eb!important;color:#444;font-weight:700;border:1px solid #d8cfc2;text-align:center}
      .vsec td{padding:4px 6px;border:1px solid #e8e8e8;text-align:center}
      .vsec tr:nth-child(even) td{background:#fafafa}
      .reach h3{background:#c0392b}
      .match h3{background:#c07830}
      .safety h3{background:#2d7a4a}
      @page{margin:0;size:A4}
      @media print{button{display:none!important}}
    `;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>艺考志愿单</title><style>${printCss}</style></head><body><h1>🎓 非凡教育 · 浙江艺考志愿填报参考单</h1><p class="sub">${new Date().toLocaleString('zh-CN')} | 科学匹配 · 精准冲稳保</p>${formHtml}</body><script>setTimeout(function(){window.print();setTimeout(window.close,500);},300)<\/script></html>`);
    w.document.close();
  });
  ['lockModal','adminModal','formModal','cmpModal','majorDetailModal'].forEach(id=>document.getElementById(id).addEventListener('click',function(e){if(e.target===this)this.classList.add('hidden');}));
  document.querySelectorAll('#filters button').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('#filters button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');curTier=b.dataset.t;renderCards();
  }));
  document.getElementById('searchInput').addEventListener('input',function(){
    curSearch=this.value.trim().toLowerCase();
    document.getElementById('btnClearSearch').style.display=curSearch?'':'none';
    renderCards();
  });
  document.getElementById('btnClearSearch').addEventListener('click',()=>{
    document.getElementById('searchInput').value='';curSearch='';
    document.getElementById('btnClearSearch').style.display='none';
    renderCards();
  });
  document.getElementById('sortSelect').addEventListener('change',function(){
    curSort=this.value;renderCards();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!['adminModal','lockModal'].some(id=>!document.getElementById(id).classList.contains('hidden')))calc();});
  renderAdmin();
});

// ===== 结果区省份/城市筛选 =====
var __resultProvince='all',__resultCity='all';
var __resultFilterInited=false; // 防止重复绑定事件

function initResultProvinceSelect(){
  var sel=document.getElementById('resultProvince');
  if(!sel)return;
  var html='<option value="all">不限省份</option>';
  for(var i=0;i<PROVINCES.length;i++){
    var p=PROVINCES[i];
    html+='<option value="'+p.k+'">'+p.i+' '+p.l+'</option>';
  }
  sel.innerHTML=html;
  // 只绑定一次事件
  if(!__resultFilterInited){
    __resultFilterInited=true;
    sel.addEventListener('change',function(){
      __resultProvince=this.value;
      __resultCity='all';
      updateResultCitySelect();
      renderCards();
      updateRecBtnText();
    });
    document.getElementById('resultCity').addEventListener('change',function(){
      __resultCity=this.value;
      renderCards();
      updateRecBtnText();
    });
  }
  // 重置选中值
  sel.value='all';
  document.getElementById('resultCity').style.display='none';
  document.getElementById('resultCity').innerHTML='<option value="all">不限城市</option>';
}

function updateResultCitySelect(){
  var citySel=document.getElementById('resultCity');
  if(!citySel)return;
  if(__resultProvince==='all'){
    citySel.style.display='none';
    citySel.innerHTML='<option value="all">不限城市</option>';
    return;
  }
  // 从当前门类的完整数据池中提取该省份的城市（而非仅匹配结果）
  var catKey=document.getElementById('cat').value;
  var pool=catKey?loadData(catKey):[];
  var cities=getCitiesByProvince(pool,__resultProvince);
  if(!cities.length){
    citySel.style.display='none';
    return;
  }
  citySel.style.display='';
  var html='<option value="all">不限城市（'+cities.length+'个）</option>';
  for(var i=0;i<cities.length;i++){
    html+='<option value="'+escAttr(cities[i].name)+'">'+cities[i].name.replace(/^(浙江|江苏|上海|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|重庆|四川|贵州|云南|北京|天津|河北|山西|陕西|辽宁|吉林|黑龙江|内蒙古|新疆|宁夏|甘肃|青海|西藏)/,'')+' ('+cities[i].cnt+')</option>';
  }
  citySel.innerHTML=html;
}

function updateRecBtnText(){
  var recBtn=document.getElementById('btnRec');
  if(!recBtn)return;
  if(__resultProvince&&__resultProvince!=='all'){
    var pLabel='';
    for(var i=0;i<PROVINCES.length;i++){if(PROVINCES[i].k===__resultProvince){pLabel=PROVINCES[i].l;break;}}
    recBtn.textContent='🤖 一键推荐（📍'+pLabel+'范围内）';
  }else{
    recBtn.textContent='🤖 一键推荐20校';
  }
}

// ===== 子门类联动 =====
function updateSubCatUI(){
  var catKey=document.getElementById('cat').value;
  var subCatCol=document.getElementById('subCatCol');
  var subCatSel=document.getElementById('subCat');
  var subcats=getSubcats(catKey);
  if(subcats.length){
    subCatCol.classList.remove('hidden');
    var html='<option value="all">全部</option>';
    for(var i=0;i<subcats.length;i++){
      var sc=subcats[i];
      html+='<option value="'+sc.k+'">'+sc.i+' '+sc.l+'</option>';
      if(sc.children){
        for(var j=0;j<sc.children.length;j++){
          var ch=sc.children[j];
          html+='<option value="'+ch.k+'">&nbsp;&nbsp;└ '+ch.i+' '+ch.l+'</option>';
        }
      }
    }
    subCatSel.innerHTML=html;
  }else{
    subCatCol.classList.add('hidden');
    subCatSel.innerHTML='<option value="all">全部</option>';
  }
}

// 获取子门类标签
function getSubcatLabel(catKey,subcatKey){
  if(!subcatKey||subcatKey==='all')return '';
  var subcats=getSubcats(catKey);
  for(var i=0;i<subcats.length;i++){
    if(subcats[i].k===subcatKey)return subcats[i].l;
    if(subcats[i].children){
      for(var j=0;j<subcats[i].children.length;j++){
        if(subcats[i].children[j].k===subcatKey)return subcats[i].l+' - '+subcats[i].children[j].l;
      }
    }
  }
  return '';
}

function calc(){
  // 检查是否已登录（未登录提示登录）
  if(!__isLoggedIn){
    toast('请先登录后使用智能填报功能',1);
    document.getElementById('authModal').classList.remove('hidden');
    var phoneInput=document.getElementById('authPhone');
    if(phoneInput)phoneInput.focus();
    return;
  }

  const c=parseFloat(document.getElementById('culture').value);
  const a=parseFloat(document.getElementById('art').value);
  const k=document.getElementById('cat').value;
  const errs=[];
  if(isNaN(c)||c<0||c>750)errs.push('请输入有效文化课成绩');
  if(isNaN(a)||a<0)errs.push('请输入有效统考成绩');
  if(!k)errs.push('请选择艺术门类');
  const pool=loadData(k);
  if(!pool.length)errs.push('暂无数据，请刷新页面');
  if(errs.length){toast(errs.join('\n'),1);return;}

  // 子门类筛选
  const subCatKey=document.getElementById('subCat').value;
  var filteredPool=filterBySubcat(pool,subCatKey);

  const res=calcScore(c,a,k==='calligraphy'?'finearts':k);
  const sb=document.getElementById('scoreBox');
  sb.classList.remove('hidden');
  const minC=CULTURE_MIN[k]||369,canB=c>=minC;
  // 子门类提示
  var subLabel='';
  if(subCatKey&&subCatKey!=='all'){
    var allSubs=getSubcats(k);
    var foundSub=null;
    for(var si=0;si<allSubs.length;si++){
      if(allSubs[si].k===subCatKey){foundSub=allSubs[si];break;}
      if(allSubs[si].children){
        for(var sj=0;sj<allSubs[si].children.length;sj++){
          if(allSubs[si].children[sj].k===subCatKey){foundSub=allSubs[si].children[sj];break;}
        }
        if(foundSub)break;
      }
    }
    if(foundSub)subLabel=' <span style="font-size:.78rem;color:var(--color-accent)">（'+foundSub.i+' '+foundSub.l+'）</span>';
  }
  var filterInfo='';
  if(subLabel)filterInfo='<div style="font-size:.75rem;color:var(--color-text-secondary);margin-top:4px">筛选条件：'+subLabel+' | 共 '+filteredPool.length+' 条数据</div>';
  sb.innerHTML=`<div class="sbox"><span class="lbl">你的综合分${subLabel}</span><span class="val">${res.score.toFixed(2)}</span><span class="frm">${res.text}</span></div>${filterInfo}<div class="snote ${canB?'ok':'warn'}">${canB?`✅ 文化分 ${c} ≥ ${minC}，已展示本科及专科结果`:`⚠️ 文化分 ${c} < ${minC}，仅展示专科及低分段结果`}</div>`;

  // 算法说明面板（完整版才展示）
  var algoCardEl=document.getElementById('algoCard');
  if(isPaidUser()){
    algoCardEl.classList.remove('hidden');
    document.getElementById('algoBody').innerHTML=[
      {icon:'🎯',name:'分差接近度',wt:24,desc:'综合分越接近往年录取分越推荐（平方衰减）'},
      {icon:'🏛️',name:'院校层次',wt:19,desc:'985/211/双一流/艺术院校/公办/民办 9档'},
      {icon:'📊',name:'软科排名',wt:6,desc:'A+→C- 7级评分，反映学术实力'},
      {icon:'🎨',name:'专业特色',wt:9,desc:'国家级/省级一流/特色专业→有培养方案→普通'},
      {icon:'🔧',name:'培养模式',wt:6,desc:'校企合作/实验班/导师制/实训基地分级加分'},
      {icon:'🎓',name:'学历层次',wt:4,desc:'本科满分/公办专科42/民办专科18，独立评分'},
      {icon:'📋',name:'数据可信度',wt:10,desc:'有历史位次满分/无位次降权/预估分最低'},
      {icon:'📍',name:'地理位置',wt:4,desc:'弱化权重，浙江>长三角>华东>其他'},
      {icon:'💰',name:'学费合理度',wt:4,desc:'≤6000满分→1.2万/2万/3.5万/6万分段'},
      {icon:'📋',name:'招生计划数',wt:3,desc:'计划多→竞争分散，30+得高分'},
      {icon:'🏅',name:'位次匹配度',wt:6,desc:'位次差距越小越好，连续评分'},
      {icon:'🏙️',name:'城市级别',wt:3,desc:'杭州/宁波→新一线→二线→三线递减'},
      {icon:'📈',name:'计划趋势',wt:2,desc:'对比24/25届计划数，扩招加分缩招降分'},
    ].map(d=>`<div class="algo-dim"><span class="dim-lbl">${d.icon} ${d.name}</span><div class="dim-bar"><div class="dim-fill" style="width:${d.wt/0.25*100}%"></div></div><span class="dim-val">${d.wt}%</span><span class="dim-desc">${d.desc}</span></div>`).join('')+`<div class="algo-total">📊 13维度严格评分 · 艺术院校独立加分 · 本专科分流 · 专业特色+培养模式加持</div>`;
  }else{
    algoCardEl.classList.add('hidden');
  }

  // 梯度说明卡片（完整版才展示）
  const tierExplain=document.getElementById('tierExplain');
  if(isPaidUser()){
    tierExplain.classList.remove('hidden');
    tierExplain.innerHTML=`<h4>📌 冲·稳·保 梯度说明</h4>
      <div class="tier-row"><div class="tr-icon">🔴</div><div class="tr-body"><strong>冲刺志愿</strong><span>你的综合分低于该校往年录取分 → 需要一定运气，适合"梦想院校"</span></div></div>
      <div class="tier-row"><div class="tr-icon">🟡</div><div class="tr-body"><strong>稳妥志愿</strong><span>你的综合分高于该校0~15分 → 录取概率较高，重点填报的核心区域</span></div></div>
      <div class="tier-row"><div class="tr-icon">🟢</div><div class="tr-body"><strong>保底志愿</strong><span>你的综合分高于该校15~35分 → 高概率录取，确保有学上</span></div></div>
      <div class="tier-row"><div class="tr-icon">⚠️</div><div class="tr-body"><strong>预估分说明</strong><span>标注"预估"的院校为新招专业或无往年数据，系统自动降一档处理（稳妥→冲刺，保底→稳妥）</span></div></div>`;
  }else{
    tierExplain.classList.add('hidden');
  }

  // 数据来源卡片（完整版才展示）
  var dsc=document.getElementById('dataSourceCard');
  if(isPaidUser())dsc.classList.remove('hidden');
  else dsc.classList.add('hidden');

  const m=matchSchools(res.score,k,c,filteredPool);
  cur=m.results;window.__rec=m.rec20;

  // ★ 版本权限：体验版（已登录未付费）= 全量院校 + 精简卡片；完整版（付费）= 完整信息
  // cur 全量保留，卡片渲染时按 isPaidUser() 决定展示字段
  var freeBanner=document.getElementById('freeLimitBanner');
  if(!isPaidUser()&&freeBanner)freeBanner.classList.remove('hidden');
  else if(freeBanner)freeBanner.classList.add('hidden');

  sel.clear();updateFloat();curTier='all';
  curSearch='';curSort='diff';
  document.getElementById('searchInput').value='';
  document.getElementById('btnClearSearch').style.display='none';
  document.getElementById('sortSelect').value='diff';
  document.querySelectorAll('#filters button').forEach(b=>{b.classList.remove('on');if(b.dataset.t==='all')b.classList.add('on');});
  document.getElementById('resultBox').classList.remove('hidden');
  document.getElementById('searchBar').classList.remove('hidden');
  document.getElementById('list').innerHTML='';
  // 重置结果区省份筛选
  __resultProvince='all';__resultCity='all';
  initResultProvinceSelect();
  const rc=m.results.filter(x=>x.tier==='reach').length;
  const mt=m.results.filter(x=>x.tier==='match').length;
  const sf=m.results.filter(x=>x.tier==='safety').length;
  document.getElementById('summary').innerHTML=`共 <strong>${m.results.length}</strong> 条 · 🔴${rc} 🟡${mt} 🟢${sf}`;
  document.getElementById('summaryActions').innerHTML=`<button class="btn btn-g btn-sm" id="btnRec">🤖 一键推荐20校</button>`;
  renderCards();
  document.getElementById('resultBox').scrollIntoView({behavior:'smooth'});
  setTimeout(()=>{const br=document.getElementById('btnRec');if(br)br.addEventListener('click',()=>{
    sel.clear();
    // 根据当前省份筛选结果来推荐
    var recList=window.__rec||[];
    if(__resultProvince&&__resultProvince!=='all'){
      recList=recList.filter(r=>{
        var match=filterByProvince([r],__resultProvince);
        return match.length>0;
      });
      if(__resultCity&&__resultCity!=='all'){
        recList=recList.filter(r=>{
          var match=filterByCity([r],__resultCity);
          return match.length>0;
        });
      }
    }
    if(!recList.length){toast('当前省份范围内无推荐院校，请扩大筛选范围');return;}
    recList.forEach(r=>sel.set(`${r.schoolCode}|${r.majorCode}`,r));
    updateFloat();renderCards();toast('已勾选'+recList.length+'所推荐学校');document.getElementById('floatBar').scrollIntoView({behavior:'smooth'});
  });},150);
}

function renderCards(){
  const container=document.getElementById('list');
  let data=[...cur];
  if(curTier!=='all')data=data.filter(r=>r.tier===curTier);
  if(curSearch)data=data.filter(r=>{const n=(r.schoolName||'').toLowerCase(),m=(r.majorName||'').toLowerCase();return n.includes(curSearch)||m.includes(curSearch);});
  // 省份/城市筛选
  if(__resultProvince&&__resultProvince!=='all')data=filterByProvince(data,__resultProvince);
  if(__resultCity&&__resultCity!=='all')data=filterByCity(data,__resultCity);
  // 排序
  const sortMap={
    diff:(a,b)=>Math.abs(a.diff||0)-Math.abs(b.diff||0),
    nameAsc:(a,b)=>(a.schoolName||'').localeCompare(b.schoolName||'','zh'),
    nameDesc:(a,b)=>(b.schoolName||'').localeCompare(a.schoolName||'','zh'),
    scoreDesc:(a,b)=>(b.compositeScore||0)-(a.compositeScore||0),
    scoreAsc:(a,b)=>(a.compositeScore||0)-(b.compositeScore||0),
    tuitionAsc:(a,b)=>(a.tuition||0)-(b.tuition||0),
    tuitionDesc:(a,b)=>(b.tuition||0)-(a.tuition||0),
    cityAsc:(a,b)=>(a.city||'').localeCompare(b.city||'','zh'),
  };
  if(sortMap[curSort])data.sort(sortMap[curSort]);
  // 更新summary显示省份筛选信息
  var summaryEl=document.getElementById('summary');
  if(summaryEl&&cur.length){
    // 如果有省份筛选，显示筛选后的统计
    if(__resultProvince&&__resultProvince!=='all'){
      var fR=data.filter(x=>x.tier==='reach').length;
      var fM=data.filter(x=>x.tier==='match').length;
      var fS=data.filter(x=>x.tier==='safety').length;
      var pName='';
      for(var pp=0;pp<PROVINCES.length;pp++){if(PROVINCES[pp].k===__resultProvince){pName=PROVINCES[pp].l;break;}}
      summaryEl.innerHTML='📍'+pName+' 共 <strong>'+data.length+'</strong> 条 · 🔴'+fR+' 🟡'+fM+' 🟢'+fS;
    }else{
      var src=cur,srcR=src.filter(x=>x.tier==='reach').length,srcM=src.filter(x=>x.tier==='match').length,srcS=src.filter(x=>x.tier==='safety').length;
      summaryEl.innerHTML='共 <strong>'+src.length+'</strong> 条 · 🔴'+srcR+' 🟡'+srcM+' 🟢'+srcS;
    }
  }
  if(!data.length){container.innerHTML='<p style="text-align:center;color:#8c8c8c;padding:40px 0">'+(!cur.length?'暂无匹配结果':((__resultProvince&&__resultProvince!=='all')?'该省份暂无匹配结果，请更换筛选条件':'该梯度暂无结果'))+'</p>';return;}
  const tm={reach:{l:'🔴 冲刺',c:'reach'},match:{l:'🟡 稳妥',c:'match'},safety:{l:'🟢 保底',c:'safety'}};
  container.innerHTML=data.map((r,i)=>{
    const m=tm[r.tier]||{l:'?',c:''},key=`${r.schoolCode}|${r.majorCode}`,ck=sel.has(key);
    const d=Math.abs(r.diff||0).toFixed(1),dt=(r.diff||0)>0?`你高 ${d} 分`:`你低 ${d} 分`;
    const tags=[];
    if(r.is985)tags.push('<span class="tag tag-985">985</span>');
    if(r.is211)tags.push('<span class="tag tag-211">211</span>');
    if(r.isDoubleFirst)tags.push('<span class="tag tag-df">双一流</span>');
    if(r.isPrivate)tags.push('<span class="tag tag-pv">民办</span>');
    if(r.scoreSource==='estimated')tags.push('<span class="tag tag-est">预估</span>');
    if(r.rankLevel){const rl=String(r.rankLevel);const lv=rl.includes('A+')?'🥇':rl.includes('A')?'🥈':rl.includes('B+')?'🥉':'';tags.push(`<span class="tag tag-985" style="background:#f0fdf4;color:#166534">${lv} ${esc(rl)}</span>`);}
    // 艺术院校标签
    if(isArtAcademy(r))tags.push('<span class="tag tag-df" style="background:#fef3c7;color:#92400e">🎨艺术</span>');
    // 评分详情条
    let scoreDetailHTML='';
    if(r.scoreDetail){
      const sd=r.scoreDetail;
      const dims=[
        {k:'proximity',icon:'🎯',color:'var(--g)'},
        {k:'tier',icon:'🏛️',color:'#3b82f6'},
        {k:'rank',icon:'📊',color:'#8b5cf6'},
        {k:'major',icon:'🎨',color:'#f97316'},
        {k:'cultivate',icon:'🔧',color:'#14b8a6'},
        {k:'degree',icon:'🎓',color:'#3b82f6'},
        {k:'confidence',icon:'📋',color:'#06b6d4'},
        {k:'local',icon:'📍',color:'#f59e0b'},
        {k:'tuition',icon:'💰',color:'#10b981'},
        {k:'plan',icon:'📋',color:'#ef4444'},
        {k:'rankMatch',icon:'🏅',color:'#ec4899'},
        {k:'cityLevel',icon:'🏙️',color:'#6366f1'},
        {k:'planTrend',icon:'📈',color:'#84cc16'},
      ];
      const dimHtmls=dims.map(d=>{
        const v=sd[d.k];const sc=v.score||0;
        const lbl=v.label||'';const shortLbl=lbl.length>4?lbl.slice(0,3):lbl;
        return`<div class="sb-row"><span class="sbl" title="${v.label}(${v.weight}%)">${d.icon}${shortLbl}</span><div class="sbb"><div class="sbf" style="width:${Math.min(sc,100)}%;background:${d.color}"></div></div><span class="sbv">${sc}</span></div>`;
      });
      scoreDetailHTML=`<div class="score-breakdown"><div class="sb-title">📊 推荐评分 <span style="font-weight:400;color:var(--g);font-size:.8rem">${r.recScore||0}分</span></div>${dimHtmls.join('')}</div>`;
    }
    // 子门类标签
    var subCatTag='';
    if(r.subCategory){
      var scMap={'音教声乐':'🎤 声乐主项','音教器乐':'🎹 器乐主项','音表声乐':'🎤 声乐','音表器乐':'🎻 器乐'};
      if(scMap[r.subCategory])subCatTag=' <span style="font-size:.68rem;padding:1px 5px;border-radius:8px;background:var(--color-surface-secondary);color:var(--color-accent)">'+scMap[r.subCategory]+'</span>';
    }
	    var _normMjName=normMajorName(r.majorName);
	    var majorDetailLink=isPaidUser()?`<span style="cursor:pointer;text-decoration:underline dotted;color:var(--color-accent);font-size:inherit" onclick="openMajorDetail(('${escAttr(_normMjName)}'))">${esc(_normMjName)}</span>`:`${esc(_normMjName)}`;
	    // ★ 体验版：精简一行卡片；完整版：完整详情卡片
	    if(!isPaidUser()){
	      // 方案A：梯度标签 + 院校名 · 专业 · 往年录取分 xxx · 你高/低 xx 分
	      var tierBadge=m.c==='reach'?'<span class="tag tag-tier tag-tier-reach">🔴 冲刺</span>':m.c==='match'?'<span class="tag tag-tier tag-tier-match">🟡 稳妥</span>':'<span class="tag tag-tier tag-tier-safety">🟢 保底</span>';
	      var rankTags='';
	      if(r.is985)rankTags+='<span class="tag tag-985">985</span>';
	      if(r.is211)rankTags+='<span class="tag tag-211">211</span>';
	      if(r.isDoubleFirst)rankTags+='<span class="tag tag-df">双一流</span>';
	      if(r.isPrivate)rankTags+='<span class="tag tag-pv">民办</span>';
	      if(r.scoreSource==='estimated')rankTags+='<span class="tag tag-est">预估</span>';
	      var diffVal=r.diff||0;
	      var diffHtml=diffVal>=0
	        ?`<span class="sc-lite-diff higher">↑ 高 ${Math.abs(diffVal).toFixed(1)} 分</span>`
	        :`<span class="sc-lite-diff lower">↓ 低 ${Math.abs(diffVal).toFixed(1)} 分</span>`;
	      var estHtml=r.scoreSource==='estimated'?'<span style="color:#c0392b;font-size:.72rem">预估</span>':'';
	      return `<div class="sc ${m.c} sc-lite${ck?' sel':''}" data-key="${key}" data-idx="${i}"><div class="cb" data-act="sel"><div class="cb-box${ck?' on':''}">${ck?'✓':''}</div></div><div class="sc-lite-body"><div class="sc-lite-row">${tierBadge} <strong>${esc(r.schoolName)}</strong>${rankTags?'<span style="margin-left:4px;display:inline-flex;gap:2px;flex-shrink:0">'+rankTags+'</span>':''}</div><div class="sc-lite-major">${esc(normMajorName(r.majorName))}</div><div class="sc-lite-meta"><span>往年录取分 <span class="sc-lite-score">${r.compositeScore}</span></span>${diffHtml}${estHtml}</div></div></div>`;
	    }
	    return `<div class="sc ${m.c}${ck?' sel':''}" data-key="${key}" data-idx="${i}"><div class="cb" data-act="sel"><div class="cb-box${ck?' on':''}">${ck?'✓':''}</div></div><div class="sinfo"><div class="sname">${esc(r.schoolName)} <span style="font-weight:400;font-size:.75rem">${tags.join(' ')}</span></div><div class="smaj">${majorDetailLink}${subCatTag} <span style="font-size:.72rem;color:#8c8c8c">${r.majorCode||''}</span></div><div class="smeta"><span>📍 ${esc(r.city||'')}</span><span>💰 ${typeof r.tuition=='number'?r.tuition.toLocaleString()+'/年':(r.tuition||'--')}</span><span>🏠 ${esc(r.dorm||'')||'--'}</span>${r.plan25?`<span>📋 ${r.plan25}人</span>`:r.plan24?`<span>📋 ${r.plan24}人</span>`:''}${r.rankPosition?`<span>📊 位次${r.rankPosition}</span>`:''}</div>${r.scoreLineReq?`<div style="margin-top:4px;font-size:.74rem;color:#9a6b2a;background:#faf6f0;padding:3px 8px;border-radius:4px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📋 ${esc(r.scoreLineReq)}</div>`:''}<div class="sdet">${r.note?`<p>📝 ${esc(r.note)}</p>`:''}${r.courseGuide?`<p>📚 ${esc(r.courseGuide)}</p>`:''}${r.talentGoal?`<p>🎯 ${esc(r.talentGoal)}</p>`:''}${r.scoreSource==='estimated'?'<p style="color:#c0392b">⚠️ 预估分，请谨慎参考</p>':''}${isPaidUser()?scoreDetailHTML:''}</div></div><div class="sstat"><span class="sn">${r.compositeScore}</span><span class="ss">往年录取分</span><span class="ss">${dt}</span>${r.scoreSource==='estimated'?'<span class="ss" style="color:#c0392b">预估</span>':''}</div></div>`;
  }).join('');
  container.onclick=function(e){
    const selEl=e.target.closest('[data-act="sel"]');
    if(selEl){e.stopPropagation();const card=selEl.closest('.sc'),key=card.dataset.key;
      // 用 key 查找（修复索引错位 Bug）
      const r=cur.find(function(x){return x.schoolCode+'|'+x.majorCode===key;});
      if(r){if(sel.has(key))sel.delete(key);else sel.set(key,r);}updateFloat();renderCards();return;}
    const card=e.target.closest('.sc');
    // 未授权用户不能展开卡片详情
    if(card && !isPaidUser())return;
    if(card)card.classList.toggle('exp');
  };
}

function updateFloat(){
  const n=sel.size;
  document.getElementById('floatCnt').textContent=n;
  document.getElementById('btnForm').disabled=n===0;
  document.getElementById('btnCmp').disabled=n<2;
  document.getElementById('cmpCnt').textContent=Math.min(n,MAX_CMP);
  document.getElementById('floatBar').classList.toggle('on',n>0);
  // 悬浮按钮同步
  var fab=document.getElementById('fabContainer');
  var badge=document.getElementById('fabBadge');
  var btnForm=document.getElementById('fabForm');var btnCmp=document.getElementById('fabCmp');
  var btnClear2=document.getElementById('fabClear');
  badge.textContent=n;
  badge.classList.toggle('hidden',n===0);
  if(btnForm){btnForm.disabled=n===0;btnForm.style.opacity=n===0?'.4':'1';}
  if(btnCmp){btnCmp.disabled=n<2;btnCmp.style.opacity=n<2?'.4':'1';}
  if(btnClear2){btnClear2.disabled=n===0;btnClear2.style.opacity=n===0?'.4':'1';}
  // 配置 fab 菜单项颜色为独立的样式，通过 disabled class 控制
  if(fab){} // keep fab container state
}

// ===== 初始化悬浮操作按钮 =====
(function initFab(){
  // 等 DOM 就绪
  function bindFab(){
    var main=document.getElementById('fabMain');
    var menu=document.getElementById('fabMenu');
    var container=document.getElementById('fabContainer');
    if(!main||!menu||!container)return;
    var isOpen=false;
    main.addEventListener('click',function(){
      isOpen=!isOpen;
      main.classList.toggle('open',isOpen);
      menu.classList.toggle('on',isOpen);
    });
    // 菜单项点击后关闭
    var fabForm=document.getElementById('fabForm');
    var fabCmp=document.getElementById('fabCmp');
    var fabExport=null; // 已移除导出Excel功能
    var fabClear=document.getElementById('fabClear');
    function closeFab(){isOpen=false;main.classList.remove('open');menu.classList.remove('on');}
    if(fabForm)fabForm.addEventListener('click',function(){closeFab();if(sel.size>0)openForm();else toast('请先勾选学校',1);});
    if(fabCmp)fabCmp.addEventListener('click',function(){closeFab();if(sel.size>=2)openCmp();else toast('至少选2所学校',1);});
    if(fabClear)fabClear.addEventListener('click',function(){closeFab();sel.clear();updateFloat();__schoolSel.clear();renderSchoolBrowser();renderCards();toast('已清空');});
    // 点击空白处关闭菜单
    document.addEventListener('click',function(e){
      if(isOpen && !container.contains(e.target)){closeFab();}
    });
  }
  if(document.readyState!=='loading')bindFab();
  else document.addEventListener('DOMContentLoaded',bindFab,{once:true});
})();

function openForm(){
  if(!isPaidUser())return showUpgradeModal('form');
  if(!sel.size)return toast('请先勾选学校',1);
  // 用 __formOrder 维护自定义排序（持久化在 sel 的插入顺序）
  if(!window.__formOrder)window.__formOrder=[];
  // 同步：根据 sel 重建 __formOrder
  var selKeys=[...sel.keys()];
  var oldOrder=window.__formOrder||[];
  var newOrder=[];
  // 保留旧顺序中仍在 sel 里的 key
  for(var i=0;i<oldOrder.length;i++){if(sel.has(oldOrder[i]))newOrder.push(oldOrder[i]);}
  // 添加新勾选的 key（追加到末尾）
  for(var i=0;i<selKeys.length;i++){if(newOrder.indexOf(selKeys[i])<0)newOrder.push(selKeys[i]);}
  window.__formOrder=newOrder;

  const groups={reach:[],match:[],safety:[]};
  for(const r of sel.values()){
    var t=r.tier||'match';
    if(t==='out')t='safety'; // 专科/线外归入保底
    groups[t]=groups[t]||[];
    groups[t].push(r);
  }
  for(const k of Object.keys(groups))groups[k].sort((a,b)=>Math.abs(a.diff)-Math.abs(b.diff));
  const slots={reach:8,match:7,safety:5};
  const labels={reach:'冲刺',match:'稳妥',safety:'保底'};
  const labelColors={reach:'#c0392b',match:'#c07830',safety:'#2d7a4a'};
  let html='<div style="font-size:.72rem;color:var(--t3);margin-bottom:8px">💡 点击 <span style="font-size:.82rem">🔼</span> 可调整志愿顺序（同一梯度内拖动排序），顺序将影响最终填报优先级</div>';
  for(const tier of['reach','match','safety']){
    const list=groups[tier];
    if(!list.length)continue;
    var _paid=isPaidUser();
    var _extraTh=_paid?'<th>评分</th><th>位次</th><th>学费</th>':'';
    html+=`<div class="vsec ${tier}"><h3><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:.78rem;font-weight:700;color:#fff;background:${labelColors[tier]}">${labels[tier]}</span> <small style="color:var(--t3)">（${list.length} 所）</small></h3><div class="vtbl-wrap"><table class="vtab"><thead><tr><th class="col-drag"></th><th class="col-seq">#</th><th>院校</th><th>专业</th><th>综合分</th>${_extraTh}<th>城市</th><th class="col-act">操作</th></tr></thead><tbody>`;
    for(let i=0;i<list.length;i++){
      const r=list[i];
      const key=(r.schoolCode||'')+'|'+(r.majorCode||'');
      var _extraTd=_paid
        ?`<td style="font-weight:700;color:var(--g)">${r.recScore||'--'}</td><td>${r.rankPosition||'--'}</td><td>${typeof r.tuition=='number'?r.tuition.toLocaleString():r.tuition||'--'}</td>`
        :'';
      html+=`<tr data-key="${escAttr(key)}" data-tier="${tier}" class="${tier} draggable-row" draggable="true">
        <td class="col-drag"><span class="drag-handle" title="拖拽排序">⋮</span></td>
        <td class="col-seq">${i+1}</td>
        <td>${esc(r.schoolName)}${r.scoreSource==='estimated'?' <span style="color:#c0392b;font-size:.68rem">⚠️预估</span>':''}</td>
        <td>${esc(normMajorName(r.majorName))}</td>
        <td><strong>${r.compositeScore}</strong></td>
        ${_extraTd}
        <td>${esc(r.city)}</td>
        <td class="col-act">
          ${i>0?`<button class="btn btn-gh btn-xs" onclick="moveFormItem('${escAttr(key)}','up')" title="上移">🔼</button>`:'<span class="col-drag"></span>'}
          ${i<list.length-1?`<button class="btn btn-gh btn-xs" onclick="moveFormItem('${escAttr(key)}','down')" title="下移">🔽</button>`:'<span class="col-drag"></span>'}
          <button class="btn btn-gh btn-xs" onclick="removeFormItem('${escAttr(key)}')" title="移除">✕</button>
        </td>
      </tr>`;
    }
    html+='</tbody></table></div>';
  }
  document.getElementById('formBody').innerHTML=html;
  document.getElementById('formModal').classList.remove('hidden');
  // 绑定拖拽排序
  initFormDrag();
}

// ===== 志愿单拖拽排序 =====
var __dragRow=null; // 当前拖拽行
function initFormDrag(){
  var tbody=document.querySelectorAll('#formBody .vtab tbody');
  for(var t=0;t<tbody.length;t++){
    var rows=tbody[t].querySelectorAll('tr.draggable-row');
    for(var i=0;i<rows.length;i++){
      rows[i].addEventListener('dragstart',onDragStart);
      rows[i].addEventListener('dragend',onDragEnd);
      rows[i].addEventListener('dragover',onDragOver);
      rows[i].addEventListener('dragleave',onDragLeave);
      rows[i].addEventListener('drop',onDrop);
      // 触摸事件支持（移动端）
      rows[i].addEventListener('touchstart',onTouchStart,{passive:false});
      rows[i].addEventListener('touchmove',onTouchMove,{passive:false});
      rows[i].addEventListener('touchend',onTouchEnd);
    }
  }
}

function onDragStart(e){
  __dragRow=this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain',this.dataset.key);
  // 半透明效果
  setTimeout(function(){__dragRow.style.opacity='0.4';},0);
}

function onDragEnd(e){
  this.classList.remove('dragging');
  this.style.opacity='';
  // 清除所有占位样式
  var allRows=document.querySelectorAll('#formBody .draggable-row');
  for(var i=0;i<allRows.length;i++){
    allRows[i].classList.remove('drag-over','drag-before','drag-after');
  }
  __dragRow=null;
}

function onDragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  if(!__dragRow||this===__dragRow)return;
  // 只允许同梯度内拖拽
  if(this.dataset.tier!==__dragRow.dataset.tier)return;
  // 显示插入位置指示
  this.classList.remove('drag-before','drag-after');
  var rect=this.getBoundingClientRect();
  var midY=rect.top+rect.height/2;
  if(e.clientY<midY){
    this.classList.add('drag-before');
  }else{
    this.classList.add('drag-after');
  }
}

function onDragLeave(e){
  this.classList.remove('drag-before','drag-after');
}

function onDrop(e){
  e.preventDefault();
  if(!__dragRow||this===__dragRow)return;
  // 只允许同梯度内拖拽
  if(this.dataset.tier!==__dragRow.dataset.tier)return;
  var dragKey=__dragRow.dataset.key;
  var dropKey=this.dataset.key;
  // 确定插入位置：之前还是之后
  var rect=this.getBoundingClientRect();
  var midY=rect.top+rect.height/2;
  var insertBefore=e.clientY<midY;
  // 在 __formOrder 中移动
  var order=window.__formOrder||[];
  var fromIdx=order.indexOf(dragKey);
  var toIdx=order.indexOf(dropKey);
  if(fromIdx<0||toIdx<0)return;
  // 从原位置移除
  order.splice(fromIdx,1);
  // 重新查找目标位置（因为 splice 改变了索引）
  toIdx=order.indexOf(dropKey);
  if(!insertBefore)toIdx++;
  order.splice(toIdx,0,dragKey);
  window.__formOrder=order;
  openForm(); // 重新渲染
}

// ===== 触摸拖拽支持（移动端）=====
var __touchRow=null,__touchClone=null,__touchStartY=0;
function onTouchStart(e){
  var handle=e.target.closest('.drag-handle');
  if(!handle)return;
  __touchRow=this;
  __touchStartY=e.touches[0].clientY;
  this.classList.add('dragging');
  e.preventDefault(); // 阻止滚动
}

function onTouchMove(e){
  if(!__touchRow)return;
  e.preventDefault();
  var touch=e.touches[0];
  // 找到触摸位置下的行
  var allRows=document.querySelectorAll('#formBody .draggable-row[data-tier="'+__touchRow.dataset.tier+'"]');
  for(var i=0;i<allRows.length;i++){
    allRows[i].classList.remove('drag-over','drag-before','drag-after');
    var rect=allRows[i].getBoundingClientRect();
    if(touch.clientY>=rect.top&&touch.clientY<=rect.bottom){
      var midY=rect.top+rect.height/2;
      if(touch.clientY<midY)allRows[i].classList.add('drag-before');
      else allRows[i].classList.add('drag-after');
    }
  }
}

function onTouchEnd(e){
  if(!__touchRow)return;
  // 找到最终放置位置
  var target=document.querySelector('#formBody .drag-before, #formBody .drag-after');
  if(target&&target!==__touchRow&&target.dataset.tier===__touchRow.dataset.tier){
    var dragKey=__touchRow.dataset.key;
    var dropKey=target.dataset.key;
    var isBefore=target.classList.contains('drag-before');
    var order=window.__formOrder||[];
    var fromIdx=order.indexOf(dragKey);
    var toIdx=order.indexOf(dropKey);
    if(fromIdx>=0&&toIdx>=0){
      order.splice(fromIdx,1);
      toIdx=order.indexOf(dropKey);
      if(!isBefore)toIdx++;
      order.splice(toIdx,0,dragKey);
      window.__formOrder=order;
    }
  }
  // 清理
  var allRows=document.querySelectorAll('#formBody .draggable-row');
  for(var i=0;i<allRows.length;i++){
    allRows[i].classList.remove('dragging','drag-over','drag-before','drag-after');
  }
  __touchRow=null;
  if(window.__formOrder&&window.__formOrder.length)openForm();
}

// 志愿单内上移/下移
function moveFormItem(key,dir){
  var order=window.__formOrder||[];
  var idx=order.indexOf(key);
  if(idx<0)return;
  // 找到该 key 所属梯度
  var r=sel.get(key);
  if(!r)return;
  var tier=r.tier||'match';
  if(tier==='out')tier='safety';
  // 只在同一梯度内移动：找到该梯度的所有 key
  var tierKeys=order.filter(function(k){var v=sel.get(k);return v&&v.tier===tier;});
  var pos=tierKeys.indexOf(key);
  if(dir==='up'&&pos>0){
    // 交换 order 中 key 和上一个同梯度 key 的位置
    var prevKey=tierKeys[pos-1];
    var iA=order.indexOf(key),iB=order.indexOf(prevKey);
    order[iA]=prevKey;order[iB]=key;
  }else if(dir==='down'&&pos<tierKeys.length-1){
    var nextKey=tierKeys[pos+1];
    var iA=order.indexOf(key),iB=order.indexOf(nextKey);
    order[iA]=nextKey;order[iB]=key;
  }
  window.__formOrder=order;
  openForm();
}

// 志愿单内移除
function removeFormItem(key){
  sel.delete(key);
  var order=window.__formOrder||[];
  var idx=order.indexOf(key);
  if(idx>=0)order.splice(idx,1);
  window.__formOrder=order;
  updateFloat();
  openForm();
}

// ===== 专业详情弹窗 =====
function openMajorDetail(majorName){
  // 未授权用户不能查看详情
  if(!isPaidUser())return showUpgradeModal();
  var all=getAllRecords();
  // 归一化处理（与 renderMajorBrowser 保持一致，确保专业名匹配）
  var allNorm=all.map(function(r){
    var cn=normMajorName(r.majorName);
    if(!cn)return null;
    if(cn===r.majorName)return r;
    var nr=Object.assign({},r);nr.majorName=cn;nr._origMajorName=r.majorName;return nr;
  }).filter(Boolean);
  var majors=aggregateByMajor(allNorm);
  var target=null;
  for(var i=0;i<majors.length;i++){if(majors[i].majorName===majorName){target=majors[i];break;}}
  if(!target)return toast('未找到专业数据',1);
  // 去重学校，按综合分降序
  var seen={},dedup=[];
  for(var i=0;i<target.records.length;i++){
    if(!seen[target.records[i].schoolName]){seen[target.records[i].schoolName]=true;dedup.push(target.records[i]);}
  }
  dedup.sort(function(a,b){return (b.compositeScore||0)-(a.compositeScore||0);});
  // 分数分布
  var bSize=20,bStart=400,buckets=[];
  while(bStart<650){buckets.push({min:bStart,max:bStart+bSize,cnt:0});bStart+=bSize;}
  for(var i=0;i<dedup.length;i++){var sc=dedup[i].compositeScore;if(typeof sc!=='number'||sc<=0)continue;for(var j=0;j<buckets.length;j++){if(sc>=buckets[j].min&&sc<buckets[j].max){buckets[j].cnt++;break;}}}
  var maxB=0;for(var i=0;i<buckets.length;i++){if(buckets[i].cnt>maxB)maxB=buckets[i].cnt;}
  // 城市分布
  var cityMap={};
  for(var i=0;i<dedup.length;i++){var ct=dedup[i].city||'未知';var s=ct.replace(/^浙江省|^浙江省|^江苏省|^江西省|^湖北省|^湖南省|^山东省|^吉林省|^安徽省|^福建省|^广东省|^河南省|^河北省|^辽宁省|^陕西省/g,'').replace(/市$/,'>').trim();if(!cityMap[s])cityMap[s]=0;cityMap[s]++;}
  var cityArr=[];for(var k in cityMap)cityArr.push({name:k,cnt:cityMap[k]});cityArr.sort(function(a,b){return b.cnt-a.cnt;});
  // 渲染
  var html='<div class="md-header"><h3>📚 '+esc(majorName)+'</h3><div class="md-meta">开设院校：<strong>'+dedup.length+'</strong> 所 | 综合分区间：<strong>'+target.scoreMin+' ~ '+target.scoreMax+'</strong> | 均值：<strong>'+target.scoreAvg+'</strong> | 平均学费：<strong>'+(target.tuitionAvg||'--')+'</strong>/年</div></div>';
  // 分数分布图
  html+='<div class="md-chart"><div style="font-weight:600;font-size:.78rem;margin-bottom:6px;color:var(--color-text)">📊 综合分分布</div>';
  for(var i=0;i<buckets.length;i++){var b=buckets[i];var pct=maxB?Math.round(b.cnt/maxB*100):0;html+='<div class="md-bar"><span class="md-bar-lbl">'+b.min+'-'+(b.min+20)+'</span><div class="md-bar-track"><div class="md-bar-fill" style="width:'+pct+'%;background:var(--color-accent)"><span>'+b.cnt+'</span></div></div><span class="md-bar-val">'+b.cnt+'</span></div>';}
  html+='</div>';
  // 城市分布
  html+='<div class="md-chart"><div style="font-weight:600;font-size:.78rem;margin-bottom:6px;color:var(--color-text)">📍 城市分布 TOP 10</div>';
  var topCities=cityArr.slice(0,10),maxCity=topCities[0]?topCities[0].cnt:0;
  for(var i=0;i<topCities.length;i++){var tc=topCities[i];var pct=Math.round(tc.cnt/maxCity*100);html+='<div class="md-bar"><span class="md-bar-lbl">'+esc(tc.name)+'</span><div class="md-bar-track"><div class="md-bar-fill" style="width:'+pct+'%;background:#f59e0b"><span>'+tc.cnt+'</span></div></div><span class="md-bar-val">'+tc.cnt+'</span></div>';}
  html+='</div>';
  // 开设院校列表
  html+='<div style="font-weight:600;font-size:.78rem;margin:10px 0 6px 0;color:var(--color-text)">🏫 开设院校（按综合分排序）</div><div class="md-schools">';
  var maxSc=dedup[0]?dedup[0].compositeScore:0;
  for(var i=0;i<dedup.length;i++){
    var r=dedup[i];
    var tags=[];
    if(r.is985)tags.push('<span class="tag tag-985">985</span>');
    if(r.is211)tags.push('<span class="tag tag-211">211</span>');
    if(r.isDoubleFirst)tags.push('<span class="tag tag-df">双一流</span>');
    if(r.isPrivate)tags.push('<span class="tag tag-pv">民办</span>');
    html+='<div class="md-school"><span class="mds-rank">'+(i+1)+'</span><div class="mds-name"><span>'+esc(r.schoolName)+' '+tags.join(' ')+'</span></div><span class="mds-score">'+r.compositeScore+' <span style="font-size:.62rem;color:var(--color-text-tertiary);margin-left:3px">'+(maxSc?Math.round(r.compositeScore/maxSc*100):0)+'%</span></span></div>';
  }
  html+='</div>';
  document.getElementById('mdTitle').textContent='📚 专业详情 — '+majorName;
  document.getElementById('mdBody').innerHTML=html;
  document.getElementById('majorDetailModal').classList.remove('hidden');
}

// 关闭专业详情
document.addEventListener('DOMContentLoaded',function(){
  var btn=document.getElementById('btnMdClose');
  if(btn)btn.addEventListener('click',function(){document.getElementById('majorDetailModal').classList.add('hidden');});
});

function openCmp(){
  if(!isPaidUser())return showUpgradeModal('cmp');
  const selected=[...sel.values()].slice(0,MAX_CMP);
  if(selected.length<2)return toast('至少选2所',1);
  // 扩展对比维度
  const fields=[
    {l:'🏫 院校',f:'schoolName'},
    {l:'📚 专业',f:'majorName'},
    {l:'📊 综合分',f:'compositeScore',n:1},
    {l:'🏅 位次',f:'rankPosition',n:1},
    {l:'💰 学费/年',r:r=>typeof r.tuition=='number'?r.tuition.toLocaleString():r.tuition||'--'},
    {l:'🏠 宿舍',f:'dorm'},
    {l:'📍 城市',f:'city'},
    {l:'📋 25计划',f:'plan25',n:1},
    {l:'🏷️ 层次',r:r=>{const t=[];if(r.is985)t.push('985');if(r.is211)t.push('211');if(r.isDoubleFirst)t.push('双一流');return t.join('·')||r.schoolType||'--';}},
    {l:'📈 软科',f:'rankLevel'},
    {l:'📝 备注',f:'note'},
    {l:'📚 课程',f:'courseGuide'},
    {l:'🎯 培养',f:'talentGoal'},
    {l:'🏫 校区',f:'campus'},
    {l:'📋 来源',r:r=>r.scoreSource==='estimated'?'预估':'实际'},
  ];
  const diffRows=new Set();
  for(const fd of fields){const vals=selected.map(r=>fd.r?fd.r(r):(fd.n?r[fd.f]:r[fd.f]));if(!vals.every(v=>String(v)===String(vals[0])))diffRows.add(fd.l);}
  let html='<div class="ctw"><table class="ct"><thead><tr><th></th>';
  for(const r of selected)html+=`<th>${esc(r.schoolName)}<br><small style="font-weight:400;color:#8c8c8c">${esc(normMajorName(r.majorName))}</small></th>`;
  html+='</tr></thead><tbody>';
  for(const fd of fields){const isDiff=diffRows.has(fd.l);html+=`<tr class="dr${isDiff?'':''}"><td class="rlb">${fd.l}</td>`;for(const r of selected){const v=fd.r?fd.r(r):(fd.n?r[fd.f]:esc(r[fd.f]||'--'));html+=`<td>${v}</td>`;}html+='</tr>';}
  html+='</tbody></table></div>';
  document.getElementById('cmpBody').innerHTML=html;
  document.getElementById('cmpModal').classList.remove('hidden');
}

function renderAdmin(){
  const grid=document.getElementById('adminGrid');
  grid.innerHTML=CATS.map(c=>{
    const d=loadData(c.k),n=d.length,has=n>0;
    const a=d.filter(r=>!r.isSuspended&&r.scoreSource!=='estimated').length;
    return`<div class="aitem${has?' has':''}" id="aitem-${c.k}"><h4>${c.i} ${c.l}</h4><div class="ast">${has?`${a}条历史+${n-a}条新增/停招`:'未加载'}</div><div class="aact"><label class="btn btn-o btn-sm" style="cursor:pointer">📁 上传<input type="file" accept=".xlsx,.xls" data-art="${c.k}" hidden onchange="up(this)"></label>${has?`<button class="btn btn-gh btn-sm" data-art="${c.k}" onclick="cls(this)">清空</button>`:''}${has?`<button class="btn btn-gh btn-sm" data-art="${c.k}" onclick="viewRecords('${c.k}')">📋 查看记录</button>`:''}</div><div class="ast" style="margin-top:6px" id="p-${c.k}"></div></div>`;
  }).join('');
  document.getElementById('totalCount').textContent=totalCount();
  // 隐藏详情面板
  document.getElementById('adminDetail').style.display='none';
  document.getElementById('editPanel').classList.remove('on');
  window.__adminCat=null;
}

function cls(btn){const k=btn.dataset.art;if(!confirm('确定清空？'))return;clearData(k);renderAdmin();toast('已清空');}

// ===== 管理后台：查看/编辑/新增/删除记录 =====
let __adminCat=null,__adminPage=0,__adminSearch='',__editingIdx=null;
const PAGE_SIZE=20;

function viewRecords(k){
  __adminCat=k;__adminPage=0;__adminSearch='';
  document.getElementById('adminSearch').value='';
  document.getElementById('editPanel').classList.remove('on');
  __editingIdx=null;
  renderAdminDetail();
}

function renderAdminDetail(){
  if(!__adminCat)return;
  const panel=document.getElementById('adminDetail');
  panel.style.display='block';
  let data=loadData(__adminCat);
  if(__adminSearch)data=data.filter(r=>{
    const s=(r.schoolName||'')+(r.majorName||'')+(r.city||'');
    return s.toLowerCase().includes(__adminSearch);
  });
  const total=data.length;
  const pages=Math.ceil(total/PAGE_SIZE)||1;
  if(__adminPage>=pages)__adminPage=pages-1;
  if(__adminPage<0)__adminPage=0;
  const start=__adminPage*PAGE_SIZE;
  const pageData=data.slice(start,start+PAGE_SIZE);
  document.getElementById('adminTableBody').innerHTML=pageData.map((r,i)=>{
    const idx=start+i;
    return`<tr><td class="row-num">${idx+1}</td><td>${esc(r.schoolName)}${r.isSuspended?' <span class="tag tag-pv">停招</span>':''}${r.scoreSource==='estimated'?' <span class="tag tag-est">预估</span>':''}</td><td>${esc(r.majorName||'')}</td><td>${r.compositeScore||'--'}</td><td>${esc(r.city||'')}</td><td><button class="btn btn-gh btn-sm" onclick="editRecord('${__adminCat}',${idx})" style="margin-right:4px">✏️</button><button class="btn btn-gh btn-sm" onclick="deleteRecord('${__adminCat}',${idx})">🗑</button></td></tr>`;
  }).join('');
  // 分页
  let pager='';
  if(pages>1){
    pager+=`<button onclick="__adminPage=0;renderAdminDetail()" ${__adminPage===0?'disabled':''}>⏮</button>`;
    pager+=`<button onclick="__adminPage--;renderAdminDetail()" ${__adminPage===0?'disabled':''}>◀</button>`;
    for(let p=0;p<pages;p++){
      pager+=`<button class="${p===__adminPage?'on':''}" onclick="__adminPage=${p};renderAdminDetail()">${p+1}</button>`;
    }
    pager+=`<button onclick="__adminPage++;renderAdminDetail()" ${__adminPage>=pages-1?'disabled':''}>▶</button>`;
    pager+=`<button onclick="__adminPage=${pages-1};renderAdminDetail()" ${__adminPage>=pages-1?'disabled':''}>⏭</button>`;
  }
  document.getElementById('adminPager').innerHTML=pager;
  document.getElementById('totalCount').textContent=totalCount();
  // 滚动到详情区
  panel.scrollIntoView({behavior:'smooth'});
}

function editRecord(k,idx){
  const data=loadData(k);
  if(idx<0||idx>=data.length)return toast('记录不存在',1);
  __editingIdx=idx;
  const r=data[idx];
  const panel=document.getElementById('editPanel');
  document.getElementById('editTitle').textContent=`编辑: ${r.schoolName} - ${r.majorName||''}`;
  document.getElementById('editForm').innerHTML=`
    <label>院校名称<input type="text" id="ef-schoolName" value="${escAttr(r.schoolName||'')}"></label>
    <label>专业名称<input type="text" id="ef-majorName" value="${escAttr(r.majorName||'')}"></label>
    <label>综合分<input type="number" id="ef-compositeScore" value="${r.compositeScore||''}" step="0.01"></label>
    <label>城市<input type="text" id="ef-city" value="${escAttr(r.city||'')}"></label>
    <label>学费(元/年)<input type="number" id="ef-tuition" value="${r.tuition||''}" step="0.01"></label>
    <label>宿舍<input type="text" id="ef-dorm" value="${escAttr(r.dorm||'')}"></label>
    <label>校区<input type="text" id="ef-campus" value="${escAttr(r.campus||'')}"></label>
    <label>专业代码<input type="text" id="ef-majorCode" value="${escAttr(r.majorCode||'')}"></label>
    <label>院校层次<input type="text" id="ef-schoolType" value="${escAttr(r.schoolType||'')}"></label>
    <label>位次<input type="text" id="ef-rankPosition" value="${r.rankPosition||''}"></label>
    <label>计划数(25届)<input type="number" id="ef-plan25" value="${r.plan25||''}" step="1"></label>
    <label>数据来源<select id="ef-scoreSource"><option value="actual" ${r.scoreSource==='actual'?'selected':''}>实际</option><option value="estimated" ${r.scoreSource==='estimated'?'selected':''}>预估</option></select></label>
    <label>状态<select id="ef-isSuspended"><option value="0" ${!r.isSuspended?'selected':''}>正常</option><option value="1" ${r.isSuspended?'selected':''}>停招</option></select></label>
    <label class="full">备注<textarea id="ef-note">${esc(r.note||'')}</textarea></label>
  `;
  panel.classList.add('on');
  panel.scrollIntoView({behavior:'smooth'});
}

function saveEditedRecord(){
  if(__editingIdx===null||!__adminCat)return;
  const data=loadData(__adminCat);
  const r=__editingIdx>=0&&__editingIdx<data.length?data[__editingIdx]:null;
  if(!r)return toast('记录不存在',1);
  const get=(id)=>document.getElementById(id)?.value||'';
  r.schoolName=get('ef-schoolName');
  if(!r.schoolName)return toast('院校名称不能为空',1);
  r.majorName=get('ef-majorName');
  r.compositeScore=parseFloat(get('ef-compositeScore'))||r.compositeScore;
  r.city=get('ef-city');
  r.tuition=parseFloat(get('ef-tuition'))||r.tuition;
  r.dorm=get('ef-dorm');
  r.campus=get('ef-campus');
  r.majorCode=get('ef-majorCode');
  r.schoolType=get('ef-schoolType');
  const st=r.schoolType||'';
  r.is985=/985/.test(st);r.is211=/211/.test(st);r.isDoubleFirst=/双一流/.test(st);
  r.isPublic=/公办/.test(st)&&!/民办/.test(st);r.isPrivate=/民办/.test(st)||/独立学院/.test(st);
  r.rankPosition=get('ef-rankPosition');
  const p25=parseFloat(get('ef-plan25'));
  r.plan25=isNaN(p25)?r.plan25:p25;
  r.scoreSource=get('ef-scoreSource');
  r.isSuspended=get('ef-isSuspended')==='1';
  r.note=get('ef-note');
  saveData(__adminCat,data);
  document.getElementById('editPanel').classList.remove('on');
  __editingIdx=null;
  renderAdminDetail();
  renderAdmin();
  toast('已保存');
}

function deleteRecord(k,idx){
  const data=loadData(k);
  if(idx<0||idx>=data.length)return toast('记录不存在',1);
  const r=data[idx];
  if(!confirm(`确定删除 "${r.schoolName} - ${r.majorName||''}"？`))return;
  data.splice(idx,1);
  saveData(k,data);
  renderAdminDetail();
  renderAdmin();
  toast('已删除');
}

function addNewRecord(){
  if(!__adminCat)return;
  const panel=document.getElementById('editPanel');
  __editingIdx=-1; // -1 表示新增
  document.getElementById('editTitle').textContent='➕ 新增记录';
  document.getElementById('editForm').innerHTML=`
    <label>院校名称<input type="text" id="ef-schoolName" placeholder="必填"></label>
    <label>专业名称<input type="text" id="ef-majorName"></label>
    <label>综合分<input type="number" id="ef-compositeScore" step="0.01" placeholder="选填"></label>
    <label>城市<input type="text" id="ef-city"></label>
    <label>学费(元/年)<input type="number" id="ef-tuition" step="0.01"></label>
    <label>宿舍<input type="text" id="ef-dorm"></label>
    <label>校区<input type="text" id="ef-campus"></label>
    <label>专业代码<input type="text" id="ef-majorCode"></label>
    <label>院校层次<input type="text" id="ef-schoolType" placeholder="如: 公办、双一流、985"></label>
    <label>位次<input type="text" id="ef-rankPosition"></label>
    <label>计划数(25届)<input type="number" id="ef-plan25" step="1"></label>
    <label>数据来源<select id="ef-scoreSource"><option value="actual">实际</option><option value="estimated">预估</option></select></label>
    <label>状态<select id="ef-isSuspended"><option value="0">正常</option><option value="1">停招</option></select></label>
    <label class="full">备注<textarea id="ef-note"></textarea></label>
  `;
  panel.classList.add('on');
  panel.scrollIntoView({behavior:'smooth'});
}

function saveNewRecord(){
  const name=document.getElementById('ef-schoolName')?.value?.trim();
  if(!name)return toast('院校名称不能为空',1);
  const data=loadData(__adminCat);
  const st=document.getElementById('ef-schoolType')?.value||'';
  const r={
    schoolName:name,
    majorName:document.getElementById('ef-majorName')?.value||'',
    compositeScore:parseFloat(document.getElementById('ef-compositeScore')?.value)||null,
    city:document.getElementById('ef-city')?.value||'',
    tuition:parseFloat(document.getElementById('ef-tuition')?.value)||null,
    dorm:document.getElementById('ef-dorm')?.value||'',
    campus:document.getElementById('ef-campus')?.value||'',
    majorCode:document.getElementById('ef-majorCode')?.value||'',
    schoolType:st,
    is985:/985/.test(st),is211:/211/.test(st),isDoubleFirst:/双一流/.test(st),
    isPublic:/公办/.test(st)&&!/民办/.test(st),isPrivate:/民办/.test(st)||/独立学院/.test(st),
    rankPosition:document.getElementById('ef-rankPosition')?.value||'',
    plan25:parseFloat(document.getElementById('ef-plan25')?.value)||null,
    scoreSource:document.getElementById('ef-scoreSource')?.value||'actual',
    isSuspended:document.getElementById('ef-isSuspended')?.value==='1',
    note:document.getElementById('ef-note')?.value||'',
    schoolCode:'PS'+String(Math.abs(hs(name))%10000).padStart(4,'0'),
    isNew:true,rawCategory:'',
  };
  data.push(r);
  saveData(__adminCat,data);
  document.getElementById('editPanel').classList.remove('on');
  __editingIdx=null;
  renderAdminDetail();
  renderAdmin();
  toast('已新增');
}

// ===== 导出 Excel =====
function exportExcel(){
  const selected=[...sel.values()];
  if(!selected.length)return toast('请先勾选学校',1);
  const X=window.XLSX;
  if(!X){toast('XLSX组件未加载，请检查网络',1);return;}
  const rows=selected.map(r=>({
    '梯度':{reach:'冲刺',match:'稳妥',safety:'保底'}[r.tier]||'',
    '院校名称':r.schoolName,
    '专业名称':r.majorName,
    '专业代码':r.majorCode||'',
    '往年综合分':r.compositeScore,
    '你的分差':(r.diff||0).toFixed(1),
    '位次':r.rankPosition||'',
    '城市':r.city||'',
    '学费(元/年)':r.tuition||'',
    '宿舍':r.dorm||'',
    '院校层次':[r.is985?'985':'',r.is211?'211':'',r.isDoubleFirst?'双一流':''].filter(Boolean).join('/')||r.schoolType||'',
    '数据来源':r.scoreSource==='estimated'?'预估':'实际',
    '计划数(25届)':r.plan25||r.plan24||'',
    '备注':r.note||''
  }));
  const ws=X.utils.json_to_sheet(rows);
  ws['!cols']=[{wch:6},{wch:20},{wch:22},{wch:12},{wch:12},{wch:10},{wch:10},{wch:12},{wch:14},{wch:30},{wch:20},{wch:10},{wch:14},{wch:30}];
  const wb=X.utils.book_new();
  X.utils.book_append_sheet(wb,ws,'志愿选择');
  X.writeFile(wb,`浙江艺考志愿_${new Date().toISOString().slice(0,10)}.xlsx`);
  toast('✅ 已导出Excel');
}

async function up(input){
  const fs=Array.from(input.files).filter(f=>f.name.endsWith('.xlsx')||f.name.endsWith('.xls'));
  if(!fs.length)return;
  const k=input.dataset.art,p=document.getElementById('p-'+k);
  p.textContent='⏳ 解析中...';
  try{
    const X=window.XLSX;if(!X){p.textContent='❌ 组件未加载';return;}
    let all=[];
    for(const f of fs){
      const buf=await f.arrayBuffer(),wb=X.read(buf,{type:'array'});
      for(const sn of wb.SheetNames){
        const rows=X.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:''});
        all.push(...parseRows(rows,sn));
      }
    }
    const map=new Map();
    for(const r of all){const k=r.schoolName+'|'+r.majorName+'|'+r.compositeScore;if(!map.has(k))map.set(k,r);}
    const fi=[...map.values()];saveData(k,fi);
    p.textContent=`✅ ${fs.length}文件→${fi.length}条`;
    renderAdmin();toast(`✅ ${fi.length}条`);
  }catch(e){p.textContent='❌ (数据格式错误)';}
  input.value='';
}

function parseRows(rows,sn){
  const markers=['院校','专业','学费','综合分','位次','计划数','招生数','省份','城市','宿舍','校区','软科','培养','课程','备注','科类','方向','代码','名称'];
  const isH=r=>{const t=r.map(c=>String(c||'')).join(' ').toLowerCase();return markers.filter(m=>t.includes(m)).length>=3;};
  let hi=-1,mapping=null;
  for(let i=0;i<Math.min(5,rows.length);i++){
    if(isH(rows[i])){
      mapping=rows[i].map(c=>{const raw=String(c||'').trim();if(!raw)return null;const kw={schoolCode:['院校代码'],schoolName:['院校名称'],majorCode:['专业代码'],majorName:['专业名称'],city:['省份和城市','省份城市','省份','城市'],schoolType:['985','211','双一流','公办','民办','独立学院'],tuition:['学费'],dorm:['宿舍'],campus:['校区'],plan24:['24计划数','24届计划数','24届招生数'],plan25:['25计划数','25届计划数','25届招生数'],compositeScore:['综合分','预估综合分','预估分','预估分数','25届预估综合分','25届预估分数'],rankLevel:['软科实力排名','软科'],scoreLineReq:['分数线','小分','选课','要求'],rankPosition:['位次号','位次'],note:['备注','特殊备注'],courseGuide:['课程','专业导向'],talentGoal:['培养','人才目标'],subCategory:['科类','方向']};let bf=null,bs=0;for(const[f,ks]of Object.entries(kw))for(const k of ks)if(raw.includes(k)&&k.length>bs){bs=k.length;bf=f;}return bf;});
      if(mapping.filter(m=>m).length>=4){hi=i;break;}
    }
  }
  if(hi===-1)return[];
  const res=[],isSus='停招' in sn,isNew='新增' in sn||'预估' in sn;
  const numCols=new Set(['tuition','plan24','plan25','compositeScore','rankPosition','rankLevel']);
  for(let r=hi+1;r<rows.length;r++){
    const row=rows[r];if(!row||row.every(c=>!String(c).trim()))continue;
    const obj={scoreSource:isNew?'estimated':'actual',rawCategory:'',isSuspended:isSus,isNew};
    for(let i=0;i<mapping.length;i++){const f=mapping[i];if(!f)continue;let v=row[i];if(v===undefined||v===null)continue;const sv=String(v).trim();if(!sv)continue;if(numCols.has(f)){const clean=sv.replace(/[,，元/年\s]/g,'');const n=parseFloat(clean);obj[f]=isNaN(n)?sv:n;}else obj[f]=sv;}
    if(!obj.schoolName)continue;
    if(!obj.schoolCode)obj.schoolCode='PS'+String(Math.abs(hs(obj.schoolName))%10000).padStart(4,'0');
    if(obj.tuition&&obj.tuition<10)obj.tuition*=10000;
    if(obj.compositeScore===0||obj.compositeScore==='无')obj.compositeScore=null;
    const st=obj.schoolType||'';
    obj.is985=/985/.test(st);obj.is211=/211/.test(st);obj.isDoubleFirst=/双一流/.test(st);
    obj.isPublic=/公办/.test(st)&&!/民办/.test(st);obj.isPrivate=/民办/.test(st)||/独立学院/.test(st);
    res.push(obj);
  }
  return res;
}
function hs(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h%10000);}
function esc(s){if(!s)return'';const d=document.createElement('div');d.textContent=String(s);return d.innerHTML;}
function escAttr(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;');}
function isArtAcademy(r){const n=(r.schoolName||'');return /美术学?院|艺术学?院|音乐学?院|舞蹈学?院|戏曲学?院|电影学?院|戏剧学?院|传媒学?院|中央美术|中国美术|天津美术|西安美术|四川美术|鲁迅美术|湖北美术|广州美术|南京艺术|广西艺术|云南艺术|山东艺术|吉林艺术|新疆艺术|北京电影|中央戏剧|中国戏曲|上海戏剧|北京舞蹈|浙江传媒/i.test(n);}
function toast(msg,err){const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=msg;document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},3000);}

// ===== 用户管理（管理员查看注册手机号） =====
let __adminSection='data';

function showAdminSection(section){
  __adminSection=section;
  var dataSec=document.getElementById('adminDataSection');
  var userSec=document.getElementById('adminUsers');
  var analysisSec=document.getElementById('adminAnalysis');
  var authSec=document.getElementById('adminAuth');
  if(dataSec)dataSec.style.display=section==='data'?'':'none';
  if(userSec)userSec.style.display=section==='users'?'':'none';
  if(analysisSec)analysisSec.style.display=section==='analysis'?'':'none';
  if(authSec)authSec.style.display=section==='auth'?'':'none';
  // 更新 tab 按钮样式
  var btnData=document.getElementById('btnTabData');
  var btnUsers=document.getElementById('btnTabUsers');
  var btnAnalysis=document.getElementById('btnTabAnalysis');
  var btnAuth=document.getElementById('btnTabAuth');
  if(btnData){btnData.className='btn btn-sm '+(section==='data'?'btn-g':'btn-gh');}
  if(btnUsers){btnUsers.className='btn btn-sm '+(section==='users'?'btn-g':'btn-gh');}
  if(btnAnalysis){btnAnalysis.className='btn btn-sm '+(section==='analysis'?'btn-g':'btn-gh');}
  if(btnAuth){btnAuth.className='btn btn-sm '+(section==='auth'?'btn-g':'btn-gh');}
  if(section==='data')renderAdmin();
  if(section==='users')renderUsers();
  if(section==='analysis')renderAdminAnalysis();
  if(section==='auth')renderAdminAuth();
}

async function renderUsers(){
  var body=document.getElementById('adminUsersBody');
  body.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--t3);padding:20px">⏳ 加载中...</td></tr>';
  var allUsers=[];

  // 1. 读取本地存储的手机号
  try{
    var localList=JSON.parse(localStorage.getItem('zjyk_phone_list')||'[]');
    localList.forEach(function(u){
      allUsers.push({phone:u.phone,grade:u.grade||'',direction:u.direction||'',time:u.time,source:'本地'});
    });
  }catch(e){}

  // 2. 尝试从 Supabase 拉取（内置 10s 超时 + 3 次重试）
  try{
    var remoteList=await supaSelect(500);
    if(remoteList && remoteList.length){
      remoteList.forEach(function(u){
        var exists=allUsers.some(function(x){return x.phone===u.phone;});
        if(!exists){
          allUsers.push({phone:u.phone,grade:u.grade||'',direction:u.direction||'',time:u.created_at||u.id||'',source:'云端'});
        }
      });
    }
  }catch(e){/* 云端拉取失败，仅显示本地数据 */}

  // 按时间倒序
  allUsers.sort(function(a,b){return (b.time||'').localeCompare(a.time||'');});

  if(!allUsers.length){
    body.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--t3);padding:20px">暂无注册用户</td></tr>';
    return;
  }

  body.innerHTML=allUsers.map(function(u,i){
    var timeDisplay=u.time;
    try{timeDisplay=new Date(u.time).toLocaleString('zh-CN');}catch(e){}
    return '<tr><td class="row-num">'+(i+1)+'</td><td style="font-weight:600">'+esc(u.phone)+'</td><td>'+esc(u.grade||'--')+'</td><td>'+esc(u.direction||'--')+'</td><td style="font-size:.78rem;color:var(--t2)">'+timeDisplay+'</td><td style="font-size:.74rem">'+(u.source==='云端'?'<span style="color:var(--gr);font-weight:600">☁️ 云端</span>':'<span style="color:var(--o)">💻 本地</span>')+'</td></tr>';
  }).join('');
}

// 绑定用户管理按钮事件
document.addEventListener('DOMContentLoaded',function(){
  setTimeout(function(){
    var bre=document.getElementById('btnRefreshUsers');
    if(bre)bre.addEventListener('click',renderUsers);
    var bex=document.getElementById('btnExportUsers');
    if(bex)bex.addEventListener('click',function(){
      var phoneList=JSON.parse(localStorage.getItem('zjyk_phone_list')||'[]');
      if(!phoneList.length)return toast('暂无数据可导出',1);
      var csv='手机号,年级,专业方向,注册时间\n';
      phoneList.forEach(function(u){csv+=u.phone+','+(u.grade||'')+','+(u.direction||'')+','+new Date(u.time).toLocaleString('zh-CN')+'\n';});
      var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='注册用户_'+new Date().toISOString().slice(0,10)+'.csv';
      a.click();toast('✅ 已导出CSV');
    });
    var bcl=document.getElementById('btnClearUsers');
    if(bcl)bcl.addEventListener('click',function(){
      if(!confirm('确定清空本地手机号列表？（云端数据不受影响）'))return;
      localStorage.removeItem('zjyk_phone_list');
      renderUsers();
      toast('已清空本地列表');
    });
  },200);
});


// ===================== 新功能模块 =====================

// ===== 导航与 Tab 切换 =====
var __currentTab='dashboard';
function switchTab(tabName){
  __currentTab=tabName;
  // 数据分析仅管理员可访问
  if(tabName==='analysisView' && !__adminAccess){
    switchTab('dashboard');return;
  }
  // ★ 未登录用户：不可访问院校浏览/专业浏览
  // ★ 已登录体验版用户（!isPaidUser）：同样不可访问院校浏览/专业浏览，弹升级引导
  var paidTabs=['schoolBrowser','majorBrowser'];
  if(paidTabs.indexOf(tabName)>=0){
    if(!__isLoggedIn){showUpgradeModal();switchTab('dashboard');return;}
    if(!isPaidUser()){showUpgradeModal();switchTab('dashboard');return;}
  }
  // 隐藏所有顶层卡片
  var cards=['dashboard','inputCard','resultBox','schoolBrowser','majorBrowser','analysisView'];
  for(var i=0;i<cards.length;i++){
    var el=document.getElementById(cards[i]);
    if(el)el.classList.add('hidden');
  }
  // 隐藏 hero, dataSourceCard, scoreBox, algoCard, tierExplain, gateCard
  var hides=['gateCard','hero','scoreBox','algoCard','tierExplain','dataSourceCard','floatBar','searchBar','usesBar'];
  for(var i=0;i<hides.length;i++){
    var el=document.getElementById(hides[i]);
    if(el && el.classList)el.classList.add('hidden');
  }
  // 根据 tab 显示对应内容
  var target=document.getElementById(tabName);
  if(target)target.classList.remove('hidden');

  // 更新 URL hash
  if(window.location.hash!=='#'+tabName){
    try{history.replaceState(null,'','#'+tabName);}catch(e){}
  }
  // 更新导航 active 状态
  var navLinks=document.querySelectorAll('#topNav a');
  for(var i=0;i<navLinks.length;i++){
    var href=navLinks[i].getAttribute('href')||'';
    if(href==='#'+tabName)navLinks[i].classList.add('active');
    else navLinks[i].classList.remove('active');
  }
  // 显示 hero（除仪表盘外都显示）
  var heroEl=document.getElementById('hero');
  if(heroEl && tabName!=='dashboard' && tabName!=='analysisView'){
    heroEl.classList.remove('hidden');
  }
  // 显示浮动栏（填报/院校浏览/专业浏览 tab）
  if(tabName==='inputCard' || tabName==='resultBox' || tabName==='schoolBrowser' || tabName==='majorBrowser'){
    updateFloat();
    // 显示悬浮快捷操作按钮
    var fabContainer=document.getElementById('fabContainer');
    if(fabContainer)fabContainer.classList.remove('hidden');
  }else{
    document.getElementById('floatBar').classList.remove('on');
    // 仪表盘隐藏悬浮按钮
    var fabContainer=document.getElementById('fabContainer');
    if(fabContainer)fabContainer.classList.add('hidden');
  }
  // 返回按钮：非仪表盘/登录界面时显示
  var backBtn=document.getElementById('hdrBack');
  if(backBtn){
    if(tabName==='dashboard'){
      backBtn.classList.add('hidden');
    }else{
      backBtn.classList.remove('hidden');
    }
  }
  // 渲染内容
  if(tabName==='dashboard')renderDashboard();
  else if(tabName==='schoolBrowser')renderSchoolBrowser();
  else if(tabName==='majorBrowser')renderMajorBrowser();
  else if(tabName==='analysisView')renderDataAnalysis();
  else if(tabName==='inputCard'){
    document.getElementById('inputCard').classList.remove('hidden');
    document.getElementById('usesBar')&&document.getElementById('usesBar').classList.remove('hidden');
  }
  // 滚动到顶部
  window.scrollTo({top:0,behavior:'smooth'});
}

// 初始化导航点击事件（立即注册，defer 脚本已保证 DOM 可用）
(function initNav(){
  var navLinks=document.querySelectorAll('#topNav a');
  for(var i=0;i<navLinks.length;i++){
    navLinks[i].addEventListener('click',function(e){
      e.preventDefault();
      var href=this.getAttribute('href')||'';
      var tabName=href.replace('#','');
      switchTab(tabName);
    });
  }
  window.addEventListener('hashchange',function(){
    var hash=window.location.hash.replace('#','');
    if(hash && document.getElementById(hash)){
      switchTab(hash);
    }
  });
  // 返回按钮（手机端）
  var backBtn=document.getElementById('hdrBack');
  if(backBtn){
    backBtn.addEventListener('click',function(){
      if(__currentTab!=='dashboard')switchTab('dashboard');
    });
  }
})();

// showDashboard（auth.js 调用）
function showDashboard(){
  var gc=document.getElementById('gateCard');if(gc)gc.classList.add('hidden');
  var tn=document.getElementById('topNav');if(tn)tn.classList.remove('hidden');
  switchTab('dashboard');
  // 确保用户状态栏（含退出按钮）始终更新
  if(typeof updatePaidUI==='function')updatePaidUI();
}

// app.js 全部就绪，通知 auth.js 初始化
window.__appReady=true;
if(typeof window.__authInitPending==='function'){
  window.__authInitPending();
  window.__authInitPending=null;
}

// ===== 仪表盘 =====
function renderDashboard(){
  var all=getAllRecords();
  var schools=aggregateBySchool(all);
  var majors=aggregateByMajor(all);
  var cities={};
  for(var i=0;i<all.length;i++){if(all[i].city)cities[all[i].city]=true;}
  var cityCount=Object.keys(cities).length;
  var majorNames={};
  for(var i=0;i<all.length;i++){if(all[i].majorName)majorNames[all[i].majorName]=true;}
  var uniqueMajorCount=Object.keys(majorNames).length;
  
  // 欢迎区
  var phone=localStorage.getItem('zjyk_phone')||'';
  var phoneTail=phone?phone.slice(-4):'用户';
  var hour=new Date().getHours();
  var greet=hour<12?'上午好':hour<18?'下午好':'晚上好';
  document.getElementById('dashWelcome').innerHTML='<div class="dash-welcome">👋 '+greet+'，<span class="dw-phone">****'+esc(phoneTail)+'</span></div><div style="font-size:.78rem;color:var(--color-text-tertiary)">欢迎使用非凡教育 · 浙江艺考志愿助手</div>';
  
  // 统计卡片
  document.getElementById('dashStats').innerHTML=
    '<div class="dash-stat"><div class="ds-num">'+schools.length+'</div><div class="ds-lbl">覆盖院校</div></div>'+
    '<div class="dash-stat"><div class="ds-num">'+uniqueMajorCount+'</div><div class="ds-lbl">专业方向</div></div>'+
    '<div class="dash-stat"><div class="ds-num">'+cityCount+'</div><div class="ds-lbl">覆盖城市</div></div>'+
    '<div class="dash-stat"><div class="ds-num">'+all.length+'</div><div class="ds-lbl">录取数据</div></div>';
  
  // 快捷入口（未登录用户仅显示智能填报+我的志愿单，登录用户显示全部）
  var entries=[
    {icon:'🎯',title:'智能填报',desc:'输入成绩，匹配冲稳保院校',tab:'inputCard',paid:false},
    {icon:'🏫',title:'院校浏览',desc:'浏览全部院校及其开设专业',tab:'schoolBrowser',paid:false},
    {icon:'📚',title:'专业浏览',desc:'按专业筛选，查看院校排名',tab:'majorBrowser',paid:false},
    {icon:'📋',title:'我的志愿单',desc:'查看已保存的志愿选择',tab:'myForm',paid:false},
    {icon:'📈',title:'数据分析',desc:'录取趋势与可视化分析',tab:'analysisView',paid:true},
  ];
  var entriesHtml='';
  for(var i=0;i<entries.length;i++){
    var e=entries[i];
    // 免费用户隐藏付费功能入口
    if(e.paid&&!isPaidUser())continue;
    var lockBadge=e.paid?'<span style="font-size:.65rem;color:var(--_orange-500);margin-left:4px">🔒</span>':'';
    entriesHtml+='<div class="dash-entry" data-tab="'+e.tab+'" onclick="dashEntryClick(\''+e.tab+'\')"><span class="de-icon">'+e.icon+'</span><div class="de-title">'+e.title+lockBadge+'</div><div class="de-desc">'+e.desc+'</div></div>';
  }
  // 免费用户添加升级入口
  if(!__isPaidUser && __isLoggedIn){
    entriesHtml+='<div class="dash-entry" onclick="showUpgradeModal()" style="border-color:var(--_orange-500);background:var(--_orange-50)"><span class="de-icon">🔓</span><div class="de-title" style="color:var(--_orange-500)">升级完整版</div><div class="de-desc">解锁院校详情 / 院校浏览 / 专业浏览 / 算法评分</div></div>';
  }
  document.getElementById('dashEntries').innerHTML=entriesHtml;
}

function dashEntryClick(tab){
  if(tab==='myForm'){
    // 显示已勾选的志愿
    if(sel.size>0){openForm();}
    else{toast('暂无已选择的学校，请先在智能填报中勾选');}
  }else if(tab==='inputCard'){
    switchTab('inputCard');
    document.getElementById('inputCard').classList.remove('hidden');
    document.getElementById('usesBar')&&document.getElementById('usesBar').classList.remove('hidden');
    document.getElementById('hero')&&document.getElementById('hero').classList.remove('hidden');
  }else{
    switchTab(tab);
  }
}

// ===== 院校浏览 =====
var __schoolCat='all',__schoolSearch='',__schoolSort='scoreDesc',__schoolFilters={type:'all'};
var __schoolSubCat='all'; // 子门类选择
var __schoolProvince='all',__schoolCity='all'; // 省份/城市筛选
var __schoolSel=new Set(); // 记录已勾选的学校名
function renderSchoolBrowser(catKey){
  if(catKey!==undefined)__schoolCat=catKey;
  // 切换门类时重置子门类
  if(catKey!==undefined)__schoolSubCat='all';
  var all=getAllRecords();
  if(__schoolCat!=='all')all=all.filter(function(r){return r.catKey===__schoolCat;});
  // 子门类筛选
  if(__schoolCat!=='all'&&__schoolSubCat!=='all'){
    all=filterBySubcat(all,__schoolSubCat);
  }
  // 省份/城市筛选
  all=filterByProvince(all,__schoolProvince);
  all=filterByCity(all,__schoolCity);
  // 未授权用户限制：院校浏览仅显示前5所
  if(!isPaidUser()&&all.length>0){
    all=all.slice(0,5);
  }
  var schools=aggregateBySchool(all);

  // 门类 tab
  var tabsHtml='<button class="'+(__schoolCat==='all'?'on':'')+'" data-t="all">全部</button>';
  for(var i=0;i<CATS.length;i++){
    var c=CATS[i];
    tabsHtml+='<button class="'+(__schoolCat===c.k?'on':'')+'" data-t="'+c.k+'">'+c.i+' '+c.l+'</button>';
  }
  document.getElementById('schoolCatTabs').innerHTML=tabsHtml;
  document.getElementById('schoolCatTabs').onclick=function(e){
    if(e.target.tagName==='BUTTON'){filterSchoolCat(e.target.dataset.t);}
  };

  // 子门类 tab（仅当所选门类有子分类时显示）
  var subCatContainer=document.getElementById('schoolSubCatTabs');
  var subcats=getSubcats(__schoolCat);
  if(subcats.length&&__schoolCat!=='all'){
    var subHtml='<button class="'+(__schoolSubCat==='all'?'on':'')+'" data-st="all">全部</button>';
    for(var i=0;i<subcats.length;i++){
      var sc=subcats[i];
      subHtml+='<button class="'+(__schoolSubCat===sc.k?'on':'')+'" data-st="'+sc.k+'">'+sc.i+' '+sc.l+'</button>';
      if(sc.children){
        for(var j=0;j<sc.children.length;j++){
          var ch=sc.children[j];
          subHtml+='<button class="'+(__schoolSubCat===ch.k?'on':'')+'" data-st="'+ch.k+'" style="font-size:.78rem">'+ch.i+' '+ch.l+'</button>';
        }
      }
    }
    subCatContainer.innerHTML=subHtml;
    subCatContainer.style.display='flex';
    subCatContainer.onclick=function(e){
      if(e.target.tagName==='BUTTON'){__schoolSubCat=e.target.dataset.st;renderSchoolBrowser();}
    };
  }else{
    subCatContainer.innerHTML='';
    subCatContainer.style.display='none';
  }
  
  // 筛选按钮
  document.getElementById('schoolFilters').innerHTML=
    '<button class="'+(__schoolFilters.type==='all'?'on':'')+'" data-type="all">全部院校</button>'+
    '<button class="'+(__schoolFilters.type==='985'?'on':'')+'" data-type="985">985</button>'+
    '<button class="'+(__schoolFilters.type==='211'?'on':'')+'" data-type="211">211</button>'+
    '<button class="'+(__schoolFilters.type==='doubleFirst'?'on':'')+'" data-type="doubleFirst">双一流</button>'+
    '<button class="'+(__schoolFilters.type==='public'?'on':'')+'" data-type="public">公办</button>'+
    '<button class="'+(__schoolFilters.type==='private'?'on':'')+'" data-type="private">民办</button>';
  document.getElementById('schoolFilters').onclick=function(e){
    if(e.target.tagName==='BUTTON'){__schoolFilters.type=e.target.dataset.type;renderSchoolBrowser();}
  };
  
  // 搜索
  document.getElementById('schoolSearch').value=__schoolSearch||'';
  document.getElementById('schoolSearch').oninput=function(){__schoolSearch=this.value.trim().toLowerCase();renderSchoolBrowser();};
  document.getElementById('schoolSort').value=__schoolSort||'scoreDesc';
  document.getElementById('schoolSort').onchange=function(){__schoolSort=this.value;renderSchoolBrowser();};

  // 省份/城市筛选控件初始化
  var spSel=document.getElementById('schoolProvince');
  var scSel=document.getElementById('schoolCity');
  // 初始化省份选项（仅首次）
  if(!spSel.dataset.init){
    var spHtml='<option value="all">不限省份</option>';
    for(var pi=0;pi<PROVINCES.length;pi++){spHtml+='<option value="'+PROVINCES[pi].k+'">'+PROVINCES[pi].i+' '+PROVINCES[pi].l+'</option>';}
    spSel.innerHTML=spHtml;
    spSel.dataset.init='1';
    spSel.onchange=function(){
      __schoolProvince=this.value;
      __schoolCity='all';
      // 更新城市下拉
      updateBrowserCitySelect('school',all);
      renderSchoolBrowser();
    };
    scSel.onchange=function(){
      __schoolCity=this.value;
      renderSchoolBrowser();
    };
  }
  spSel.value=__schoolProvince;
  updateBrowserCitySelect('school',all);
  // 筛选
  var filtered=schools;
  if(__schoolSearch){
    filtered=filtered.filter(function(s){return (s.schoolName||'').toLowerCase().includes(__schoolSearch);});
  }
  if(__schoolFilters.type==='985')filtered=filtered.filter(function(s){return s.is985;});
  else if(__schoolFilters.type==='211')filtered=filtered.filter(function(s){return s.is211;});
  else if(__schoolFilters.type==='doubleFirst')filtered=filtered.filter(function(s){return s.isDoubleFirst;});
  else if(__schoolFilters.type==='public')filtered=filtered.filter(function(s){return s.isPublic&&!s.is985&&!s.is211;});
  else if(__schoolFilters.type==='private')filtered=filtered.filter(function(s){return s.isPrivate;});
  
  // 排序
  var sortMap={
    scoreDesc:function(a,b){return (b.compositeAvg||0)-(a.compositeAvg||0);},
    scoreAsc:function(a,b){return (a.compositeAvg||0)-(b.compositeAvg||0);},
    nameAsc:function(a,b){return (a.schoolName||'').localeCompare(b.schoolName||'','zh');},
    tuitionAsc:function(a,b){return (a.tuitionMin||0)-(b.tuitionMin||0);},
    tuitionDesc:function(a,b){return (b.tuitionMin||0)-(a.tuitionMin||0);},
  };
  if(sortMap[__schoolSort])filtered.sort(sortMap[__schoolSort]);
  
  var catLabel=__schoolCat!=='all'?'（'+CATS.filter(function(c){return c.k===__schoolCat;}).map(function(c){return c.l;})[0]+(__schoolSubCat!=='all'?' - '+getSubcatLabel(__schoolCat,__schoolSubCat):'')+'）':'';
  document.getElementById('schoolSub').textContent='共 '+filtered.length+' 所院校'+catLabel;
  // 未授权用户提示
  var schoolBanner=document.getElementById('schoolFreeBanner');
  if(schoolBanner){schoolBanner.classList.toggle('hidden',isPaidUser());}

  if(!filtered.length){
    document.getElementById('schoolList').innerHTML='<p style="text-align:center;color:var(--color-text-tertiary);padding:40px 0">暂无匹配院校</p>';
    return;
  }
  
  var html='';
  for(var i=0;i<filtered.length;i++){
    var s=filtered[i];
    var tags=[];
    if(s.is985)tags.push('<span class="tag tag-985">985</span>');
    if(s.is211)tags.push('<span class="tag tag-211">211</span>');
    if(s.isDoubleFirst)tags.push('<span class="tag tag-df">双一流</span>');
    if(s.isPrivate)tags.push('<span class="tag tag-pv">民办</span>');
    // 专业列表（压缩显示前4个）
    var majorNames=Object.keys(s.majorNames).sort(function(a,b){
      // 按 recordCount 降序
      var ac=0,bc=0;
      for(var j=0;j<s.records.length;j++){if(s.records[j].majorName===a)ac++;if(s.records[j].majorName===b)bc++;}
      return bc-ac;
    });
    var showMajors=majorNames.slice(0,4);
    var moreCount=majorNames.length-showMajors.length;
    var majorsHtml='';
    for(var j=0;j<showMajors.length;j++){majorsHtml+='<span>'+esc(showMajors[j])+'</span>';}
    if(moreCount>0)majorsHtml+='<span class="more">+ 还有 '+moreCount+' 个专业</span>';
    var schoolChecked=__schoolSel.has(s.schoolName);
    var info=window.getSchoolInfo?window.getSchoolInfo(s.schoolName):null;
    var infoHtml='';
    var infoBadge='';
    if(info){
      infoHtml='<div class="sch-info-section hidden">'+
        '<div class="sch-info-intro">'+esc(info.intro)+'</div>'+
        '<a class="sch-info-link" href="'+escAttr(info.web)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">🌐 访问官网 →</a>'+
      '</div>';
      infoBadge=' <span class="sch-info-badge" title="点击展开查看院校介绍和官网链接">ℹ️</span>';
    }
    // 未授权用户：隐藏院校介绍，点击卡片不展开详情
  var isPaidUserNow=isPaidUser();
  if(!isPaidUserNow){infoHtml='';infoBadge='';}
  html+='<div class="school-card" onclick="toggleSchoolCard(this,event)" data-school="'+escAttr(s.schoolName)+'"'+(isPaidUserNow?'':' style="cursor:default"')+'>'+
      '<div class="sch-cb" data-act="schSel" data-school="'+escAttr(s.schoolName)+'"><div class="cb-box'+(schoolChecked?' on':'')+'">'+(schoolChecked?'✓':'')+'</div></div>'+
      '<div class="sch-name">'+esc(s.schoolName)+infoBadge+' <span style="font-weight:400;font-size:.75rem">'+tags.join(' ')+'</span></div>'+
      '<div class="sch-meta">📍 '+esc(s.city||'--')+' | 💰 '+(s.tuitionMin?s.tuitionMin.toLocaleString():'--')+(s.tuitionMin!==s.tuitionMax?' ~ '+s.tuitionMax.toLocaleString():'')+'/年 | 📚 '+s.majorCount+'个专业</div>'+
      '<div class="sch-majors">'+majorsHtml+'</div>'+
      '<div class="sch-scores"><span>综合分区间 <strong>'+s.compositeMin+' ~ '+s.compositeMax+'</strong></span>'+'<span>均值 <strong>'+s.compositeAvg+'</strong></span></div>'+
      infoHtml+
      '<div class="sch-all-majors hidden" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--color-border)">'+majorNames.map(function(m){return '<span style="display:block;font-size:.74rem;padding:2px 0">'+esc(m)+'</span>';}).join('')+'</div>'+
    '</div>';
  }
  document.getElementById('schoolList').innerHTML=html;
  // 复选框事件
  document.getElementById('schoolList').onclick=function(e){
    var cb=e.target.closest('[data-act="schSel"]');
    if(!cb)return;
    var schoolName=cb.dataset.school;
    // 找到该学校的聚合数据
    var schoolData=null;
    for(var i=0;i<filtered.length;i++){if(filtered[i].schoolName===schoolName){schoolData=filtered[i];break;}}
    if(!schoolData)return;
    if(__schoolSel.has(schoolName)){
      // 取消勾选：移除该学校所有记录
      __schoolSel.delete(schoolName);
      for(var j=0;j<schoolData.records.length;j++){
        var r=schoolData.records[j];
        var key=(r.schoolCode||'')+'|'+(r.majorCode||'');
        sel.delete(key);
      }
    }else{
      // 勾选：添加该学校所有记录
      __schoolSel.add(schoolName);
      for(var j=0;j<schoolData.records.length;j++){
        var r=schoolData.records[j];
        var key=(r.schoolCode||'')+'|'+(r.majorCode||'');
        // 添加 tier 字段（浏览器来源默认稳妥档）
        r.tier=r.tier||'match';
        sel.set(key,r);
      }
    }
    updateFloat();
    // 重新渲染选中状态
    var allCbs=document.querySelectorAll('#schoolList [data-act="schSel"]');
    for(var k=0;k<allCbs.length;k++){
      var box=allCbs[k].querySelector('.cb-box');
      if(box){
        if(__schoolSel.has(allCbs[k].dataset.school)){box.classList.add('on');box.textContent='✓';}
        else{box.classList.remove('on');box.textContent='';}
      }
    }
  };
}

function filterSchoolCat(catKey){__schoolCat=catKey;renderSchoolBrowser();}

// 通用：更新院校/专业浏览中的城市下拉框
function updateBrowserCitySelect(prefix,records){
  var provinceSel=document.getElementById(prefix+'Province');
  var citySel=document.getElementById(prefix+'City');
  var provinceKey=provinceSel.value;
  if(provinceKey==='all'){
    citySel.style.display='none';
    citySel.innerHTML='<option value="all">不限城市</option>';
    return;
  }
  var cities=getCitiesByProvince(records,provinceKey);
  if(!cities.length){
    citySel.style.display='none';
    citySel.innerHTML='<option value="all">不限城市</option>';
    return;
  }
  citySel.style.display='';
  var html='<option value="all">不限城市（'+cities.length+'个）</option>';
  for(var i=0;i<cities.length;i++){
    var shortName=cities[i].name.replace(/^(浙江|江苏|上海|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|重庆|四川|贵州|云南|北京|天津|河北|山西|陕西|辽宁|吉林|黑龙江|内蒙古|新疆|宁夏|甘肃|青海|西藏)/,'');
    html+='<option value="'+escAttr(cities[i].name)+'">'+shortName+' ('+cities[i].cnt+')</option>';
  }
  citySel.innerHTML=html;
  // 恢复当前选中值
  if(prefix==='school')citySel.value=__schoolCity;
  else if(prefix==='major')citySel.value=__majorCity;
}

function toggleSchoolCard(card,event){
  // 未授权用户不允许展开院校详情
  if(!isPaidUser())return;
  // 如果点击的是复选框区域，不展开卡片
  if(event){
    var cbEl=event.target.closest('[data-act="schSel"]');
    if(cbEl)return;
  }
  card.classList.toggle('exp');
  var allMajors=card.querySelector('.sch-all-majors');
  if(allMajors)allMajors.classList.toggle('hidden');
  var infoSec=card.querySelector('.sch-info-section');
  if(infoSec){
    infoSec.classList.toggle('hidden');
    if(!infoSec.classList.contains('hidden')){
      setTimeout(function(){infoSec.scrollIntoView({behavior:'smooth',block:'nearest'});},100);
    }
  }
}

// ===== 专业浏览 =====
var __majorCat='all',__majorSubCat='all',__selectedMajor=null;
var __majorProvince='all',__majorCity='all'; // 省份/城市筛选
var __majorTierMap=null; // 一键填报冲稳保标记 {schoolCode|majorCode: tier}
function renderMajorBrowser(catKey){
  if(catKey!==undefined){__majorCat=catKey;__selectedMajor=null;__majorSubCat='all';__majorTierMap=null;var layout=document.querySelector('.major-layout');if(layout)layout.classList.remove('expanded');}
  var all=getAllRecords();
  if(__majorCat!=='all')all=all.filter(function(r){return r.catKey===__majorCat;});
  // 子门类筛选
  if(__majorCat!=='all'&&__majorSubCat!=='all'){
    all=filterBySubcat(all,__majorSubCat);
  }
  // 省份/城市筛选
  all=filterByProvince(all,__majorProvince);
  all=filterByCity(all,__majorCity);
  // ===== 专业名归一化：将 all 中的 majorName 替换为规范名，合并同类专业 =====
  // 仅做浅拷贝（不修改原始 data.js 数据），归一化仅在展示层生效
  var allNorm=all.map(function(r){
    var cn=normMajorName(r.majorName);
    if(!cn)return null; // 脏数据过滤
    if(cn===r.majorName)return r; // 名称无变化，直接用原对象节省内存
    var nr=Object.assign({},r);
    nr.majorName=cn;
    nr._origMajorName=r.majorName; // 保留原始名，供详情展示用
    return nr;
  }).filter(Boolean); // 去掉脏数据（null）
  var majors=aggregateByMajor(allNorm);

  // 省份/城市变更时，同步更新已选专业的数据（否则右侧面板仍显示旧数据）
  if(__selectedMajor){
    var found=false;
    for(var i=0;i<majors.length;i++){
      if(majors[i].majorName===__selectedMajor.majorName){
        __selectedMajor=majors[i];
        found=true;
        break;
      }
    }
    if(!found)__selectedMajor=null;
  }

  // 未授权用户限制：专业浏览仅显示前5个专业
  if(!isPaidUser()&&majors.length>5){
    majors=majors.slice(0,5);
  }

  // 门类 tab
  var tabsHtml='<button class="'+(__majorCat==='all'?'on':'')+'" data-t="all">全部</button>';
  for(var i=0;i<CATS.length;i++){
    var c=CATS[i];
    tabsHtml+='<button class="'+(__majorCat===c.k?'on':'')+'" data-t="'+c.k+'">'+c.i+' '+c.l+'</button>';
  }
  document.getElementById('majorCatTabs').innerHTML=tabsHtml;
  document.getElementById('majorCatTabs').onclick=function(e){
    if(e.target.tagName==='BUTTON'){renderMajorBrowser(e.target.dataset.t);}
  };

  // 子门类 tab
  var subCatContainer=document.getElementById('majorSubCatTabs');
  var subcats=getSubcats(__majorCat);
  if(subcats.length&&__majorCat!=='all'){
    var subHtml='<button class="'+(__majorSubCat==='all'?'on':'')+'" data-st="all">全部</button>';
    for(var i=0;i<subcats.length;i++){
      var sc=subcats[i];
      subHtml+='<button class="'+(__majorSubCat===sc.k?'on':'')+'" data-st="'+sc.k+'">'+sc.i+' '+sc.l+'</button>';
      if(sc.children){
        for(var j=0;j<sc.children.length;j++){
          var ch=sc.children[j];
          subHtml+='<button class="'+(__majorSubCat===ch.k?'on':'')+'" data-st="'+ch.k+'" style="font-size:.78rem">'+ch.i+' '+ch.l+'</button>';
        }
      }
    }
    subCatContainer.innerHTML=subHtml;
    subCatContainer.style.display='flex';
    subCatContainer.onclick=function(e){
      if(e.target.tagName==='BUTTON'){__majorSubCat=e.target.dataset.st;renderMajorBrowser();}
    };
  }else{
    subCatContainer.innerHTML='';
    subCatContainer.style.display='none';
  }

  // 省份/城市筛选控件初始化
  var mpSel=document.getElementById('majorProvince');
  var mcSel=document.getElementById('majorCity');
  if(!mpSel.dataset.init){
    var mpHtml='<option value="all">不限省份</option>';
    for(var pi=0;pi<PROVINCES.length;pi++){mpHtml+='<option value="'+PROVINCES[pi].k+'">'+PROVINCES[pi].i+' '+PROVINCES[pi].l+'</option>';}
    mpSel.innerHTML=mpHtml;
    mpSel.dataset.init='1';
    mpSel.onchange=function(){
      __majorProvince=this.value;
      __majorCity='all';
      __majorTierMap=null;
      __selectedMajor=null;
      var layout=document.querySelector('.major-layout');if(layout)layout.classList.remove('expanded');
      updateBrowserCitySelect('major',all);
      renderMajorBrowser();
    };
    mcSel.onchange=function(){
      __majorCity=this.value;
      __majorTierMap=null;
      __selectedMajor=null;
      var layout=document.querySelector('.major-layout');if(layout)layout.classList.remove('expanded');
      renderMajorBrowser();
    };
  }
  mpSel.value=__majorProvince;
  updateBrowserCitySelect('major',all);

  // 左侧专业列表
  var leftHtml='';
  if(!majors.length){
    leftHtml='<p style="text-align:center;color:var(--color-text-tertiary);padding:20px">暂无数据</p>';
  }
  for(var i=0;i<majors.length;i++){
    var m=majors[i];
    var selClass=__selectedMajor&&__selectedMajor.majorName===m.majorName?' sel':'';
    leftHtml+='<div class="ml-item'+selClass+'" onclick="selectMajor(\''+escAttr(m.majorName)+'\')"><span>'+esc(m.majorName)+'</span><span class="ml-count">'+m.schoolCount+'校</span></div>';
  }
  document.getElementById('majorLeft').innerHTML=leftHtml;
  // 未授权用户提示
  var majorBanner=document.getElementById('majorFreeBanner');
  if(majorBanner){majorBanner.classList.toggle('hidden',isPaidUser());}

  // 右侧详情
  if(__selectedMajor && __selectedMajor.records.length>0){
    var m=__selectedMajor;
    // 一键填报按钮：体验版和完整版均可用（但完整版卡片展示更详细）
    var recBarHtml='<div class="mr-rec-bar" id="majorRecBar">我的综合分 <input type="number" id="majorRecScore" placeholder="如 520" style="width:90px;padding:4px 8px;border-radius:6px;border:1px solid var(--color-border);font-size:.85rem;margin:0 6px"> <button class="btn btn-sm" onclick="recommendMajorSchools()" style="font-size:.82rem">🤖 一键填报</button> <span id="majorRecLoginTip" class="hidden" style="font-size:.78rem;color:var(--color-accent);margin-left:8px">请先登录</span></div>';
    var rightHtml='<button class="mr-back" onclick="collapseMajorLayout()">← 返回专业列表</button><div class="mr-header"><h4 style="cursor:pointer"'+(isPaidUser()?' onclick="openMajorDetail(\''+escAttr(m.majorName)+'\')"':'')+'>📚 '+esc(m.majorName)+(isPaidUser()?' <span style="font-size:.68rem;color:var(--color-accent)">📈 查看详情</span>':'')+'</h4><div class="mr-stats">开设院校：<strong>'+m.schoolCount+'</strong> 所 | 综合分区间：<strong>'+m.scoreMin+' ~ '+m.scoreMax+'</strong> | 均值：<strong>'+m.scoreAvg+'</strong> | 平均学费：<strong>'+(m.tuitionAvg||'--').toLocaleString()+'</strong>/年</div></div>'+recBarHtml;
    rightHtml+='<div class="mr-schools">';
    var ranked=m.records;

    // ===== 一键填报后：三列冲稳保视图 =====
    if(__majorTierMap && isPaidUser()){
      // 三列模式：直接用原始 records，不做 schoolName 去重
      // （tierMap key 是 schoolCode|majorCode，去重会导致 key 对不上）
      var tierGroups={reach:[],match:[],safety:[]};
      for(var i=0;i<ranked.length;i++){
        var r=ranked[i];
        var rk=(r.schoolCode||'')+'|'+(r.majorCode||'');
        var t=__majorTierMap[rk]||'out';
        if(tierGroups[t])tierGroups[t].push(r);
      }
      // 同梯度内按综合分降序
      ['reach','match','safety'].forEach(function(t){
        tierGroups[t].sort(function(a,b){return (b.compositeScore||0)-(a.compositeScore||0);});
      });
      // 计算用户输入分数（从输入框里读，若没有用0）
      var inputScore=parseFloat((document.getElementById('majorRecScore')||{}).value)||0;
      function buildTierColCards(list,tier){
        if(!list.length)return '<div class="mr-tier-col-empty">暂无院校</div>';
        var h='';
        for(var i=0;i<list.length;i++){
          var r=list[i];
          var rk=(r.schoolCode||'')+'|'+(r.majorCode||'');
          var isChecked=sel.has(rk);
          var diffVal=inputScore>0?inputScore-r.compositeScore:null;
          var diffHtml='';
          if(diffVal!==null){
            if(diffVal>=0) diffHtml='<span class="mr-tier-card-diff-up">↑ 高 '+Math.abs(diffVal).toFixed(1)+' 分</span>';
            else diffHtml='<span class="mr-tier-card-diff-dn">↓ 低 '+Math.abs(diffVal).toFixed(1)+' 分</span>';
          }
          var tagHtml='';
          if(r.is985)tagHtml+='<span class="tag tag-985">985</span>';
          if(r.is211&&!r.is985)tagHtml+='<span class="tag tag-211">211</span>';
          // 卡片：左侧复选框 + 中间内容（可点击详情） + 右侧详情按钮
          h+='<div class="mr-tier-card'+(isChecked?' sel':'')+'">';
          // 复选框区域（独立点击，不触发详情）
          h+='<div class="mr-tier-card-cb" data-act="majSel" data-key="'+escAttr(rk)+'"><div class="cb-box'+(isChecked?' on':'')+'">'+( isChecked?'✓':'')+'</div></div>';
          // 内容区（点击打开院校详情）
          h+='<div class="mr-tier-card-body" data-act="majDetail" data-school="'+escAttr(r.schoolName)+'" data-key="'+escAttr(rk)+'">';
          h+='<div class="mr-tier-card-row1">';
          h+='<div class="mr-tier-card-name">'+esc(r.schoolName)+(tagHtml?' '+tagHtml:'')+'</div>';
          h+='<div class="mr-tier-card-score">'+r.compositeScore+'</div>';
          h+='</div>';
          h+='<div class="mr-tier-card-row2">';
          h+='<span>📍 '+esc(r.city||'--')+'</span>';
          if(diffHtml)h+=diffHtml;
          if(r.plan25)h+='<span>📋 '+r.plan25+'人</span>';
          h+='</div>';
          h+='</div>';
          // 详情箭头按钮
          h+='<div class="mr-tier-card-arrow" data-act="majDetail" data-school="'+escAttr(r.schoolName)+'" data-key="'+escAttr(rk)+'">›</div>';
          h+='</div>';
        }
        return h;
      }
      rightHtml+='</div>'; // 关闭 mr-schools（空）
      // ===== 三列视图：写入悬浮面板 #tierOverlay，不在 majorRight 内渲染 =====
      var tierCfg=[
        {key:'reach',cls:'col-reach',label:'🔴 冲刺'},
        {key:'match',cls:'col-match',label:'🟡 稳妥'},
        {key:'safety',cls:'col-safety',label:'🟢 保底'}
      ];
      var colsHtml='';
      for(var ti=0;ti<tierCfg.length;ti++){
        var tc=tierCfg[ti];
        var tList=tierGroups[tc.key];
        colsHtml+='<div class="mr-tier-col '+tc.cls+'">';
        colsHtml+='<div class="mr-tier-col-head"><span class="mr-tier-col-title">'+tc.label+'</span><span class="mr-tier-col-cnt">'+tList.length+' 所</span></div>';
        colsHtml+='<div class="mr-tier-col-body">'+buildTierColCards(tList,tc.key)+'</div>';
        colsHtml+='</div>';
      }
      // 注入悬浮面板内容并显示
      var _overlay=document.getElementById('tierOverlay');
      if(_overlay){
        document.getElementById('tierPanelMajor').textContent='📚 '+m.majorName;
        var totalTier=tierGroups.reach.length+tierGroups.match.length+tierGroups.safety.length;
        document.getElementById('tierPanelSub').textContent='共 '+totalTier+' 所院校匹配';
        document.getElementById('tierColsInner').innerHTML=colsHtml;
        // 初始化选中状态
        _syncTierSelCount(sel);
        _overlay.classList.remove('hidden');
      }
      // 在 majorRight 里放一个入口提示按钮（点击可重新打开）
      rightHtml+='<div style="text-align:center;padding:24px 0"><button class="btn btn-g" onclick="document.getElementById(\'tierOverlay\').classList.remove(\'hidden\')">📊 查看冲稳保院校分析</button><div style="font-size:.76rem;color:#999;margin-top:6px">已为您找到 '+(tierGroups.reach.length+tierGroups.match.length+tierGroups.safety.length)+' 所匹配院校</div></div>';
    } else {
      // ===== 普通列表模式（未填报或体验版） =====
      // 普通列表按 schoolName 去重（同一学校只显示一次）
      var seenN={},dedup=[];
      for(var i=0;i<ranked.length;i++){
        if(!seenN[ranked[i].schoolName]){seenN[ranked[i].schoolName]=true;dedup.push(ranked[i]);}
      }
      // 未授权用户只看前5所
      if(!isPaidUser()&&dedup.length>5){dedup=dedup.slice(0,5);}
      // 按冲稳保排序（若有 tierMap）
      var tierOrd={reach:0,match:1,safety:2,out:3};
      if(__majorTierMap){
        dedup.sort(function(a,b){
          var ta=tierOrd[__majorTierMap[(a.schoolCode||'')+'|'+(a.majorCode||'')]]||99;
          var tb=tierOrd[__majorTierMap[(b.schoolCode||'')+'|'+(b.majorCode||'')]]||99;
          if(ta!==tb)return ta-tb;
          return (b.compositeScore||0)-(a.compositeScore||0);
        });
      }
      var lastTierLabel='';
      for(var i=0;i<dedup.length;i++){
        var r=dedup[i];
        var tags=[];
        var recKey=(r.schoolCode||'')+'|'+(r.majorCode||'');
        var curTierLabel='';
        if(__majorTierMap&&__majorTierMap[recKey]){
          var tierTag=__majorTierMap[recKey];
          curTierLabel=tierTag;
          var tierLabel=tierTag==='reach'?'🔴 冲刺':tierTag==='match'?'🟡 稳妥':tierTag==='safety'?'🟢 保底':'';
          if(tierLabel)tags.push('<span class="tag tag-tier tag-tier-'+tierTag+'">'+tierLabel+'</span>');
          if(curTierLabel!==lastTierLabel){
            var tierCount=dedup.filter(function(x){return __majorTierMap[(x.schoolCode||'')+'|'+(x.majorCode||'')]===curTierLabel;}).length;
            var tierTitle=curTierLabel==='reach'?'🔴 冲刺志愿':curTierLabel==='match'?'🟡 稳妥志愿':curTierLabel==='safety'?'🟢 保底志愿':'其他';
            rightHtml+='<div class="mr-tier-header">'+tierTitle+'<span class="mr-tier-count">'+tierCount+' 所</span></div>';
            lastTierLabel=curTierLabel;
          }
        }
        if(r.is985)tags.push('<span class="tag tag-985">985</span>');
        if(r.is211)tags.push('<span class="tag tag-211">211</span>');
        if(r.isDoubleFirst)tags.push('<span class="tag tag-df">双一流</span>');
        if(r.isPrivate)tags.push('<span class="tag tag-pv">民办</span>');
        var recChecked=sel.has(recKey);
        rightHtml+='<div class="mr-school'+(__majorTierMap&&__majorTierMap[recKey]?' mr-school-tier-'+__majorTierMap[recKey]:'')+'"><div class="mr-cb" data-act="majSel" data-key="'+escAttr(recKey)+'"><div class="cb-box'+(recChecked?' on':'')+'">'+(recChecked?'✓':'')+'</div></div><span class="mr-rank">'+(i+1)+'</span><div class="mr-info"><div class="mr-sname">'+esc(r.schoolName)+' '+tags.join(' ')+'</div><div class="mr-smeta">📍 '+esc(r.city||'--')+' | 💰 '+(typeof r.tuition=='number'?r.tuition.toLocaleString():r.tuition||'--')+'/年'+(r.plan25?' | 📋 '+r.plan25+'人':'')+(r.rankPosition?' | 🏅 位次 '+r.rankPosition:'')+'</div></div><span class="mr-score">'+r.compositeScore+'</span></div>';
      }
      rightHtml+='</div>'; // 关闭 mr-schools
    }
    document.getElementById('majorRight').innerHTML=rightHtml;
    // 一键填报栏：未登录时隐藏表单，显示登录提示
    var barEl=document.getElementById('majorRecBar');
    if(barEl)barEl.classList.toggle('hidden',!__isLoggedIn);
    var tipEl=document.getElementById('majorRecLoginTip');
    if(tipEl)tipEl.classList.toggle('hidden',__isLoggedIn);
    // 事件路由：复选框 / 院校详情（同时覆盖 majorRight 和 tierOverlay）
    function _handleMajorClick(e){
      // --- 优先检查：复选框区域（.mr-tier-card-cb 或普通列表 .mr-cb）---
      var cb=e.target.closest('[data-act="majSel"]');
      if(cb){
        var key=cb.dataset.key;
        if(sel.has(key)){
          sel.delete(key);
        }else{
          var found=null;
          // 从 ranked（原始完整数据）查找，兼容三列模式和普通列表模式
          for(var i=0;i<ranked.length;i++){
            var dk=(ranked[i].schoolCode||'')+'|'+(ranked[i].majorCode||'');
            if(dk===key){found=ranked[i];break;}
          }
          if(found){found.tier=found.tier||'match';sel.set(key,found);}
        }
        updateFloat();
        // 同步两个容器内所有匹配 key 的复选框 UI
        var allCbs=document.querySelectorAll('#majorRight [data-act="majSel"], #tierColsInner [data-act="majSel"]');
        for(var k=0;k<allCbs.length;k++){
          var thisKey=allCbs[k].dataset.key;
          if(thisKey!==key)continue;
          var box=allCbs[k].querySelector('.cb-box');
          if(box){
            if(sel.has(thisKey)){box.classList.add('on');box.textContent='✓';}
            else{box.classList.remove('on');box.textContent='';}
          }
          var card=allCbs[k].closest('.mr-tier-card');
          if(card){
            if(sel.has(thisKey))card.classList.add('sel');
            else card.classList.remove('sel');
          }
        }
        _syncTierSelCount(sel);
        return;
      }
      // --- 院校详情：内容区或箭头按钮 ---
      var detail=e.target.closest('[data-act="majDetail"]');
      if(detail){
        var schoolName=detail.dataset.school;
        if(schoolName)showMajorSchoolDetail(schoolName,detail.dataset.key,ranked);
        return;
      }
    }
    document.getElementById('majorRight').onclick=_handleMajorClick;
    var _tierOverlayEl=document.getElementById('tierOverlay');
    if(_tierOverlayEl){
      // 点击遮罩背景（非面板区）关闭
      _tierOverlayEl.onclick=function(e){
        if(e.target===_tierOverlayEl)_tierOverlayEl.classList.add('hidden');
        else _handleMajorClick(e);
      };
    }
  }else{
    document.getElementById('majorRight').innerHTML='<p style="text-align:center;color:var(--color-text-tertiary);padding:60px 20px">👈 请从左侧选择一个专业</p>';
  }
}

// ===== 专业浏览 · 三列卡片院校详情弹窗 =====
// ===== 同步悬浮面板底部已选数 =====
function _syncTierSelCount(sel){
  var countEl=document.getElementById('tierSelCount');
  var btnEl=document.getElementById('tierGenForm');
  var n=sel?sel.size:0;
  if(countEl)countEl.textContent=n;
  if(btnEl)btnEl.style.display=n>0?'':'none';
}

// ===== 专业名称归一化映射表 =====
// 将同类异名（如"视觉传达"、"视觉传达设计(中外合作办学)"等）统一为规范名
// 规则：保留原始数据不变，仅在展示/筛选层做映射
var __majorNormMap = {
  // 视觉传达设计 类
  "视觉传达":"视觉传达设计","视觉传达设计(中外合作办学)":"视觉传达设计",
  "视觉传达设计(中外合作办学)（中美合作）":"视觉传达设计","视觉传达设计（中韩2+2学分互认班）":"视觉传达设计",
  "视觉传达设计（中德2+2双学位班）":"视觉传达设计","视觉传达设计（全英语教学）":"视觉传达设计",
  "视觉传达设计（广告方向）":"视觉传达设计","视觉传达设计（影视美术设计）":"视觉传达设计",
  "视觉传达设计（中外合作）":"视觉传达设计","视觉传达设计(中外高水平大学学生交流计划)":"视觉传达设计",
  "艺术设计（视觉传达）":"视觉传达设计",
  // 环境设计 类
  "环境艺术设计":"环境设计","环境设计(中外合作办学)":"环境设计",
  "环境设计(中外合作办学)（中英合作）":"环境设计","环境设计（景观设计）":"环境设计",
  "环境设计（园林艺术设计）":"环境设计","环境设计（室内设计）":"环境设计",
  "环境设计（双语教学）":"环境设计","环境设计（中外合作）":"环境设计",
  "室内艺术设计":"环境设计","环境设计(中外高水平大学学生交流计划)":"环境设计",
  "环境设计（泰豪）":"环境设计",
  // 数字媒体艺术 类
  "数字媒体艺术设计":"数字媒体艺术","数字媒体艺术(中外合作办学)":"数字媒体艺术",
  "数字媒体艺术(中外合作办学)（中法合作）":"数字媒体艺术","数字媒体艺术设计(中外合作办学)":"数字媒体艺术",
  "数字媒体艺术（VR艺术设计）":"数字媒体艺术","数字媒体艺术（泰豪）":"数字媒体艺术",
  "数字媒体艺术（双语班）":"数字媒体艺术","数字媒体艺术（中外合作办学）":"数字媒体艺术",
  // 产品设计 类
  "产品艺术设计":"产品设计","产品设计(中外合作办学)":"产品设计",
  "产品设计（珠宝首饰设计）":"产品设计","产品设计（应用设计方向）":"产品设计",
  "产品设计（设计商学）":"产品设计","产品设计（文创产品方向）":"产品设计",
  "产品设计（展示设计）":"产品设计","产品设计（中外合作）":"产品设计",
  "产品设计（中外合作办学）":"产品设计","产品艺术设计（中外合作办学）":"产品设计",
  "艺术设计（产品设计）":"产品设计","产品设计（产品、家居用品）":"产品设计",
  "产品设计（纺织品艺术设计）":"产品设计",
  // 服装与服饰设计 类
  "服装设计":"服装与服饰设计","服装与服饰设计(中外合作办学)":"服装与服饰设计",
  "服装与服饰设计(中外合作办学)（中法合作）":"服装与服饰设计","服装与服饰设计(中外合作办学)（中美合作）":"服装与服饰设计",
  "服装与服饰设计(中外合作办学)（中英合作）":"服装与服饰设计","服装与服饰设计(中外合作办学)（中日合作）":"服装与服饰设计",
  "服装与服饰设计（双语教学）":"服装与服饰设计","服装与服饰设计（中外合作办学）":"服装与服饰设计",
  "服装与服饰设计（中外合作专业）":"服装与服饰设计","服装与服饰设计（服装设计、服装展示设计、鞋靴设计）":"服装与服饰设计",
  "服装与服饰设计（戏曲服装设计）":"服装与服饰设计",
  // 动画 类
  "动画(中外合作办学)":"动画","动画（漫插画）":"动画","动画（数字媒体）":"动画",
  "动画（日语国际课程班）":"动画","动漫设计":"动画","影视动画":"动画",
  "影视动画（高本贯通）":"动画","影视动画（高本贯通1）":"动画","动画（泰豪）":"动画",
  // 播音与主持艺术 类
  "播音与主持":"播音与主持艺术","播音与主持艺术（中英双语）":"播音与主持艺术",
  "播音与主持（高本贯通）":"播音与主持艺术","播音与主持（电子竞技方向）":"播音与主持艺术",
  // 音乐学 类
  "音乐学(师范)":"音乐学","音乐学（师范）":"音乐学","音乐学（声乐）":"音乐学",
  "音乐学（器乐）":"音乐学","音乐学（器乐）(师范)":"音乐学","音乐学（声乐）(师范)":"音乐学",
  "音乐学（理论）(师范)":"音乐学","音乐学（理论）":"音乐学","音乐学(中外合作办学)":"音乐学",
  "音乐学(中外合作办学)(师范)":"音乐学","音乐学（中外合作办学）":"音乐学",
  "音乐学（声乐主项）(师范)":"音乐学","音乐学（声乐表演）":"音乐学","音乐学（数字音乐制作方向）":"音乐学",
  "音乐学（艺术与设计学院）":"音乐学","音乐学（昌新国际艺术学院）":"音乐学","音乐学（音乐理论研究）":"音乐学",
  "音乐学（钢琴主项）(师范)":"音乐学","音乐学（音教）(师范)":"音乐学","音乐学（电影声效方向）":"音乐学",
  "音乐学（音乐传播）":"音乐学","音乐学（笙）":"音乐学","音乐学（声乐方向）(师范)":"音乐学",
  "音乐学（琵琶）":"音乐学","音乐学（大提琴，民乐方向）":"音乐学","音乐学（低音提琴，民乐方向）":"音乐学",
  "音乐学（中提琴）":"音乐学","音乐学（低音提琴）":"音乐学",
  "音乐学(中外合作办学)（声乐）(师范)":"音乐学","音乐学(中外合作办学)（器乐）(师范)":"音乐学",
  "音乐教育":"音乐学","音乐教育(师范)":"音乐学",
  // 音乐表演 类
  "音乐表演（声乐）":"音乐表演","音乐表演（器乐）":"音乐表演","音乐表演（钢琴）":"音乐表演",
  "音乐表演（小提琴）":"音乐表演","音乐表演（低音提琴）":"音乐表演","音乐表演（声乐演唱）":"音乐表演",
  "音乐表演（中外合作办学）":"音乐表演","音乐表演(中外合作办学)":"音乐表演","音乐表演（流行演唱）":"音乐表演",
  "音乐表演（演唱）":"音乐表演","音乐表演（声乐方向）":"音乐表演","音乐表演（钢琴演奏）":"音乐表演",
  "音乐表演（美声）":"音乐表演","音乐表演（民声）":"音乐表演","音乐表演（二胡）":"音乐表演",
  "音乐表演（流行制作与创作）":"音乐表演","音乐表演（钢琴方向）":"音乐表演","音乐表演（弦乐大类）":"音乐表演",
  "音乐表演（大提琴）":"音乐表演","音乐表演（管乐及打击乐大类）":"音乐表演","音乐表演（乐队指挥）":"音乐表演",
  "音乐表演（西洋弦乐）":"音乐表演","音乐表演（中提琴）":"音乐表演","音乐表演（古筝）":"音乐表演",
  "音乐表演（器乐方向）":"音乐表演","音乐表演（民族唱法、美声唱法）":"音乐表演","音乐表演（声乐美声）":"音乐表演",
  "音乐表演（现代音乐唱作）":"音乐表演","音乐表演（管乐与乐队训练）":"音乐表演","音乐表演（民族弹拨乐）":"音乐表演",
  "音乐表演（古典吉他、古典萨克斯管）":"音乐表演","音乐表演（流行器乐、爵士器乐）":"音乐表演",
  "音乐表演（合唱）":"音乐表演","音乐表演（民族声乐）":"音乐表演","音乐表演（键盘演奏）":"音乐表演",
  "音乐表演（演唱方向）":"音乐表演","音乐表演(中外合作办学)（器乐）":"音乐表演","音乐表演（中外合作办学）（声乐）":"音乐表演",
  "流行音乐":"音乐表演","流行音乐（流行演唱）":"音乐表演","流行音乐（流行器乐）":"音乐表演",
  "流行音乐（流行演唱、爵士演唱、现代音乐制作）":"音乐表演","现代流行音乐":"音乐表演","现代流行音乐（流行演奏）":"音乐表演",
  "作曲与作曲技术理论":"音乐表演","作曲与作曲技术理论（音乐制作）":"音乐表演","作曲与作曲技术理论（视唱练耳）":"音乐表演",
  "录音艺术":"音乐表演","录音技术与艺术":"音乐表演","钢琴调律":"音乐表演",
  "音乐剧":"音乐表演","音乐剧表演":"音乐表演","音乐治疗":"音乐表演","音乐治疗（器乐）":"音乐表演",
  // 美术学 类
  "美术学(师范)":"美术学","美术学（师范）":"美术学","美术学（商业插画）":"美术学",
  "美术学（史论）":"美术学","美术学（美教）(师范)":"美术学","美术学（美术史论）":"美术学",
  "美术学师范":"美术学","美术学(中外合作办学)(师范)":"美术学","美术学(中外合作办学)":"美术学",
  "美术学教育":"美术学","美术学（中外合作办学）":"美术学","美术学（教育方向）":"美术学",
  "美术教育":"美术学","美术教育(师范)":"美术学",
  // 绘画 类
  "绘画（壁画）":"绘画","中国画":"绘画","中国画(师范)":"绘画","漫画":"绘画",
  // 摄影 类
  "摄影与摄像艺术":"摄影","摄影（无人机航拍，图片）":"摄影","摄影（影视摄影）":"摄影",
  "摄影，昆明":"摄影","摄影（影视摄影、图片摄影、无人机航拍）":"摄影",
  "影视摄影与制作":"摄影","影视摄影与制作（电影特效方向）":"摄影","影视摄影与制作（虚拟制作）":"摄影",
  "影视摄影与制作（中外合作办学）":"摄影","影视摄影与制作(中外合作办学)":"摄影",
  "影视摄影与制作（电影导演方向）":"摄影","影视多媒体技术":"摄影",
  // 表演 类
  "戏剧影视表演":"表演","表演艺术":"表演","表演（服装表演）":"表演","表演（影视表演）":"表演",
  "表演（服饰表演与推广）":"表演","表演（影视戏剧）":"表演","表演（舞台影视表演）":"表演",
  "表演（时装表演艺术）":"表演","表演（时尚演艺）":"表演","表演（服装表演方向）":"表演",
  "表演（服装表演与设计）":"表演","表演（模特表演）":"表演","表演（时尚演艺方向）":"表演",
  "表演（影视与话剧表演）":"表演","表演（歌舞剧）":"表演","表演（影视表演方向）":"表演",
  "表演（电影电视表演）":"表演","表演艺术（影视表演）":"表演","表演艺术（电影电视表演）":"表演",
  "戏剧影视表演（音乐戏剧）":"表演","时尚表演与传播":"表演",
  // 舞蹈学 类
  "舞蹈学(师范)":"舞蹈学","舞蹈学（国际标准舞）":"舞蹈学","舞蹈学（中国舞）":"舞蹈学",
  "舞蹈学（教育）":"舞蹈学","舞蹈学(中国舞芭蕾舞方向，师范)":"舞蹈学",
  "舞蹈教育":"舞蹈学","舞蹈教育(师范)":"舞蹈学","舞蹈编导":"舞蹈学","舞蹈编导(师范)":"舞蹈学",
  // 舞蹈表演 类
  "舞蹈表演（国际标准舞）":"舞蹈表演","流行舞蹈":"舞蹈表演","流行舞蹈（街舞）":"舞蹈表演",
  "流行舞蹈（国际标准舞）":"舞蹈表演","舞蹈表演（中国古典舞、中国民族民间舞）":"舞蹈表演",
  "舞蹈表演(中外合作办学)":"舞蹈表演","舞蹈表演(中国舞，芭蕾舞，现代舞)":"舞蹈表演",
  "舞蹈表演（中国舞表演）":"舞蹈表演","舞蹈表演（爵士舞街舞":"舞蹈表演","舞蹈表演（体育舞蹈）":"舞蹈表演",
  // 戏剧影视美术设计 类
  "戏剧影视美术设计（舞台灯光设计）":"戏剧影视美术设计","戏剧影视美术设计（舞台服装与化装设计）":"戏剧影视美术设计",
  "戏剧影视美术设计（戏曲舞台设计）":"戏剧影视美术设计","戏剧影视美术设计（妆扮方向）":"戏剧影视美术设计",
  "戏剧影视美术设计（化妆服装）":"戏剧影视美术设计","戏剧影视美术设计（舞台设计）":"戏剧影视美术设计",
  "戏剧影视美术设计（戏曲数智影像设计）":"戏剧影视美术设计","戏剧影视美术设计（戏曲数字演艺设计）":"戏剧影视美术设计",
  // 工艺美术 类
  "工艺美术品设计":"工艺美术","陶瓷艺术设计":"工艺美术","首饰设计与工艺":"工艺美术",
  "纤维艺术":"工艺美术","玉器设计与工艺":"工艺美术",
  // 公共艺术 类
  "公共艺术设计":"公共艺术","公共艺术(中外合作办学)":"公共艺术","广告艺术设计":"公共艺术",
  // 书法学 类
  "书法学(师范)":"书法学","书法学（书法教育）":"书法学",
  "书画艺术":"书法学","书画艺术（书法）":"书法学","书画艺术（书法方向）":"书法学",
  // 艺术设计学 类
  "艺术设计":"艺术设计学","艺术设计学(中外合作办学)":"艺术设计学",
  "艺术设计（中外合作办学）":"艺术设计学","艺术设计学（数字展示设计、建筑景观设计）":"艺术设计学",
  // 新媒体艺术 类
  "跨媒体艺术":"新媒体艺术","数字影像设计":"新媒体艺术","科技艺术":"新媒体艺术",
  "实验艺术":"新媒体艺术","实验艺术（艺术与电子信息科技联合学士学位项目）":"新媒体艺术",
  // 艺术与科技 类
  "艺术与科技(中外合作办学)":"艺术与科技","艺术与科技（中德2+2双学位班）":"艺术与科技",
  "艺术与科技（中外合作办学）":"艺术与科技","艺术与科技（AI智能设计）":"艺术与科技",
  "艺术与科技（交互设计）":"艺术与科技","艺术与科技（电子竞技运营与设计）":"艺术与科技",
  "艺术与科技（乐音与健康）":"艺术与科技",
  // 设计学类（多专业大类，统一归为"设计学类"）
  "设计学类（视觉传达设计、环境设计）":"设计学类","设计学类（视觉传达设计、环境设计、产品设计）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、产品设计）":"设计学类","设计学类（含视觉传达设计、环境设计、产品设计专业）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、产品设计专业)":"设计学类","设计学类（含视觉传达设计、环境设计、产品设计、数字媒体艺术专业）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、数字媒体艺术专业）":"设计学类","设计学类（含视觉传达设计、环境设计专业）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、数字媒体艺术）":"设计学类","设计学类（含视觉传达，数字媒体）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、产品设计、服装与服饰设计、数字媒体艺术专业）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、服装与服饰设计专业）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、公共艺术、数字媒体艺术专业。）":"设计学类",
  "设计学类（含视觉传达设计、产品设计、环境设计专业）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、产品设计、工艺美术专业）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、产品设计、服装与服饰设计、公共艺术和动画专业）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、产品设计、数字媒体艺术、艺术与科技）":"设计学类",
  "设计学类（含产品设计、数字媒体艺术专业）":"设计学类","设计学类（含产品设计、环境设计、视觉传达设计）":"设计学类",
  "设计学类（含产品设计、环境设计、视觉传达设计和数字媒体艺术）":"设计学类",
  "设计学类（含产品设计、视觉传达设计、环境设计专业）":"设计学类",
  "设计学类（含产品设计、工艺美术、数字媒体艺术、环境设计、视觉传达设计）":"设计学类",
  "设计学类（含产品设计、视觉传达设计、环境设计专业）":"设计学类",
  "设计学类（含视觉传达设计、环境设计、产品设计、服装与服饰设计、公共艺术和动画专业）":"设计学类",
  "设计学类（含环境设计、视觉传达设计、产品设计、数字媒体艺术）":"设计学类",
  "设计学类（含环境设计、视觉传达设计）":"设计学类","设计学类（含环境设计、视觉传达设计、数字媒体艺术）":"设计学类",
  "设计学类（含环境设计、公共艺术、视觉传达设计、数字媒体艺术专业。）":"设计学类",
  "设计学类（含环境设计、艺术与科技专业）":"设计学类",
  "设计学类（含艺术设计学、数字媒体艺术、环境设计、产品设计专业）":"设计学类",
  "设计学类（视觉传达设计、产品设计）":"设计学类","设计学类（视觉传达设计、公共艺术、产品设计、环境设计）":"设计学类",
  "设计学类（视觉传达设计、服装与服饰设计）":"设计学类","设计学类（视觉传达设计、绘画）":"设计学类",
  "设计学类（视觉传达设计、环境设计、产品设计、艺术与科技、数字媒体艺术）":"设计学类",
  "设计学类（视觉传达设计、环境设计、数字媒体艺术）":"设计学类",
  "设计学类（视觉传达设计、环境设计、服装与服饰设计":"设计学类",
  "设计学类（视觉传达设计，环境设计，产品设计，服装与服饰设计）":"设计学类",
  "设计学类（视觉传达设计；环境设计；产品设计；数字媒体艺术；服装与服饰设计；工艺美术）":"设计学类",
  "设计学类（视觉传达设计；环境设计；服装与服饰设计；美术学；动画；戏剧影视美术设计）":"设计学类",
  "设计学类（（视觉传达设计、环境设计））":"设计学类","设计学类（环境设计、产品设计）":"设计学类",
  "设计学类（环境设计、工艺美术、视觉传达设计）":"设计学类","设计学类（环境设计、产品设计、视觉传达设计和数字媒体艺术）":"设计学类",
  "设计学类（环境设计专业、视觉传达设计专业、产品设计专业，艺术与科技专业)":"设计学类",
  "设计学类（环境设计，产品设计，数字媒体艺术）":"设计学类","设计学类（环境设计、服装与服饰设计、工艺美术、产品设计、视觉传达设计、数字媒体艺术、动画、珠宝首饰设计与工艺）":"设计学类",
  "设计学类（产品设计、数字媒体艺术）":"设计学类","设计学类（产品设计、美术学、动画）":"设计学类",
  "设计学类（产品设计、环境设计、视觉传达设计）":"设计学类",
  "设计学类（动画、视觉传达设计、环境设计、产品设计、数字媒体艺术专业）":"设计学类",
  "设计学类（动画、视觉传达设计、环境设计、服装与服饰设计、艺术与科技）":"设计学类",
  "设计学类（动画、视觉传达设计、环境设计、产品设计、包装设计）":"设计学类",
  "设计学类(视觉传达设计、环境设计、产品设计、工艺美术)":"设计学类",
  "设计学类[视觉传达设计、环境设计、环境设计(景观设计)、产品设计]":"设计学类",
  "设计学类【产品设计、产品设计（环境艺术设计）、视觉传达设计、数字媒体艺术、数字媒体艺术（创意策划与设计管理）和服装与服饰设计】":"设计学类",
  "设计学类（环境设计i、视觉传达设计）":"设计学类",
  // 美术学类（多专业大类）
  "美术学类（含美术学（师范）、绘画、中国画专业）":"美术学","美术学类（含绘画、雕塑专业）":"美术学",
  "美术学类（美术学，绘画）":"美术学",
  // 其他单独专业
  "展示艺术设计":"展示艺术设计","包装设计":"展示艺术设计","舞台艺术设计与制作":"展示艺术设计",
  "广播影视节目制作":"广播影视节目制作","民族传统技艺":"民族传统技艺","文物保护与修复":"民族传统技艺",
  "人物形象设计（影视服装与化妆）":"人物形象设计","人物形象所设计":"人物形象设计","人居设计":"人物形象设计",
};
// 归一化专业名：展示层使用，不修改原始数据
function normMajorName(name){
  if(!name)return name;
  // 清洗脏数据：去除零宽字符、换行、前后空格
  var cleaned=name.replace(/[\u200b\u200c\u200d\ufeff\r\n]/g,'').trim();
  // 精确匹配优先
  if(__majorNormMap[cleaned])return __majorNormMap[cleaned];
  // 前缀兜底：以大类名开头的全部归入该大类（覆盖括号/空格/换行变体）
  var prefixRules=[
    ['设计学类','设计学类'],
    ['美术学类','美术学类'],
    ['音乐学类','音乐学类'],
    ['舞蹈学类','舞蹈学类'],
  ];
  for(var i=0;i<prefixRules.length;i++){
    if(cleaned.indexOf(prefixRules[i][0])===0)return prefixRules[i][1];
  }
  // 过滤无效脏数据（纯数字/单字符等）
  if(/^\d+$/.test(cleaned)||cleaned.length<=2)return null;
  return cleaned||name;
}

function showMajorSchoolDetail(schoolName,currentKey,dedup){
  // 聚合全量记录中该学校的所有行
  var allRec=getAllRecords();
  var schoolRecords=allRec.filter(function(r){return r.schoolName===schoolName;});
  var info=window.getSchoolInfo?window.getSchoolInfo(schoolName):null;
  // 找到当前专业记录
  var curRecord=null;
  if(currentKey&&dedup){
    for(var i=0;i<dedup.length;i++){
      var dk=(dedup[i].schoolCode||'')+'|'+(dedup[i].majorCode||'');
      if(dk===currentKey){curRecord=dedup[i];break;}
    }
  }
  // 基础数据
  var sr=schoolRecords[0]||{};
  // 标签
  var tags=[];
  if(sr.is985)tags.push('<span class="tag tag-985">985</span>');
  if(sr.is211&&!sr.is985)tags.push('<span class="tag tag-211">211</span>');
  if(sr.isDoubleFirst)tags.push('<span class="tag tag-df">双一流</span>');
  if(sr.isPrivate)tags.push('<span class="tag tag-pv">民办</span>');
  // 综合分区间
  var scores=schoolRecords.map(function(r){return r.compositeScore||0;}).filter(Boolean);
  var scoreMin=scores.length?Math.min.apply(null,scores):0;
  var scoreMax=scores.length?Math.max.apply(null,scores):0;
  // 宿舍 & 校区（取非空的第一条）
  var dormVal='',campusVal='';
  for(var i=0;i<schoolRecords.length;i++){
    if(!dormVal&&schoolRecords[i].dorm)dormVal=schoolRecords[i].dorm;
    if(!campusVal&&schoolRecords[i].campus)campusVal=schoolRecords[i].campus;
    if(dormVal&&campusVal)break;
  }
  // 专业去重列表
  // 设计学类特殊处理：保留原始名（含括号内细分专业），其余专业按归一化名合并
  var majorMap={};
  for(var i=0;i<schoolRecords.length;i++){
    var r=schoolRecords[i];
    var origName=r.majorName||'未知专业';
    var normName=normMajorName(origName);
    // 设计学类：用原始名作为 key，展示括号内具体细分专业
    var key=normName==='设计学类'?origName:normName;
    if(!majorMap[key])majorMap[key]={name:key,normName:normName,score:r.compositeScore,plan:r.plan25,tuition:r.tuition};
  }
  var majorList=Object.values(majorMap).sort(function(a,b){return (b.score||0)-(a.score||0);});
  // ===== 构建 HTML =====
  var html='';
  // --- 顶部渐变头部 ---
  html+='<div class="msd-hero">';
  html+='<div class="msd-title">'+esc(schoolName)+(tags.length?' <span class="msd-tags">'+tags.join('')+'</span>':'')+'</div>';
  html+='<div class="msd-location">';
  if(sr.city)html+='📍 <span>'+esc(sr.city)+'</span>';
  if(sr.province&&sr.province!==sr.city)html+=' · <span>'+esc(sr.province)+'</span>';
  html+='</div>';
  if(scoreMin){
    html+='<span class="msd-score-badge">艺术综合分 <strong>'+scoreMin+(scoreMin!==scoreMax?' ~ '+scoreMax:'')+'</strong></span>';
  }
  html+='</div>';
  // --- 信息卡片网格（宿舍/校区/招生计划/学费）---
  var gridItems=[];
  if(dormVal)gridItems.push({label:'🏠 宿舍条件',value:dormVal});
  if(campusVal)gridItems.push({label:'🏫 校区',value:campusVal});
  if(curRecord&&curRecord.plan25)gridItems.push({label:'📋 今年招生计划',value:curRecord.plan25+' 人'});
  if(curRecord&&typeof curRecord.tuition==='number')gridItems.push({label:'💰 学费',value:curRecord.tuition.toLocaleString()+' 元/年',accent:true});
  if(sr.schoolType)gridItems.push({label:'🎓 院校类型',value:sr.schoolType});
  if(gridItems.length>0){
    html+='<div class="msd-info-grid">';
    for(var i=0;i<gridItems.length;i++){
      var gi=gridItems[i];
      html+='<div class="msd-info-item"><span class="msd-info-label">'+gi.label+'</span><span class="msd-info-value'+(gi.accent?' accent':'')+'"">'+esc(String(gi.value))+'</span></div>';
    }
    html+='</div>';
  }
  // --- 院校简介 ---
  if(info&&info.intro){
    html+='<div class="msd-intro-sec">';
    html+='<div class="msd-sec-title">院校简介</div>';
    html+='<div class="msd-intro-text">'+esc(info.intro)+'</div>';
    html+='</div>';
  }
  // --- 当前专业高亮 ---
  if(curRecord){
    html+='<div class="msd-cur-major">';
    html+='<div class="msd-sec-title">当前所选专业</div>';
    html+='<div class="msd-cur-row">';
    html+='<span class="msd-cur-name">'+esc(curRecord.majorName||'未知')+'</span>';
    html+='<span class="msd-cur-score">综合分 <strong>'+curRecord.compositeScore+'</strong></span>';
    if(curRecord.plan25)html+='<span class="msd-cur-plan">📋 招生 '+curRecord.plan25+' 人</span>';
    if(typeof curRecord.tuition==='number')html+='<span class="msd-cur-tuition">💰 '+curRecord.tuition.toLocaleString()+'/年</span>';
    html+='</div>';
    html+='</div>';
  }
  // --- 官网链接 ---
  if(info&&info.web){
    html+='<div class="msd-link-row">';
    html+='<a class="msd-weblink" href="'+escAttr(info.web)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">🌐 访问官网 →</a>';
    html+='</div>';
  }
  // --- 该校专业列表（次要区域） ---
  if(majorList.length>0){
    html+='<div class="msd-major-list">';
    html+='<div class="msd-sec-title">该校可报专业（'+majorList.length+' 个）</div>';
    for(var i=0;i<majorList.length;i++){
      var mj=majorList[i];
      var isCur=curRecord&&(curRecord.majorName===mj.name||normMajorName(curRecord.majorName)===mj.normName);
      // 设计学类：展示原始完整名（含括号细分），前面加「设计学类」标签便于识别
      var dispName=mj.name;
      if(mj.normName==='设计学类'&&mj.name!=='设计学类'){
        // 提取括号内的细分专业
        var bracketMatch=mj.name.match(/[（(](.*)[）)]/);
        var subs=bracketMatch?bracketMatch[1]:'';
        dispName='<span class="msd-mj-tag">设计学类</span>'+(subs?'<span class="msd-mj-subs">'+esc(subs)+'</span>':'');
      }else{
        dispName=esc(mj.name);
      }
      html+='<div class="msd-major-row'+(isCur?' cur':'')+'">'+
        '<span class="msd-mj-name">'+dispName+'</span>'+
        '<span class="msd-mj-score">'+mj.score+'</span>'+
        '</div>';
    }
    html+='</div>';
  }
  // 写入并打开弹窗
  var contentEl=document.getElementById('msdContent');
  var modal=document.getElementById('msdModal');
  if(contentEl)contentEl.innerHTML=html;
  if(modal){
    modal.classList.remove('hidden');
    modal.onclick=function(e){
      // 点击遮罩背景关闭，阻止冒泡到 tierOverlay 避免误触发
      e.stopPropagation();
      if(e.target===modal)modal.classList.add('hidden');
    };
  }
}

function selectMajor(majorName){
  __majorTierMap=null;
  var all=getAllRecords();
  if(__majorCat!=='all')all=all.filter(function(r){return r.catKey===__majorCat;});
  if(__majorCat!=='all'&&__majorSubCat!=='all'){
    all=filterBySubcat(all,__majorSubCat);
  }
  // 省份/城市筛选（与 renderMajorBrowser 保持一致）
  all=filterByProvince(all,__majorProvince);
  all=filterByCity(all,__majorCity);
  // 同步归一化（与 renderMajorBrowser 保持一致）
  var allNorm=all.map(function(r){
    var cn=normMajorName(r.majorName);
    if(!cn)return null;
    if(cn===r.majorName)return r;
    var nr=Object.assign({},r);nr.majorName=cn;nr._origMajorName=r.majorName;return nr;
  }).filter(Boolean);
  var majors=aggregateByMajor(allNorm);
  for(var i=0;i<majors.length;i++){
    if(majors[i].majorName===majorName){__selectedMajor=majors[i];break;}
  }
  // 展开院校列表
  var layout=document.querySelector('.major-layout');
  if(layout)layout.classList.add('expanded');
  renderMajorBrowser();
}

function collapseMajorLayout(){
  __selectedMajor=null;
  __majorTierMap=null;
  var layout=document.querySelector('.major-layout');
  if(layout)layout.classList.remove('expanded');
  renderMajorBrowser();
}

function recommendMajorSchools(){
  if(!__isLoggedIn){
    toast('请先登录后使用一键填报功能',1);
    document.getElementById('authModal').classList.remove('hidden');
    return;
  }
  var score=parseFloat(document.getElementById('majorRecScore').value);
  if(isNaN(score)||score<=0){
    toast('请输入有效的综合分',1);
    return;
  }
  // 确定 catKey
  var catKey=__majorCat;
  if(catKey==='all'){
    var keys=Object.keys(__selectedMajor.categories||{});
    if(keys.length)catKey=keys[0];
    else catKey='finearts';
  }
  // __selectedMajor.records 已由 selectMajor 按省份/城市筛选过
  var pool=__selectedMajor.records.filter(function(r){return !r.isSuspended;});
  if(!pool.length){
    toast('当前筛选条件下无有效院校记录',1);
    return;
  }
  var m=matchSchools(score,catKey,0,pool);
  var results=m.results;
  // 构建 tierMap：schoolCode|majorCode → tier
  __majorTierMap={};
  for(var i=0;i<results.length;i++){
    var r=results[i];
    var k=(r.schoolCode||'')+'|'+(r.majorCode||'');
    __majorTierMap[k]=r.tier;
  }
  // 统计冲稳保数量
  var counts={reach:0,match:0,safety:0};
  for(var i=0;i<results.length;i++){
    if(counts[results[i].tier]!==undefined)counts[results[i].tier]++;
  }
  toast('🔴 冲刺 '+counts.reach+' 所 | 🟡 稳妥 '+counts.match+' 所 | 🟢 保底 '+counts.safety+' 所');
  // 重新渲染右侧面板（会按 tier 排序 + 显示标签）
  renderMajorBrowser();
  // 恢复输入框的分数值
  var scoreInput=document.getElementById('majorRecScore');
  if(scoreInput)scoreInput.value=score;
}

// ===== 管理员数据分析面板 =====
function renderAdminAnalysis(){
  var all=getAllRecords();
  var schools=aggregateBySchool(all);
  var cities={};
  for(var i=0;i<all.length;i++){if(all[i].city)cities[all[i].city]=true;}
  var cityCount=Object.keys(cities).length;
  var majorNames={};
  for(var i=0;i<all.length;i++){if(all[i].majorName)majorNames[all[i].majorName]=true;}
  var uniqueMajorCount=Object.keys(majorNames).length;

  var html='';

  // 1. 各门类数据概览（从仪表盘移过来）
  html+='<div class="ana-section"><h4>📁 各门类数据概览</h4>';
  var maxCount=0;
  for(var i=0;i<CATS.length;i++){var c=loadData(CATS[i].k).length;if(c>maxCount)maxCount=c;}
  for(var i=0;i<CATS.length;i++){
    var cat=CATS[i];
    var cnt=loadData(cat.k).length;
    var pct=maxCount?Math.round(cnt/maxCount*100):0;
    html+='<div class="ana-bar"><span class="ab-lbl">'+cat.i+' '+cat.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%"><span>'+cnt+' 条</span></div></div><span class="ab-val">'+Math.round(cnt/all.length*100)+'%</span></div>';
  }
  html+='</div>';

  // 2. 总览数字
  html+='<div class="ana-section"><h4>📊 总体数据</h4>';
  html+='<div class="ana-bignums">'+
    '<div class="ana-bn"><div class="an-num">'+all.length+'</div><div class="an-lbl">总记录数</div></div>'+
    '<div class="ana-bn"><div class="an-num">'+schools.length+'</div><div class="an-lbl">覆盖院校</div></div>'+
    '<div class="ana-bn"><div class="an-num">'+uniqueMajorCount+'</div><div class="an-lbl">专业方向</div></div>'+
    '<div class="ana-bn"><div class="an-num">'+cityCount+'</div><div class="an-lbl">覆盖城市</div></div>'+
    '</div></div>';

  // 3. 院校层次构成
  var typeCounts={985:0,211:0,doubleFirst:0,public:0,private:0};
  for(var i=0;i<schools.length;i++){
    var s=schools[i];
    if(s.is985)typeCounts['985']++;
    else if(s.is211)typeCounts['211']++;
    else if(s.isDoubleFirst)typeCounts.doubleFirst++;
    else if(s.isPublic)typeCounts.public++;
    else if(s.isPrivate)typeCounts.private++;
  }
  var allType=typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst+typeCounts.public+typeCounts.private||1;

  html+='<div class="ana-section"><h4>🏛️ 院校层次构成</h4><div class="ana-grid-2"><div>';
  var typeData=[
    {k:'985',l:'985院校',c:typeCounts['985'],color:'#dc2626'},
    {k:'211',l:'211院校',c:typeCounts['211'],color:'#f97316'},
    {k:'doubleFirst',l:'双一流',c:typeCounts.doubleFirst,color:'#8b5cf6'},
    {k:'public',l:'公办普通',c:typeCounts.public,color:'#3b82f6'},
    {k:'private',l:'民办/独立学院',c:typeCounts.private,color:'#6b7280'},
  ];
  for(var i=0;i<typeData.length;i++){
    var td=typeData[i];var pct=Math.round(td.c/allType*100);
    html+='<div class="ana-bar"><span class="ab-lbl">'+td.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:'+td.color+'"><span>'+td.c+'</span></div></div><span class="ab-val">'+pct+'%</span></div>';
  }
  html+='</div><div style="text-align:center">';
  html+='<div style="width:140px;height:140px;border-radius:50%;background:conic-gradient(#dc2626 0deg '+(typeCounts['985']/allType*360)+'deg, #f97316 '+(typeCounts['985']/allType*360)+'deg '+((typeCounts['985']+typeCounts['211'])/allType*360)+'deg, #8b5cf6 '+((typeCounts['985']+typeCounts['211'])/allType*360)+'deg '+((typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst)/allType*360)+'deg, #3b82f6 '+((typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst)/allType*360)+'deg '+((typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst+typeCounts.public)/allType*360)+'deg, #6b7280 '+((typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst+typeCounts.public)/allType*360)+'deg 360deg);margin:0 auto"></div><div class="ana-legend" style="margin-top:12px">';
  for(var i=0;i<typeData.length;i++){
    html+='<span><span class="al-dot" style="background:'+typeData[i].color+'"></span> '+typeData[i].l+'</span>';
  }
  html+='</div></div></div></div>';

  // 4. 分数分布
  html+='<div class="ana-section"><h4>📊 综合分分布</h4>';
  var scoreBuckets=[],bStart=450;
  while(bStart<660){scoreBuckets.push({min:bStart,max:bStart+20,cnt:0});bStart+=20;}
  for(var i=0;i<all.length;i++){
    var sc=all[i].compositeScore;
    if(typeof sc!=='number'||sc<=0)continue;
    for(var j=0;j<scoreBuckets.length;j++){
      if(sc>=scoreBuckets[j].min&&sc<scoreBuckets[j].max){scoreBuckets[j].cnt++;break;}
    }
  }
  var maxB=0;for(var i=0;i<scoreBuckets.length;i++){if(scoreBuckets[i].cnt>maxB)maxB=scoreBuckets[i].cnt;}
  for(var i=0;i<scoreBuckets.length;i++){
    var b=scoreBuckets[i];var pct=maxB?Math.round(b.cnt/maxB*100):0;
    html+='<div class="ana-bar"><span class="ab-lbl">'+b.min+'-'+b.max+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:var(--color-accent)"><span>'+b.cnt+'</span></div></div></div>';
  }
  html+='</div>';

  // 5. 学费分布
  html+='<div class="ana-section"><h4>💰 学费分布</h4>';
  var tBuckets=[
    {l:'< 5千',min:0,max:5000,cnt:0,color:'#10b981'},
    {l:'5千~1万',min:5000,max:10000,cnt:0,color:'#3b82f6'},
    {l:'1万~2万',min:10000,max:20000,cnt:0,color:'#f59e0b'},
    {l:'2万~4万',min:20000,max:40000,cnt:0,color:'#f97316'},
    {l:'> 4万',min:40000,max:9999999,cnt:0,color:'#ef4444'},
  ];
  for(var i=0;i<all.length;i++){
    var t=all[i].tuition;
    if(typeof t!=='number'||t<=0)continue;
    for(var j=0;j<tBuckets.length;j++){
      if(t>=tBuckets[j].min&&t<tBuckets[j].max){tBuckets[j].cnt++;break;}
    }
  }
  var maxT=0;for(var i=0;i<tBuckets.length;i++){if(tBuckets[i].cnt>maxT)maxT=tBuckets[i].cnt;}
  for(var i=0;i<tBuckets.length;i++){
    var tb=tBuckets[i];var pct=maxT?Math.round(tb.cnt/maxT*100):0;
    html+='<div class="ana-bar"><span class="ab-lbl">'+tb.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:'+tb.color+'"><span>'+tb.cnt+'</span></div></div><span class="ab-val">'+Math.round(tb.cnt/all.length*100)+'%</span></div>';
  }
  html+='</div>';

  // 6. 城市 TOP 15
  html+='<div class="ana-section"><h4>📍 城市分布 TOP 15</h4>';
  var cityMap={};
  for(var i=0;i<all.length;i++){
    var ct=all[i].city||'未知';
    var simple=ct.replace(/^四川省|^浙江省|^江苏省|^江西省|^湖北省|^湖南省|^山东省|^吉林省|^安徽省|^福建省|^广东省|^河南省|^河北省|^辽宁省|^陕西省/g,'').replace(/市$/,'').trim();
    if(!cityMap[simple])cityMap[simple]=0;
    cityMap[simple]++;
  }
  var cityArr=[];for(var k in cityMap)cityArr.push({name:k,cnt:cityMap[k]});cityArr.sort(function(a,b){return b.cnt-a.cnt;});
  var topCities=cityArr.slice(0,15);
  var maxCity=topCities[0]?topCities[0].cnt:0;
  for(var i=0;i<topCities.length;i++){
    var tc=topCities[i];var pct=Math.round(tc.cnt/maxCity*100);
    html+='<div class="ana-bar"><span class="ab-lbl">'+esc(tc.name)+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%"><span>'+tc.cnt+'</span></div></div></div>';
  }
  html+='</div>';

  // 7. 数据质量
  html+='<div class="ana-section"><h4>✅ 数据质量</h4>';
  var estCount=all.filter(function(r){return r.scoreSource==='estimated';}).length;
  var actualCount=all.length-estCount;
  var withRank=all.filter(function(r){return r.rankPosition&&r.rankPosition>0;}).length;
  html+='<div class="ana-grid-2"><div>';
  var qualityItems=[
    {l:'实际录取分',c:actualCount,total:all.length,color:'#10b981'},
    {l:'预估分',c:estCount,total:all.length,color:'#f59e0b'},
    {l:'有位次信息',c:withRank,total:all.length,color:'#3b82f6'},
  ];
  for(var i=0;i<qualityItems.length;i++){
    var qi=qualityItems[i];var pct=Math.round(qi.c/qi.total*100);
    html+='<div class="ana-bar"><span class="ab-lbl">'+qi.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:'+qi.color+'"><span>'+qi.c+'</span></div></div><span class="ab-val">'+pct+'%</span></div>';
  }
  html+='</div><div>';
  var withNote=all.filter(function(r){return r.note&&r.note.length>0;}).length;
  var withDorm=all.filter(function(r){return r.dorm&&r.dorm.length>10;}).length;
  var withPlan=all.filter(function(r){return r.plan25&&r.plan25>0;}).length;
  var qitems2=[
    {l:'有专业备注',c:withNote,total:all.length,color:'#8b5cf6'},
    {l:'有宿舍信息',c:withDorm,total:all.length,color:'#06b6d4'},
    {l:'有招生计划',c:withPlan,total:all.length,color:'#f97316'},
  ];
  for(var i=0;i<qitems2.length;i++){
    var qi=qitems2[i];var pct=Math.round(qi.c/qi.total*100);
    html+='<div class="ana-bar"><span class="ab-lbl">'+qi.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:'+qi.color+'"><span>'+qi.c+'</span></div></div><span class="ab-val">'+pct+'%</span></div>';
  }
  html+='</div></div></div>';

  // 8. 各门类详情
  html+='<div class="ana-section"><h4>📂 各门类详情</h4>';
  for(var i=0;i<CATS.length;i++){
    var c=CATS[i];var catRecords=loadData(c.k);
    var catSchools={};for(var j=0;j<catRecords.length;j++){catSchools[catRecords[j].schoolName]=true;}
    var catSchoolCount=Object.keys(catSchools).length;
    var privCount=catRecords.filter(function(r){return r.isPrivate;}).length;
    var estCnt=catRecords.filter(function(r){return r.scoreSource==='estimated';}).length;
    html+='<details class="ana-detail"><summary>'+c.i+' '+c.l+' - '+catRecords.length+' 条记录，'+catSchoolCount+' 所院校</summary><div class="ad-grid">'+
      '<div class="ana-bar"><span class="ab-lbl">记录数</span><div class="ab-track"><div class="ab-fill" style="width:100%"><span>'+catRecords.length+'</span></div></div></div>'+
      '<div class="ana-bar"><span class="ab-lbl">民办占比</span><div class="ab-track"><div class="ab-fill" style="width:'+Math.round(privCount/catRecords.length*100)+'%"><span>'+privCount+'</span></div></div></div>'+
      '<div class="ana-bar"><span class="ab-lbl">预估分占比</span><div class="ab-track"><div class="ab-fill" style="width:'+Math.round(estCnt/catRecords.length*100)+'%;background:#f59e0b"><span>'+estCnt+'</span></div></div></div>';
    var catScores=catRecords.map(function(r){return r.compositeScore;}).filter(function(s){return typeof s=='number'&&s>0;});
    if(catScores.length){
      catScores.sort(function(a,b){return a-b;});
      html+='<div class="ana-bar"><span class="ab-lbl">分数区间</span><span style="font-size:.74rem;color:var(--color-text-secondary)">'+catScores[0]+' ~ '+catScores[catScores.length-1]+' &nbsp;均值 '+Math.round(catScores.reduce(function(a,b){return a+b;},0)/catScores.length)+'</span></div>';
    }
    html+='</div></details>';
  }
  html+='</div>';

  document.getElementById('adminAnalysisContent').innerHTML=html;
}

// ===== 数据分析（原公开页面，保留供管理员通过 hash 访问）=====
function renderDataAnalysis(){
  var all=getAllRecords();
  var schools=aggregateBySchool(all);
  var cities={};
  for(var i=0;i<all.length;i++){if(all[i].city)cities[all[i].city]=true;}
  var cityCount=Object.keys(cities).length;
  var majorNames={};
  for(var i=0;i<all.length;i++){if(all[i].majorName)majorNames[all[i].majorName]=true;}
  var uniqueMajorCount=Object.keys(majorNames).length;
  
  document.getElementById('anaTotalRecords').textContent=all.length;
  
  // 1. 总览数字
  var html='<div class="ana-bignums">'+
    '<div class="ana-bn"><div class="an-num">'+all.length+'</div><div class="an-lbl">总记录数</div></div>'+
    '<div class="ana-bn"><div class="an-num">'+schools.length+'</div><div class="an-lbl">覆盖院校</div></div>'+
    '<div class="ana-bn"><div class="an-num">'+uniqueMajorCount+'</div><div class="an-lbl">专业方向</div></div>'+
    '<div class="ana-bn"><div class="an-num">'+cityCount+'</div><div class="an-lbl">覆盖城市</div></div>'+
    '</div>';
  
  // 2. 门类分布（条形图）
  html+='<div class="ana-section"><h4>📁 各门类数据分布</h4>';
  var maxCat=0;
  for(var i=0;i<CATS.length;i++){var cnt=loadData(CATS[i].k).length;if(cnt>maxCat)maxCat=cnt;}
  for(var i=0;i<CATS.length;i++){
    var c=CATS[i];var cnt=loadData(c.k).length;
    var pct=Math.round(cnt/maxCat*100);
    html+='<div class="ana-bar"><span class="ab-lbl">'+c.i+' '+c.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%"><span>'+cnt+' 条</span></div></div><span class="ab-val">'+Math.round(cnt/all.length*100)+'%</span></div>';
  }
  html+='</div>';
  
  // 3. 院校层次构成  
  var typeCounts={985:0,211:0,doubleFirst:0,public:0,private:0};
  for(var i=0;i<schools.length;i++){
    var s=schools[i];
    if(s.is985)typeCounts['985']++;
    else if(s.is211)typeCounts['211']++;
    else if(s.isDoubleFirst)typeCounts.doubleFirst++;
    else if(s.isPublic)typeCounts.public++;
    else if(s.isPrivate)typeCounts.private++;
  }
  var allType=typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst+typeCounts.public+typeCounts.private||1;
  
  html+='<div class="ana-section"><h4>🏛️ 院校层次构成</h4><div class="ana-grid-2"><div>';
  var typeData=[
    {k:'985',l:'985院校',c:typeCounts['985'],color:'#dc2626'},
    {k:'211',l:'211院校',c:typeCounts['211'],color:'#f97316'},
    {k:'doubleFirst',l:'双一流',c:typeCounts.doubleFirst,color:'#8b5cf6'},
    {k:'public',l:'公办普通',c:typeCounts.public,color:'#3b82f6'},
    {k:'private',l:'民办/独立学院',c:typeCounts.private,color:'#6b7280'},
  ];
  for(var i=0;i<typeData.length;i++){
    var td=typeData[i];var pct=Math.round(td.c/allType*100);
    html+='<div class="ana-bar"><span class="ab-lbl">'+td.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:'+td.color+'"><span>'+td.c+'</span></div></div><span class="ab-val">'+pct+'%</span></div>';
  }
  html+='</div><div style="text-align:center">';
  html+='<div style="width:140px;height:140px;border-radius:50%;background:conic-gradient(#dc2626 0deg '+(typeCounts['985']/allType*360)+'deg, #f97316 '+(typeCounts['985']/allType*360)+'deg '+((typeCounts['985']+typeCounts['211'])/allType*360)+'deg, #8b5cf6 '+((typeCounts['985']+typeCounts['211'])/allType*360)+'deg '+((typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst)/allType*360)+'deg, #3b82f6 '+((typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst)/allType*360)+'deg '+((typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst+typeCounts.public)/allType*360)+'deg, #6b7280 '+((typeCounts['985']+typeCounts['211']+typeCounts.doubleFirst+typeCounts.public)/allType*360)+'deg 360deg);margin:0 auto"></div><div class="ana-legend" style="margin-top:12px">';
  for(var i=0;i<typeData.length;i++){
    html+='<span><span class="al-dot" style="background:'+typeData[i].color+'"></span> '+typeData[i].l+'</span>';
  }
  html+='</div></div></div></div>';
  
  // 4. 分数分布
  html+='<div class="ana-section"><h4>📊 综合分分布</h4>';
  var scoreBuckets=[],bStart=450;
  while(bStart<660){scoreBuckets.push({min:bStart,max:bStart+20,cnt:0});bStart+=20;}
  for(var i=0;i<all.length;i++){
    var sc=all[i].compositeScore;
    if(typeof sc!=='number'||sc<=0)continue;
    for(var j=0;j<scoreBuckets.length;j++){
      if(sc>=scoreBuckets[j].min&&sc<scoreBuckets[j].max){scoreBuckets[j].cnt++;break;}
    }
  }
  var maxB=0;for(var i=0;i<scoreBuckets.length;i++){if(scoreBuckets[i].cnt>maxB)maxB=scoreBuckets[i].cnt;}
  for(var i=0;i<scoreBuckets.length;i++){
    var b=scoreBuckets[i];var pct=maxB?Math.round(b.cnt/maxB*100):0;
    html+='<div class="ana-bar"><span class="ab-lbl">'+b.min+'-'+b.max+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:var(--color-accent)"><span>'+b.cnt+'</span></div></div></div>';
  }
  html+='</div>';
  
  // 5. 学费分布
  html+='<div class="ana-section"><h4>💰 学费分布</h4>';
  var tBuckets=[
    {l:'< 5千',min:0,max:5000,cnt:0,color:'#10b981'},
    {l:'5千~1万',min:5000,max:10000,cnt:0,color:'#3b82f6'},
    {l:'1万~2万',min:10000,max:20000,cnt:0,color:'#f59e0b'},
    {l:'2万~4万',min:20000,max:40000,cnt:0,color:'#f97316'},
    {l:'> 4万',min:40000,max:9999999,cnt:0,color:'#ef4444'},
  ];
  for(var i=0;i<all.length;i++){
    var t=all[i].tuition;
    if(typeof t!=='number'||t<=0)continue;
    for(var j=0;j<tBuckets.length;j++){
      if(t>=tBuckets[j].min&&t<tBuckets[j].max){tBuckets[j].cnt++;break;}
    }
  }
  var maxT=0;for(var i=0;i<tBuckets.length;i++){if(tBuckets[i].cnt>maxT)maxT=tBuckets[i].cnt;}
  for(var i=0;i<tBuckets.length;i++){
    var tb=tBuckets[i];var pct=maxT?Math.round(tb.cnt/maxT*100):0;
    html+='<div class="ana-bar"><span class="ab-lbl">'+tb.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:'+tb.color+'"><span>'+tb.cnt+'</span></div></div><span class="ab-val">'+Math.round(tb.cnt/all.length*100)+'%</span></div>';
  }
  html+='</div>';
  
  // 6. 城市 TOP 15
  html+='<div class="ana-section"><h4>📍 城市分布 TOP 15</h4>';
  var cityMap={};
  for(var i=0;i<all.length;i++){
    var ct=all[i].city||'未知';
    // 提取城市简称：去掉省份前缀
    var simple=ct.replace(/^四川省|^浙江省|^江苏省|^江西省|^湖北省|^湖南省|^山东省|^吉林省|^安徽省|^福建省|^广东省|^河南省|^河北省|^辽宁省|^陕西省/g,'').replace(/市$/,'').trim();
    if(!cityMap[simple])cityMap[simple]=0;
    cityMap[simple]++;
  }
  var cityArr=[];for(var k in cityMap)cityArr.push({name:k,cnt:cityMap[k]});cityArr.sort(function(a,b){return b.cnt-a.cnt;});
  var topCities=cityArr.slice(0,15);
  var maxCity=topCities[0]?topCities[0].cnt:0;
  for(var i=0;i<topCities.length;i++){
    var tc=topCities[i];var pct=Math.round(tc.cnt/maxCity*100);
    html+='<div class="ana-bar"><span class="ab-lbl">'+esc(tc.name)+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%"><span>'+tc.cnt+'</span></div></div></div>';
  }
  html+='</div>';
  
  // 7. 数据质量
  html+='<div class="ana-section"><h4>✅ 数据质量</h4>';
  var estCount=all.filter(function(r){return r.scoreSource==='estimated';}).length;
  var actualCount=all.length-estCount;
  var withRank=all.filter(function(r){return r.rankPosition&&r.rankPosition>0;}).length;
  var withCourse=all.filter(function(r){return r.courseGuide&&r.courseGuide.length>30;}).length;
  html+='<div class="ana-grid-2"><div>';
  var qualityItems=[
    {l:'实际录取分',c:actualCount,total:all.length,color:'#10b981'},
    {l:'预估分',c:estCount,total:all.length,color:'#f59e0b'},
    {l:'有位次信息',c:withRank,total:all.length,color:'#3b82f6'},
  ];
  for(var i=0;i<qualityItems.length;i++){
    var qi=qualityItems[i];var pct=Math.round(qi.c/qi.total*100);
    html+='<div class="ana-bar"><span class="ab-lbl">'+qi.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:'+qi.color+'"><span>'+qi.c+'</span></div></div><span class="ab-val">'+pct+'%</span></div>';
  }
  html+='</div><div>';
  var withNote=all.filter(function(r){return r.note&&r.note.length>0;}).length;
  var withDorm=all.filter(function(r){return r.dorm&&r.dorm.length>10;}).length;
  var withPlan=all.filter(function(r){return r.plan25&&r.plan25>0;}).length;
  var qitems2=[
    {l:'有专业备注',c:withNote,total:all.length,color:'#8b5cf6'},
    {l:'有宿舍信息',c:withDorm,total:all.length,color:'#06b6d4'},
    {l:'有招生计划',c:withPlan,total:all.length,color:'#f97316'},
  ];
  for(var i=0;i<qitems2.length;i++){
    var qi=qitems2[i];var pct=Math.round(qi.c/qi.total*100);
    html+='<div class="ana-bar"><span class="ab-lbl">'+qi.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:'+qi.color+'"><span>'+qi.c+'</span></div></div><span class="ab-val">'+pct+'%</span></div>';
  }
  html+='</div></div></div>';
  
  // 8. 招生计划
  html+='<div class="ana-section"><h4>📋 招生计划分布</h4>';
  var planBuckets=[
    {l:'1-5人',min:1,max:6,cnt:0},
    {l:'6-10人',min:6,max:11,cnt:0},
    {l:'11-20人',min:11,max:21,cnt:0},
    {l:'21-50人',min:21,max:51,cnt:0},
    {l:'51人以上',min:51,max:9999,cnt:0},
  ];
  for(var i=0;i<all.length;i++){
    var p=all[i].plan25||all[i].plan24||0;
    for(var j=0;j<planBuckets.length;j++){
      if(p>=planBuckets[j].min&&p<planBuckets[j].max){planBuckets[j].cnt++;break;}
    }
  }
  var maxP=0;for(var i=0;i<planBuckets.length;i++){if(planBuckets[i].cnt>maxP)maxP=planBuckets[i].cnt;}
  for(var i=0;i<planBuckets.length;i++){
    var pb=planBuckets[i];var pct=maxP?Math.round(pb.cnt/maxP*100):0;
    html+='<div class="ana-bar"><span class="ab-lbl">'+pb.l+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%;background:var(--color-accent)"><span>'+pb.cnt+'</span></div></div></div>';
  }
  html+='</div>';
  
  // 9. 软科排名
  html+='<div class="ana-section"><h4>🏅 软科排名分布</h4>';
  var rankMap={'A+':0,'A':0,'A-':0,'B+':0,'B':0,'B-':0,'C+':0,'C':0};
  var noRank=0;
  for(var i=0;i<schools.length;i++){
    var rl=schools[i].rankLevel||'';
    var found=false;
    for(var k in rankMap){
      if(rl.includes(k)){rankMap[k]++;found=true;break;}
    }
    if(!found)noRank++;
  }
  var maxRank=0;for(var k in rankMap){if(rankMap[k]>maxRank)maxRank=rankMap[k];}
  if(noRank>maxRank)maxRank=noRank;
  var rankOrder=['A+','A','A-','B+','B','B-','C+','C'];
  for(var i=0;i<rankOrder.length;i++){
    var rk=rankOrder[i],rv=rankMap[rk];var pct=maxRank?Math.round(rv/maxRank*100):0;
    html+='<div class="ana-bar"><span class="ab-lbl">'+rk+'</span><div class="ab-track"><div class="ab-fill" style="width:'+pct+'%"><span>'+rv+'</span></div></div></div>';
  }
  html+='<div class="ana-bar"><span class="ab-lbl">无排名</span><div class="ab-track"><div class="ab-fill" style="width:'+(noRank/maxRank*100)+'%"><span>'+noRank+'</span></div></div></div>';
  html+='</div>';
  
  // 10. 各门类详情
  html+='<div class="ana-section"><h4>📂 各门类详情</h4>';
  for(var i=0;i<CATS.length;i++){
    var c=CATS[i];var catRecords=loadData(c.k);
    var catSchools={};for(var j=0;j<catRecords.length;j++){catSchools[catRecords[j].schoolName]=true;}
    var catSchoolCount=Object.keys(catSchools).length;
    var privCount=catRecords.filter(function(r){return r.isPrivate;}).length;
    var estCnt=catRecords.filter(function(r){return r.scoreSource==='estimated';}).length;
    html+='<details class="ana-detail"><summary>'+c.i+' '+c.l+' - '+catRecords.length+' 条记录，'+catSchoolCount+' 所院校</summary><div class="ad-grid">'+
      '<div class="ana-bar"><span class="ab-lbl">记录数</span><div class="ab-track"><div class="ab-fill" style="width:100%"><span>'+catRecords.length+'</span></div></div></div>'+
      '<div class="ana-bar"><span class="ab-lbl">民办占比</span><div class="ab-track"><div class="ab-fill" style="width:'+Math.round(privCount/catRecords.length*100)+'%"><span>'+privCount+'</span></div></div></div>'+
      '<div class="ana-bar"><span class="ab-lbl">预估分占比</span><div class="ab-track"><div class="ab-fill" style="width:'+Math.round(estCnt/catRecords.length*100)+'%;background:#f59e0b"><span>'+estCnt+'</span></div></div></div>';
    // 计算该门类下的平均分数
    var catScores=catRecords.map(function(r){return r.compositeScore;}).filter(function(s){return typeof s=='number'&&s>0;});
    if(catScores.length){
      catScores.sort(function(a,b){return a-b;});
      html+='<div class="ana-bar"><span class="ab-lbl">分数区间</span><span style="font-size:.74rem;color:var(--color-text-secondary)">'+catScores[0]+' ~ '+catScores[catScores.length-1]+' &nbsp;均值 '+Math.round(catScores.reduce(function(a,b){return a+b;},0)/catScores.length)+'</span></div>';
    }
    html+='</div></details>';
  }
  html+='</div>';
  
  document.getElementById('anaContent').innerHTML=html;
}

// ===== 响应式兼容 =====
// 给 hero 加上 ID
(function fixHero(){
  var hero=document.querySelector('.hero');
  if(hero && !hero.id){hero.id='hero';}
})();

// ===== 管理员授权管理 =====
function renderAdminAuth(){
  var content=document.getElementById('adminAuthContent');
  if(!content)return;
  content.innerHTML='<p style="color:var(--t3);font-size:.82rem;text-align:center;padding:20px">⏳ 加载授权列表...</p>';

  getAuthorizedUsers().then(function(users){
    if(!users||!users.length){
      content.innerHTML='<p style="color:var(--t3);font-size:.82rem;text-align:center;padding:20px">暂无授权用户，点击"+ 添加授权"按钮添加</p>';
      return;
    }
    var html='<div class="ctw"><table><thead><tr><th>#</th><th>手机号</th><th>姓名</th><th>专业方向</th><th>状态</th><th>过期时间</th><th>备注</th><th>操作</th></tr></thead><tbody>';
    for(var i=0;i<users.length;i++){
      var u=users[i];
      var isActive=u.is_active;
      var isExpired=u.expires_at&&new Date(u.expires_at)<new Date();
      var statusText=isActive&&!isExpired?'<span style="color:var(--_green-500)">✅ 有效</span>':'<span style="color:var(--_red-500)">❌ '+(isExpired?'已过期':'已停用')+'</span>';
      var expiresText=u.expires_at?new Date(u.expires_at).toLocaleDateString('zh-CN'):'永久';
      html+='<tr><td>'+(i+1)+'</td><td>'+esc(u.phone||'')+'</td><td>'+esc(u.name||'')+'</td><td>'+esc(u.major_direction||'')+'</td><td>'+statusText+'</td><td>'+expiresText+'</td><td style="font-size:.78rem">'+esc(u.notes||'')+'</td><td><button class="btn btn-gh btn-sm" onclick="toggleAuthUser(\''+u.id+'\','+isActive+')">'+(isActive?'停用':'启用')+'</button> <button class="btn btn-gh btn-sm" onclick="deleteAuthUser(\''+u.id+'\',\''+escAttr(u.phone||'')+'\')">🗑</button></td></tr>';
    }
    html+='</tbody></table></div>';
    html+='<div style="margin-top:12px;font-size:.78rem;color:var(--t3)">共 '+users.length+' 个授权用户</div>';
    content.innerHTML=html;
  }).catch(function(e){
    content.innerHTML='<p style="color:var(--_red-500);font-size:.82rem;text-align:center;padding:20px">加载失败：'+esc(e.message||'网络错误')+'</p>';
  });
}

// 添加授权用户
// 显示/隐藏授权表单
function showAuthForm(){
  var form=document.getElementById('adminAuthForm');
  if(form)form.style.display='';
  var phoneInput=document.getElementById('authPhoneInput');
  if(phoneInput)phoneInput.focus();
}

function hideAuthForm(){
  var form=document.getElementById('adminAuthForm');
  if(form)form.style.display='none';
  // 清空表单
  var phoneInput=document.getElementById('authPhoneInput');
  var nameInput=document.getElementById('authNameInput');
  var majorInput=document.getElementById('authMajorInput');
  var daysInput=document.getElementById('authDaysInput');
  var notesInput=document.getElementById('authNotesInput');
  if(phoneInput)phoneInput.value='';
  if(nameInput)nameInput.value='';
  if(majorInput)majorInput.value='';
  if(daysInput)daysInput.value='365';
  if(notesInput)notesInput.value='';
}

// 确认添加授权
function confirmAuth(){
  var phone=document.getElementById('authPhoneInput');
  var name=document.getElementById('authNameInput');
  var major=document.getElementById('authMajorInput');
  var days=document.getElementById('authDaysInput');
  var notes=document.getElementById('authNotesInput');
  if(!phone||!/^1[3-9]\d{9}$/.test(phone.value)){toast('请输入有效的11位手机号',1);if(phone)phone.focus();return;}
  var phoneVal=phone.value.trim();
  var nameVal=name?name.value.trim():'';
  var majorVal=major?major.value.trim():'';
  var daysVal=parseInt(days&&days.value?days.value:'0')||0;
  var notesVal=notes?notes.value.trim():'';
  var expiresAt=null;
  if(daysVal>0){
    var d=new Date();d.setDate(d.getDate()+daysVal);
    expiresAt=d.toISOString();
  }
  // 禁用按钮防止重复提交
  var btnConfirm=document.getElementById('btnConfirmAuth');
  if(btnConfirm){btnConfirm.disabled=true;btnConfirm.textContent='⏳ 提交中...';}
  addAuthorizedUser({phone:phoneVal,name:nameVal,major_direction:majorVal,is_active:true,expires_at:expiresAt,notes:notesVal}).then(function(res){
    if(btnConfirm){btnConfirm.disabled=false;btnConfirm.textContent='✅ 确认授权';}
    if(res&&res.ok){toast('✅ 已授权 '+phoneVal);hideAuthForm();renderAdminAuth();}
    else{toast('授权失败：'+(res&&res.error||'未知错误'),1);}
  }).catch(function(e){if(btnConfirm){btnConfirm.disabled=false;btnConfirm.textContent='✅ 确认授权';}toast('授权失败：'+esc(e.message||'网络错误'),1);});
}

// 绑定授权管理按钮事件
document.addEventListener('DOMContentLoaded',function(){
  setTimeout(function(){
    var btnAdd=document.getElementById('btnAddAuth');
    if(btnAdd)btnAdd.addEventListener('click',showAuthForm);
    var btnRefresh=document.getElementById('btnRefreshAuth');
    if(btnRefresh)btnRefresh.addEventListener('click',renderAdminAuth);
    var btnConfirm=document.getElementById('btnConfirmAuth');
    if(btnConfirm)btnConfirm.addEventListener('click',confirmAuth);
    var btnCancel=document.getElementById('btnCancelAuth');
    if(btnCancel)btnCancel.addEventListener('click',hideAuthForm);
    // 回车提交
    var phoneInput=document.getElementById('authPhoneInput');
    if(phoneInput)phoneInput.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();confirmAuth();}});
  },500);
});

// 以下为旧函数，保留兼容（不再使用）
function addAuthUser(){showAuthForm();}

// 停用/启用授权用户
function toggleAuthUser(id,isActive){
  updateAuthorizedUser(id,{is_active:!isActive}).then(function(res){
    if(res&&res.ok){toast(isActive?'已停用':'已启用');renderAdminAuth();}
    else{toast('操作失败',1);}
  }).catch(function(e){toast('操作失败',1);});
}

// 删除授权用户
function deleteAuthUser(id,phone){
  if(!confirm('确定删除授权用户 '+phone+'？'))return;
  deleteAuthorizedUser(id).then(function(res){
    if(res&&res.ok){toast('已删除');renderAdminAuth();}
    else{toast('删除失败',1);}
  }).catch(function(e){toast('删除失败',1);});
}
