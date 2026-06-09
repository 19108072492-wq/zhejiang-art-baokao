/**
 * 非凡教育 · 浙江艺考志愿助手 — UI 交互
 */
let cur=[],curTier='all',sel=new Map(),MAX_CMP=4,curSearch='',curSort='diff';

document.addEventListener('DOMContentLoaded',()=>{
  // 按钮绑定
  document.getElementById('btnGo').addEventListener('click',calc);
  document.getElementById('btnGear').addEventListener('click',()=>document.getElementById('lockModal').classList.remove('hidden'));
  document.getElementById('btnUnlock').addEventListener('click',()=>{
    if(document.getElementById('pwdInput').value==='888888'){document.getElementById('lockModal').classList.add('hidden');document.getElementById('adminModal').classList.remove('hidden');renderAdmin();}
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

function calc(){
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
    {icon:'🎯',name:'分差接近度',wt:20,desc:'综合分越接近往年录取分越推荐（40分满分）'},
    {icon:'🏛️',name:'院校层次',wt:18,desc:'985/211/双一流/公办重点/普通/民办 9档细分'},
    {icon:'📊',name:'软科排名',wt:10,desc:'A+→C- 7级连续评分，反映学术实力'},
    {icon:'📋',name:'数据可信度',wt:12,desc:'有历史位次满分/无位次降权/预估分最低'},
    {icon:'📍',name:'地理位置',wt:10,desc:'浙江>长三角>华东>其他，连续距离衰减'},
    {icon:'💰',name:'学费合理度',wt:8,desc:'≤6000满分→1.2万/2万/3.5万/6万分段递减'},
    {icon:'📋',name:'招生计划数',wt:5,desc:'计划多→竞争分散，30+满分，<3人最低'},
    {icon:'🏅',name:'位次匹配度',wt:10,desc:'位次差距越小越好，连续评分'},
    {icon:'🏙️',name:'城市级别',wt:7,desc:'杭州/宁波满分→新一线→二线→三线递减'},
  ].map(d=>`<div class="algo-dim"><span class="dim-lbl">${d.icon} ${d.name}</span><div class="dim-bar"><div class="dim-fill" style="width:${d.wt/0.20*100}%"></div></div><span class="dim-val">${d.wt}%</span><span class="dim-desc">${d.desc}</span></div>`).join('')+`<div class="algo-total">📊 9维度加权评分，消除并列 · 满分100分 · 得分越高推荐度越高</div>`;

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
    // 评分详情条
    let scoreDetailHTML='';
    if(r.scoreDetail){
      const sd=r.scoreDetail;
      const dims=[
        {k:'proximity',icon:'🎯',color:'var(--g)'},
        {k:'tier',icon:'🏛️',color:'#3b82f6'},
        {k:'rank',icon:'📊',color:'#8b5cf6'},
        {k:'confidence',icon:'📋',color:'#06b6d4'},
        {k:'local',icon:'📍',color:'#f59e0b'},
        {k:'tuition',icon:'💰',color:'#10b981'},
        {k:'plan',icon:'📋',color:'#ef4444'},
        {k:'rankMatch',icon:'🏅',color:'#ec4899'},
        {k:'cityLevel',icon:'🏙️',color:'#6366f1'},
      ];
      const dimHtmls=dims.map(d=>{
        const v=sd[d.k];const sc=v.score||0;
        return`<div class="sb-row"><span class="sbl">${d.icon} ${v.label}(${v.weight}%)</span><div class="sbb"><div class="sbf" style="width:${sc}%;background:${d.color}"></div></div><span class="sbv">${sc}</span></div>`;
      });
      scoreDetailHTML=`<div class="score-breakdown"><div class="sb-title">📊 推荐评分 <span style="font-weight:400;color:var(--g);font-size:.8rem">${r.recScore||0}分</span></div>${dimHtmls.join('')}</div>`;
    }
    return `<div class="sc ${m.c}${ck?' sel':''}" data-key="${key}" data-idx="${i}"><div class="cb" data-act="sel"><div class="cb-box${ck?' on':''}">${ck?'✓':''}</div></div><div class="sinfo"><div class="sname">${esc(r.schoolName)} <span style="font-weight:400;font-size:.75rem">${tags.join(' ')}</span></div><div class="smaj">${esc(r.majorName)} <span style="font-size:.72rem;color:#8c8c8c">${r.majorCode||''}</span></div><div class="smeta"><span>📍 ${esc(r.city||'')}</span><span>💰 ${typeof r.tuition=='number'?r.tuition.toLocaleString()+'/年':(r.tuition||'--')}</span><span>🏠 ${esc(r.dorm||'')||'--'}</span>${r.plan25?`<span>📋 ${r.plan25}人</span>`:r.plan24?`<span>📋 ${r.plan24}人</span>`:''}${r.rankPosition?`<span>📊 位次${r.rankPosition}</span>`:''}</div>${r.scoreLineReq?`<div style="margin-top:4px;font-size:.74rem;color:#9a6b2a;background:#faf6f0;padding:3px 8px;border-radius:4px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📋 ${esc(r.scoreLineReq)}</div>`:''}<div class="sdet">${r.note?`<p>📝 ${esc(r.note)}</p>`:''}${r.courseGuide?`<p>📚 ${esc(r.courseGuide)}</p>`:''}${r.talentGoal?`<p>🎯 ${esc(r.talentGoal)}</p>`:''}${r.scoreSource==='estimated'?'<p style="color:#c0392b">⚠️ 预估分，请谨慎参考</p>':''}${scoreDetailHTML}</div></div><div class="sstat"><span class="sn">${r.compositeScore}</span><span class="ss">往年录取分</span><span class="ss">${dt}</span>${r.scoreSource==='estimated'?'<span class="ss" style="color:#c0392b">预估</span>':''}</div></div>`;
  }).join('');
  container.onclick=function(e){
    const selEl=e.target.closest('[data-act="sel"]');
    if(selEl){e.stopPropagation();const card=selEl.closest('.sc'),key=card.dataset.key,idx=parseInt(card.dataset.idx),r=cur[idx];if(r){if(sel.has(key))sel.delete(key);else sel.set(key,r);}updateFloat();renderCards();return;}
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
    html+=`<div class="vsec ${tier}"><h3>${labels[tier]} <small>(${list.length}/${slots[tier]})</small></h3><table class="vtab"><thead><tr><th>#</th><th>院校</th><th>专业</th><th>综合分</th><th>位次</th><th>学费</th><th>城市</th></tr></thead><tbody>`;
    for(let i=0;i<slots[tier];i++){
      if(i<list.length){const r=list[i];html+=`<tr><td>${i+1}</td><td>${esc(r.schoolName)}${r.scoreSource==='estimated'?' ⚠️':''}</td><td>${esc(r.majorName)}</td><td>${r.compositeScore}</td><td>${r.rankPosition||'--'}</td><td>${typeof r.tuition=='number'?r.tuition.toLocaleString():r.tuition||'--'}</td><td>${esc(r.city)}</td></tr>`;}
      else html+=`<tr class="empty"><td>${i+1}</td><td colspan="6">（未选择）</td></tr>`;
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
function toast(msg,err){const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=msg;document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},3000);}
