/**
 * 非凡教育 · 浙江艺考志愿助手 — UI 交互
 */
let cur=[],curTier='all',sel=new Map(),MAX_CMP=4,curSearch='',curSort='diff';

document.addEventListener('DOMContentLoaded',()=>{
  // 按钮绑定
  document.getElementById('btnGo').addEventListener('click',calc);
  document.getElementById('btnGear').addEventListener('click',()=>document.getElementById('lockModal').classList.remove('hidden'));
  document.getElementById('btnUnlock').addEventListener('click',()=>{
    if(document.getElementById('pwdInput').value==='ffjyyyds123456'){document.getElementById('lockModal').classList.add('hidden');document.getElementById('adminModal').classList.remove('hidden');renderAdmin();showAdminSection('data');}
    else toast('密码错误',1);
  });
  document.getElementById('btnLockCancel').addEventListener('click',()=>document.getElementById('lockModal').classList.add('hidden'));
  document.getElementById('btnAdminClose').addEventListener('click',()=>document.getElementById('adminModal').classList.add('hidden'));
  document.getElementById('btnClearAll').addEventListener('click',()=>{if(confirm('确定清空全部数据？')){CATS.forEach(c=>clearData(c.k));renderAdmin();toast('已清空');}});
  document.getElementById('btnExport').addEventListener('click',exportExcel);
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
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>非凡教育·志愿单</title><style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;padding:20px;color:#333}table{width:100%;border-collapse:collapse;margin-bottom:16px}td,th{border:1px solid #e8e8e8;padding:6px 8px;font-size:.8rem}th{background:#f7f8fa}h2{font-size:1.1rem;color:#b08543}.reach h3{color:#c0392b}.match h3{color:#c07830}.safety h3{color:#3a7d5a}@media print{button{display:none}}</style></head><body><h2>🎓 非凡教育 · 浙江艺考志愿填报参考单</h2><p style="color:#8c8c8c">${new Date().toLocaleString('zh-CN')}</p>${document.getElementById('formBody').innerHTML}</body><script>setTimeout(window.print,200)<\/script></html>`);
    w.document.close();
  });
  ['lockModal','adminModal','formModal','cmpModal'].forEach(id=>document.getElementById(id).addEventListener('click',function(e){if(e.target===this)this.classList.add('hidden');}));
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

