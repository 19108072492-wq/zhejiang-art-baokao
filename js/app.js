/**
 * 非凡教育 · 浙江艺考志愿助手 — UI 交互
 */
let cur=[],curTier='all',sel=new Map(),MAX_CMP=4;

document.addEventListener('DOMContentLoaded',()=>{
  // 每次启动清除旧缓存
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('zjyk_'))localStorage.removeItem(k);}

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

  const m=matchSchools(res.score,k,c,pool);
  cur=m.results;window.__rec=m.rec20;
  sel.clear();updateFloat();curTier='all';
  document.querySelectorAll('#filters button').forEach(b=>{b.classList.remove('on');if(b.dataset.t==='all')b.classList.add('on');});
  document.getElementById('resultBox').classList.remove('hidden');
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
  if(!data.length){container.innerHTML='<p style="text-align:center;color:#8c8c8c;padding:40px 0">暂无匹配结果</p>';return;}
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
    return `<div class="sc ${m.c}${ck?' sel':''}" data-key="${key}" data-idx="${i}"><div class="cb" data-act="sel"><div class="cb-box${ck?' on':''}">${ck?'✓':''}</div></div><div class="sinfo"><div class="sname">${esc(r.schoolName)} <span style="font-weight:400;font-size:.75rem">${tags.join(' ')}</span></div><div class="smaj">${esc(r.majorName)} <span style="font-size:.72rem;color:#8c8c8c">${r.majorCode||''}</span></div><div class="smeta"><span>📍 ${esc(r.city||'')}</span><span>💰 ${typeof r.tuition=='number'?r.tuition.toLocaleString()+'/年':(r.tuition||'--')}</span><span>🏠 ${esc(r.dorm||'')||'--'}</span>${r.plan25?`<span>📋 ${r.plan25}人</span>`:r.plan24?`<span>📋 ${r.plan24}人</span>`:''}${r.rankPosition?`<span>📊 位次${r.rankPosition}</span>`:''}</div>${r.scoreLineReq?`<div style="margin-top:4px;font-size:.74rem;color:#9a6b2a;background:#faf6f0;padding:3px 8px;border-radius:4px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📋 ${esc(r.scoreLineReq)}</div>`:''}<div class="sdet">${r.note?`<p>📝 ${esc(r.note)}</p>`:''}${r.courseGuide?`<p>📚 ${esc(r.courseGuide)}</p>`:''}${r.talentGoal?`<p>🎯 ${esc(r.talentGoal)}</p>`:''}${r.scoreSource==='estimated'?'<p style="color:#c0392b">⚠️ 预估分，请谨慎参考</p>':''}</div></div><div class="sstat"><span class="sn">${r.compositeScore}</span><span class="ss">往年录取分</span><span class="ss">${dt}</span>${r.scoreSource==='estimated'?'<span class="ss" style="color:#c0392b">预估</span>':''}</div></div>`;
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
    return`<div class="aitem${has?' has':''}"><h4>${c.i} ${c.l}</h4><div class="ast">${has?`${a}条历史+${n-a}条新增/停招`:'未加载'}</div><div class="aact"><label class="btn btn-o btn-sm" style="cursor:pointer">📁 上传<input type="file" accept=".xlsx,.xls" data-art="${c.k}" hidden onchange="up(this)"></label>${has?`<button class="btn btn-gh btn-sm" data-art="${c.k}" onclick="cls(this)">清空</button>`:''}</div><div class="ast" style="margin-top:6px" id="p-${c.k}"></div></div>`;
  }).join('');
  document.getElementById('totalCount').textContent=totalCount();
}

function cls(btn){const k=btn.dataset.art;if(!confirm('确定清空？'))return;clearData(k);renderAdmin();toast('已清空');}

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
function toast(msg,err){const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=msg;document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},3000);}