async function calc(){
  // 认证检查
  if(!(await checkAuthAndSpend()))return;

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

  const res=calcScore(c,a,k==='calligraphy'?'finearts':k);
  const sb=document.getElementById('scoreBox');
  sb.classList.remove('hidden');
  const minC=CULTURE_MIN[k]||369,canB=c>=minC;
  sb.innerHTML=`<div class="sbox"><span class="lbl">你的综合分</span><span class="val">${res.score.toFixed(2)}</span><span class="frm">${res.text}</span></div><div class="snote ${canB?'ok':'warn'}">${canB?`✅ 文化分 ${c} ≥ ${minC}，已展示本科及专科结果`:`⚠️ 文化分 ${c} < ${minC}，仅展示专科及低分段结果`}</div>`;

  // 算法说明面板
  document.getElementById('algoCard').classList.remove('hidden');
  document.getElementById('algoBody').innerHTML=[
    {icon:'🎯',name:'分差接近度',wt:25,desc:'综合分越接近往年录取分越推荐（平方衰减）'},
    {icon:'🏛️',name:'院校层次',wt:20,desc:'985/211/双一流/艺术院校/公办/民办 9档'},
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
  ].map(d=>`<div class="algo-dim"><span class="dim-lbl">${d.icon} ${d.name}</span><div class="dim-bar"><div class="dim-fill" style="width:${d.wt/0.25*100}%"></div></div><span class="dim-val">${d.wt}%</span><span class="dim-desc">${d.desc}</span></div>`).join('')+`<div class="algo-total">📊 12维度严格评分 · 艺术院校独立加分 · 本专科分流 · 专业特色+培养模式加持</div>`;

  // 梯度说明卡片
  const tierExplain=document.getElementById('tierExplain');
  tierExplain.classList.remove('hidden');
  tierExplain.innerHTML=`<h4>📌 冲·稳·保 梯度说明</h4>
    <div class="tier-row"><div class="tr-icon">🔴</div><div class="tr-body"><strong>冲刺志愿</strong><span>你的综合分低于该校往年录取分 → 需要一定运气，适合“梦想院校”</span></div></div>
    <div class="tier-row"><div class="tr-icon">🟡</div><div class="tr-body"><strong>稳妥志愿</strong><span>你的综合分高于该校0~15分 → 录取概率较高，重点填报的核心区域</span></div></div>
    <div class="tier-row"><div class="tr-icon">🟢</div><div class="tr-body"><strong>保底志愿</strong><span>你的综合分高于该校15~35分 → 高概率录取，确保有学上</span></div></div>
    <div class="tier-row"><div class="tr-icon">⚠️</div><div class="tr-body"><strong>预估分说明</strong><span>标注“预估”的院校为新招专业或无往年数据，系统自动降一档处理（稳妥→冲刺，保底→稳妥）</span></div></div>`;

  // 数据来源卡片
  document.getElementById('dataSourceCard').classList.remove('hidden');

  const m=matchSchools(res.score,k,c,pool);
  cur=m.results;window.__rec=m.rec20;
  sel.clear();updateFloat();curTier='all';
  curSearch='';curSort='diff';
  document.getElementById('searchInput').value='';
  document.getElementById('btnClearSearch').style.display='none';
  document.getElementById('sortSelect').value='diff';
  document.querySelectorAll('#filters button').forEach(b=>{b.classList.remove('on');if(b.dataset.t==='all')b.classList.add('on');});
  document.getElementById('resultBox').classList.remove('hidden');
  document.getElementById('searchBar').classList.remove('hidden');
  document.getElementById('list').innerHTML='';
  const rc=m.results.filter(x=>x.tier==='reach').length;
  const mt=m.results.filter(x=>x.tier==='match').length;
  const sf=m.results.filter(x=>x.tier==='safety').length;
  document.getElementById('summary').innerHTML=`共 <strong>${m.results.length}</strong> 条 · 🔴${rc} 🟡${mt} 🟢${sf}`;
  document.getElementById('summaryActions').innerHTML=`<button class="btn btn-g btn-sm" id="btnRec">🤖 一键推荐20校</button>`;
  renderCards();
  document.getElementById('resultBox').scrollIntoView({behavior:'smooth'});
  setTimeout(()=>{const br=document.getElementById('btnRec');if(br)br.addEventListener('click',()=>{sel.clear();(window.__rec||[]).forEach(r=>sel.set(`${r.schoolCode}|${r.majorCode}`,r));updateFloat();renderCards();toast('已勾选20所推荐学校');document.getElementById('floatBar').scrollIntoView({behavior:'smooth'});});},150);
}

function renderCards(){
  const container=document.getElementById('list');
  let data=[...cur];
  if(curTier!=='all')data=data.filter(r=>r.tier===curTier);
  if(curSearch)data=data.filter(r=>{const n=(r.schoolName||'').toLowerCase(),m=(r.majorName||'').toLowerCase();return n.includes(curSearch)||m.includes(curSearch);});
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
  if(!data.length){container.innerHTML='<p style="text-align:center;color:#8c8c8c;padding:40px 0">'+(!cur.length?'暂无匹配结果':curSearch?'没有找到匹配的院校':'该梯度暂无结果')+'</p>';return;}
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
      ];
      const dimHtmls=dims.map(d=>{
        const v=sd[d.k];const sc=v.score||0;
        const lbl=v.label||'';const shortLbl=lbl.length>4?lbl.slice(0,3):lbl;
        return`<div class="sb-row"><span class="sbl" title="${v.label}(${v.weight}%)">${d.icon}${shortLbl}</span><div class="sbb"><div class="sbf" style="width:${Math.min(sc,100)}%;background:${d.color}"></div></div><span class="sbv">${sc}</span></div>`;
      });
      scoreDetailHTML=`<div class="score-breakdown"><div class="sb-title">📊 推荐评分 <span style="font-weight:400;color:var(--g);font-size:.8rem">${r.recScore||0}分</span></div>${dimHtmls.join('')}</div>`;
    }
    return `<div class="sc ${m.c}${ck?' sel':''}" data-key="${key}" data-idx="${i}"><div class="cb" data-act="sel"><div class="cb-box${ck?' on':''}">${ck?'✓':''}</div></div><div class="sinfo"><div class="sname">${esc(r.schoolName)} <span style="font-weight:400;font-size:.75rem">${tags.join(' ')}</span></div><div class="smaj">${esc(r.majorName)} <span style="font-size:.72rem;color:#8c8c8c">${r.majorCode||''}</span></div><div class="smeta"><span>📍 ${esc(r.city||'')}</span><span>💰 ${typeof r.tuition=='number'?r.tuition.toLocaleString()+'/年':(r.tuition||'--')}</span><span>🏠 ${esc(r.dorm||'')||'--'}</span>${r.plan25?`<span>📋 ${r.plan25}人</span>`:r.plan24?`<span>📋 ${r.plan24}人</span>`:''}${r.rankPosition?`<span>📊 位次${r.rankPosition}</span>`:''}</div>${r.scoreLineReq?`<div style="margin-top:4px;font-size:.74rem;color:#9a6b2a;background:#faf6f0;padding:3px 8px;border-radius:4px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📋 ${esc(r.scoreLineReq)}</div>`:''}<div class="sdet">${r.note?`<p>📝 ${esc(r.note)}</p>`:''}${r.courseGuide?`<p>📚 ${esc(r.courseGuide)}</p>`:''}${r.talentGoal?`<p>🎯 ${esc(r.talentGoal)}</p>`:''}${r.scoreSource==='estimated'?'<p style="color:#c0392b">⚠️ 预估分，请谨慎参考</p>':''}${scoreDetailHTML}</div></div><div class="sstat"><span class="sn">${r.compositeScore}</span><span class="ss">往年录取分</span><span class="ss">${dt}</span>${r.scoreSource==='estimated'?'<span class="ss" style="color:#c0392b">预估</span>':''}</div></div>`;
  }).join('');
  container.onclick=function(e){
    const selEl=e.target.closest('[data-act="sel"]');
    if(selEl){e.stopPropagation();const card=selEl.closest('.sc'),key=card.dataset.key;
      // 用 key 查找（修复索引错位 Bug）
      const r=cur.find(function(x){return x.schoolCode+'|'+x.majorCode===key;});
      if(r){if(sel.has(key))sel.delete(key);else sel.set(key,r);}updateFloat();renderCards();return;}
    const card=e.target.closest('.sc');if(card)card.classList.toggle('exp');
  };
}

function updateFloat(){
  const n=sel.size;
  document.getElementById('floatCnt').textContent=n;
  document.getElementById('btnForm').disabled=n===0;
  document.getElementById('btnCmp').disabled=n<2;
  document.getElementById('cmpCnt').textContent=Math.min(n,MAX_CMP);
  document.getElementById('floatBar').classList.toggle('on',n>0);
}

function openForm(){
  if(!sel.size)return toast('请先勾选学校',1);
  const groups={reach:[],match:[],safety:[]};
  for(const r of sel.values())groups[r.tier].push(r);
  for(const k of Object.keys(groups))groups[k].sort((a,b)=>Math.abs(a.diff)-Math.abs(b.diff));
  const slots={reach:8,match:7,safety:5},labels={reach:'🔴 冲刺志愿',match:'🟡 稳妥志愿',safety:'🟢 保底志愿'};
  let html='';
  for(const tier of['reach','match','safety']){
    const list=groups[tier].slice(0,slots[tier]);
    html+=`<div class="vsec ${tier}"><h3>${labels[tier]} <small>(${list.length}/${slots[tier]})</small></h3><table class="vtab"><thead><tr><th>#</th><th>院校</th><th>专业</th><th>综合分</th><th>评分</th><th>位次</th><th>学费</th><th>城市</th></tr></thead><tbody>`;
    for(let i=0;i<slots[tier];i++){
      if(i<list.length){const r=list[i];html+=`<tr><td>${i+1}</td><td>${esc(r.schoolName)}${r.scoreSource==='estimated'?' ⚠️':''}</td><td>${esc(r.majorName)}</td><td>${r.compositeScore}</td><td style="font-weight:700;color:var(--g)">${r.recScore||'--'}分</td><td>${r.rankPosition||'--'}</td><td>${typeof r.tuition=='number'?r.tuition.toLocaleString():r.tuition||'--'}</td><td>${esc(r.city)}</td></tr>`;}
      else html+=`<tr class="empty"><td>${i+1}</td><td colspan="7">（未选择）</td></tr>`;
    }
    html+='</tbody></table></div>';
  }
  document.getElementById('formBody').innerHTML=html;
  document.getElementById('formModal').classList.remove('hidden');
}

function openCmp(){
  const selected=[...sel.values()].slice(0,MAX_CMP);
  if(selected.length<2)return toast('至少选2所',1);
  const fields=[{l:'🏫 院校名称',f:'schoolName'},{l:'📚 专业名称',f:'majorName'},{l:'📊 综合分',f:'compositeScore',n:1},{l:'🏅 位次',f:'rankPosition',n:1},{l:'💰 学费',r:r=>typeof r.tuition=='number'?r.tuition.toLocaleString()+'/年':(r.tuition||'--')},{l:'🏠 宿舍',f:'dorm'},{l:'📍 城市',f:'city'},{l:'📋 计划数',f:'plan25'},{l:'🏷️ 层次',r:r=>{const t=[];if(r.is985)t.push('985');if(r.is211)t.push('211');if(r.isDoubleFirst)t.push('双一流');return t.join('·')||r.schoolType||'--'}}];
  const diffRows=new Set();
  for(const fd of fields){const vals=selected.map(r=>fd.r?fd.r(r):(fd.n?r[fd.f]:r[fd.f]));if(!vals.every(v=>String(v)===String(vals[0])))diffRows.add(fd.l);}
  let html='<div class="ctw"><table class="ct"><thead><tr><th></th>';
  for(const r of selected)html+=`<th>${esc(r.schoolName)}<br><small style="font-weight:400;color:#8c8c8c">${esc(r.majorName)}</small></th>`;
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
  }catch(e){p.textContent='❌ '+e.message;console.error(e);}
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
  if(dataSec)dataSec.style.display=section==='data'?'':'none';
  if(userSec)userSec.style.display=section==='users'?'':'none';
  // 更新 tab 按钮样式
  var btnData=document.getElementById('btnTabData');
  var btnUsers=document.getElementById('btnTabUsers');
  if(btnData){btnData.className='btn btn-sm '+(section==='data'?'btn-g':'btn-gh');}
  if(btnUsers){btnUsers.className='btn btn-sm '+(section==='users'?'btn-g':'btn-gh');}
  if(section==='data')renderAdmin();
  if(section==='users')renderUsers();
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

  // 2. 尝试从 Supabase 拉取
  try{
    var resp=await fetch('https://nhewhebhbknydhcbvjnv.supabase.co/rest/v1/phone_registrations?select=id,phone,grade,direction,created_at&order=created_at.desc&limit=500',{
      headers:{
        'apikey':'sb_publishable_9XfINH7l5nqjYbdEy4MqTQ__5O4BhnZ',
        'Authorization':'Bearer sb_publishable_9XfINH7l5nqjYbdEy4MqTQ__5O4BhnZ'
      }
    });
    if(resp.ok){
      var remoteList=await resp.json();
      remoteList.forEach(function(u){
        var exists=allUsers.some(function(x){return x.phone===u.phone;});
        if(!exists){
          allUsers.push({phone:u.phone,grade:u.grade||'',direction:u.direction||'',time:u.created_at||u.id||'',source:'云端'});
        }
      });
    }
  }catch(e){console.log('Supabase fetch error:',e);}

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
  // 显示浮动栏（仅填报相关 tab）
  if(tabName==='inputCard' || tabName==='resultBox'){
    updateFloat();
  }else{
    document.getElementById('floatBar').classList.remove('on');
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

// 初始化导航点击事件
document.addEventListener('DOMContentLoaded',function(){
  var navLinks=document.querySelectorAll('#topNav a');
  for(var i=0;i<navLinks.length;i++){
    navLinks[i].addEventListener('click',function(e){
      e.preventDefault();
      var href=this.getAttribute('href')||'';
      var tabName=href.replace('#','');
      switchTab(tabName);
    });
  }
  // 监听 hash 变化
  window.addEventListener('hashchange',function(){
    var hash=window.location.hash.replace('#','');
    if(hash && document.getElementById(hash)){
      switchTab(hash);
    }
  });
});

// showDashboard（auth.js 调用）
function showDashboard(){
  document.getElementById('gateCard').classList.add('hidden');
  document.getElementById('topNav').classList.remove('hidden');
  switchTab('dashboard');
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
  
  // 快捷入口
  var entries=[
    {icon:'🎯',title:'智能填报',desc:'输入成绩，匹配冲稳保院校',tab:'inputCard'},
    {icon:'🏫',title:'院校浏览',desc:'浏览全部院校及其开设专业',tab:'schoolBrowser'},
    {icon:'📚',title:'专业浏览',desc:'按专业筛选，查看院校排名',tab:'majorBrowser'},
    {icon:'📊',title:'数据分析',desc:'录取数据全方位可视化分析',tab:'analysisView'},
    {icon:'📥',title:'导入数据',desc:'上传 Excel 补充院校数据',tab:'importData'},
    {icon:'📋',title:'我的志愿单',desc:'查看已保存的志愿选择',tab:'myForm'},
  ];
  var entriesHtml='';
  for(var i=0;i<entries.length;i++){
    var e=entries[i];
    entriesHtml+='<div class="dash-entry" data-tab="'+e.tab+'" onclick="dashEntryClick(''+e.tab+'')"><span class="de-icon">'+e.icon+'</span><div class="de-title">'+e.title+'</div><div class="de-desc">'+e.desc+'</div></div>';
  }
  document.getElementById('dashEntries').innerHTML=entriesHtml;
  
  // 门类概览
  var catOverview='<h4>📁 各门类数据概览</h4>';
  var maxCount=0;
  for(var i=0;i<CATS.length;i++){var c=loadData(CATS[i].k).length;if(c>maxCount)maxCount=c;}
  for(var i=0;i<CATS.length;i++){
    var cat=CATS[i];
    var cnt=loadData(cat.k).length;
    var pct=maxCount?Math.round(cnt/maxCount*100):0;
    catOverview+='<div class="dash-cat-row" onclick="switchTab('schoolBrowser');setTimeout(function(){filterSchoolCat(''+cat.k+'')},100)"><span class="dc-icon">'+cat.i+'</span><span class="dc-name">'+cat.l+'</span><div class="dc-bar-wrap"><div class="dc-bar" style="width:'+pct+'%"></div></div><span class="dc-count">'+cnt+' 条</span></div>';
  }
  document.getElementById('dashOverview').innerHTML=catOverview;
}

function dashEntryClick(tab){
  if(tab==='importData'){
    // 触发文件上传
    var inp=document.querySelector('#adminGrid input[type="file"]');
    if(inp){inp.click();}
    else{switchTab('schoolBrowser');}
  }else if(tab==='myForm'){
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
function renderSchoolBrowser(catKey){
  if(catKey!==undefined)__schoolCat=catKey;
  var all=getAllRecords();
  if(__schoolCat!=='all')all=all.filter(function(r){return r.catKey===__schoolCat;});
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
  
  document.getElementById('schoolSub').textContent='共 '+filtered.length+' 所院校'+(__schoolCat!=='all'?'（'+CATS.filter(function(c){return c.k===__schoolCat;}).map(function(c){return c.l;})[0]+'）':'');
  
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
    html+='<div class="school-card" onclick="toggleSchoolCard(this)">'+
      '<div class="sch-name">'+esc(s.schoolName)+' <span style="font-weight:400;font-size:.75rem">'+tags.join(' ')+'</span></div>'+
      '<div class="sch-meta">📍 '+esc(s.city||'--')+' | 💰 '+(s.tuitionMin?s.tuitionMin.toLocaleString():'--')+(s.tuitionMin!==s.tuitionMax?' ~ '+s.tuitionMax.toLocaleString():'')+'/年 | 📚 '+s.majorCount+'个专业</div>'+
      '<div class="sch-majors">'+majorsHtml+'</div>'+
      '<div class="sch-scores"><span>综合分区间 <strong>'+s.compositeMin+' ~ '+s.compositeMax+'</strong></span>'+'<span>均值 <strong>'+s.compositeAvg+'</strong></span></div>'+
      '<div class="sch-all-majors hidden" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--color-border)">'+majorNames.map(function(m){return '<span style="display:block;font-size:.74rem;padding:2px 0">'+esc(m)+'</span>';}).join('')+'</div>'+
    '</div>';
  }
  document.getElementById('schoolList').innerHTML=html;
}

function filterSchoolCat(catKey){__schoolCat=catKey;renderSchoolBrowser();}
function toggleSchoolCard(card){card.classList.toggle('exp');var allMajors=card.querySelector('.sch-all-majors');if(allMajors)allMajors.classList.toggle('hidden');}

// ===== 专业浏览 =====
var __majorCat='all',__selectedMajor=null;
function renderMajorBrowser(catKey){
  if(catKey!==undefined){__majorCat=catKey;__selectedMajor=null;}
  var all=getAllRecords();
  if(__majorCat!=='all')all=all.filter(function(r){return r.catKey===__majorCat;});
  var majors=aggregateByMajor(all);
  
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
  
  // 左侧专业列表
  var leftHtml='';
  if(!majors.length){
    leftHtml='<p style="text-align:center;color:var(--color-text-tertiary);padding:20px">暂无数据</p>';
  }
  for(var i=0;i<majors.length;i++){
    var m=majors[i];
    var selClass=__selectedMajor&&__selectedMajor.majorName===m.majorName?' sel':'';
    leftHtml+='<div class="ml-item'+selClass+'" onclick="selectMajor(''+escAttr(m.majorName)+'')"><span>'+esc(m.majorName)+'</span><span class="ml-count">'+m.schoolCount+'校</span></div>';
  }
  document.getElementById('majorLeft').innerHTML=leftHtml;
  
  // 右侧详情
  if(__selectedMajor && __selectedMajor.records.length>0){
    var m=__selectedMajor;
    var rightHtml='<div class="mr-header"><h4>📚 '+esc(m.majorName)+'</h4><div class="mr-stats">开设院校：<strong>'+m.schoolCount+'</strong> 所 | 综合分区间：<strong>'+m.scoreMin+' ~ '+m.scoreMax+'</strong> | 均值：<strong>'+m.scoreAvg+'</strong> | 平均学费：<strong>'+(m.tuitionAvg||'--').toLocaleString()+'</strong>/年</div></div><div class="mr-schools">';
    var ranked=m.records;
    // 去重学校（同一学校可能有多条记录，取第一条）
    var seen={},dedup=[];
    for(var i=0;i<ranked.length;i++){
      if(!seen[ranked[i].schoolName]){seen[ranked[i].schoolName]=true;dedup.push(ranked[i]);}
    }
    if(dedup.length>50)dedup=dedup.slice(0,50);
    for(var i=0;i<dedup.length;i++){
      var r=dedup[i];
      var tags=[];
      if(r.is985)tags.push('<span class="tag tag-985">985</span>');
      if(r.is211)tags.push('<span class="tag tag-211">211</span>');
      if(r.isDoubleFirst)tags.push('<span class="tag tag-df">双一流</span>');
      if(r.isPrivate)tags.push('<span class="tag tag-pv">民办</span>');
      rightHtml+='<div class="mr-school"><span class="mr-rank">'+(i+1)+'</span><div class="mr-info"><div class="mr-sname">'+esc(r.schoolName)+' '+tags.join(' ')+'</div><div class="mr-smeta">📍 '+esc(r.city||'--')+' | 💰 '+(typeof r.tuition=='number'?r.tuition.toLocaleString():r.tuition||'--')+'/年'+(r.plan25?' | 📋 '+r.plan25+'人':'')+(r.rankPosition?' | 🏅 位次 '+r.rankPosition:'')+'</div></div><span class="mr-score">'+r.compositeScore+'</span></div>';
    }
    if(m.records.length>50)rightHtml+='<p style="text-align:center;color:var(--color-text-tertiary);padding:10px;font-size:.78rem">仅显示前 50 所（共 '+m.records.length+' 条记录）</p>';
    rightHtml+='</div>';
    document.getElementById('majorRight').innerHTML=rightHtml;
  }else{
    document.getElementById('majorRight').innerHTML='<p style="text-align:center;color:var(--color-text-tertiary);padding:60px 20px">👈 请从左侧选择一个专业</p>';
  }
}

function selectMajor(majorName){
  var all=getAllRecords();
  if(__majorCat!=='all')all=all.filter(function(r){return r.catKey===__majorCat;});
  var majors=aggregateByMajor(all);
  for(var i=0;i<majors.length;i++){
    if(majors[i].majorName===majorName){__selectedMajor=majors[i];break;}
  }
  renderMajorBrowser();
}

// ===== 数据分析 =====
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
