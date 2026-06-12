/**
 * 非凡教育 · 浙江艺考志愿助手 — 极简认证（零配置）
 * 流程：输入手机号 → 直接存入 Supabase → 标记已登录 → 可用
 * 不依赖任何 Auth Provider，纯 REST API
 */
var __isLoggedIn=false;

(function initAuth(){
  setupAuthUI();

  // 检查 localStorage 中是否有登录标记
  var saved=localStorage.getItem('zjyk_logged_in');
  if(saved){
    __isLoggedIn=true;
    // app.js 可能尚未加载，延迟执行 showDashboard
    function tryShow(){
      if(typeof showDashboard==='function'){showDashboard();}
      else{setTimeout(tryShow,80);}
    }
    // 如果 DOM 已 ready 直接试，否则等 DOMContentLoaded
    if(document.readyState!=='loading'){setTimeout(tryShow,0);}
    else{document.addEventListener('DOMContentLoaded',tryShow,{once:true});}
  }else{
    var gc=document.getElementById('gateCard');if(gc)gc.classList.remove('hidden');
    var ic=document.getElementById('inputCard');if(ic)ic.classList.add('hidden');
  }
})();

function setupAuthUI(){
  var bl=document.getElementById('btnGateLogin');
  if(bl)bl.addEventListener('click',function(){
    var am=document.getElementById('authModal');if(am)am.classList.remove('hidden');
  });
  var bt=document.getElementById('btnGateTrial');
  if(bt)bt.addEventListener('click',doTrial);

  var bs=document.getElementById('btnAuthSubmit');
  if(bs)bs.addEventListener('click',handlePhoneSubmit);
  var bc=document.getElementById('btnAuthCancel');
  if(bc)bc.addEventListener('click',function(){
    var am=document.getElementById('authModal');if(am)am.classList.add('hidden');
  });
  var am=document.getElementById('authModal');
  if(am)am.addEventListener('click',function(e){
    if(e.target===this)this.classList.add('hidden');
  });

  // 隐藏邮箱/密码/切换按钮，只显示手机号+年级+方向
  var ep=document.getElementById('authEmail');if(ep)ep.style.display='none';
  var pp=document.getElementById('authPassword');if(pp)pp.style.display='none';
  var ps=document.getElementById('authPhone');if(ps){ps.style.display='';ps.placeholder='请输入手机号';}
  var gr=document.getElementById('authGrade');if(gr)gr.style.display='';
  var dr=document.getElementById('authDirection');if(dr)dr.style.display='';
  var sb=document.getElementById('btnAuthSwitch');if(sb)sb.style.display='none';
  var hh=document.getElementById('authHint');if(hh)hh.style.display='none';
  var tt=document.getElementById('authTitle');if(tt)tt.textContent='📱 注册';
  var mg=document.getElementById('authMsg');if(mg)mg.textContent='注册后即可使用完整功能';
  var bts=document.getElementById('btnAuthSubmit');if(bts)bts.textContent='🚀 注册';
}

// 带超时的 fetch 封装（防止请求挂起）
function fetchWithTimeout(url,options,timeoutMs){
  timeoutMs=timeoutMs||5000;
  return Promise.race([
    fetch(url,options),
    new Promise(function(res,rej){setTimeout(function(){rej(new Error('timeout'));},timeoutMs);})
  ]);
}

// 后台同步到云端（不阻塞用户）
function syncToCloud(body){
  if(!supabase){
    // 重试：等 supabase 初始化完成后再试
    if(typeof __supabaseCheck!=='undefined'&&__supabaseCheck<50){
      setTimeout(function(){syncToCloud(body);},500);
      return;
    }
    console.warn('[Auth] 云端不可用，仅保存本地');
    return;
  }
  // 方案1：supabase 客户端
  supabase.from('phone_registrations').insert(body).then(function(res){
    if(res.error){console.warn('[Auth] supabase insert failed:',res.error);syncRest(body);}
    else{console.log('[Auth] supabase insert OK');}
  }).catch(function(){syncRest(body);});
}

function syncRest(body){
  fetchWithTimeout(SUPABASE_URL+'/rest/v1/phone_registrations',{
    method:'POST',
    headers:{
      'apikey':SUPABASE_KEY,
      'Authorization':'Bearer '+SUPABASE_KEY,
      'Content-Type':'application/json',
      'Prefer':'return=minimal'
    },
    body:JSON.stringify(body)
  },6000).then(function(resp){
    if(resp.ok)console.log('[Auth] REST insert OK');
    else resp.json().then(function(e){console.warn('[Auth] REST insert failed:',e);}).catch(function(){});
  }).catch(function(e){console.warn('[Auth] REST insert error:',e.message||e);});
}

function doTrial(){
  document.getElementById('authModal').classList.add('hidden');
  var trialed=localStorage.getItem('zjyk_trialed');
  if(!trialed){
    localStorage.setItem('zjyk_trialed','1');
    localStorage.setItem('zjyk_free_uses','1');
  }
  __isLoggedIn=true;
  localStorage.setItem('zjyk_logged_in','1');
  showDashboardNow();
}

function showDashboardNow(){
  var am=document.getElementById('authModal');if(am)am.classList.add('hidden');
  if(typeof showDashboard==='function'){showDashboard();}
  else{
    document.getElementById('gateCard').classList.add('hidden');
    var ic=document.getElementById('inputCard');if(ic)ic.classList.remove('hidden');
    var tn=document.getElementById('topNav');if(tn)tn.classList.remove('hidden');
    if(typeof switchTab==='function')switchTab('dashboard');
  }
  var btn=document.getElementById('btnAuthSubmit');
  if(btn){btn.disabled=false;btn.textContent='🚀 注册';}
}

function handlePhoneSubmit(){
  var phone=document.getElementById('authPhone').value.trim();
  if(!phone)return toastAuth('请输入手机号',1);
  if(!/^1[3-9]\d{9}$/.test(phone))return toastAuth('请输入有效的11位手机号',1);

  var grade=document.getElementById('authGrade').value;
  var direction=document.getElementById('authDirection').value;

  // ★ 立即本地登录 + 进入仪表盘（不等待云端）
  __isLoggedIn=true;
  localStorage.setItem('zjyk_logged_in','1');
  localStorage.setItem('zjyk_phone',phone);
  var phoneList=JSON.parse(localStorage.getItem('zjyk_phone_list')||'[]');
  phoneList.push({phone:phone,grade:grade,direction:direction,time:new Date().toISOString()});
  localStorage.setItem('zjyk_phone_list',JSON.stringify(phoneList));

  toastAuth('✅ 注册成功！');
  showDashboardNow();

  // ★ 后台异步同步云端（有超时，失败不影响用户）
  var id=crypto.randomUUID?crypto.randomUUID():('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16);}));
  syncToCloud({id:id,phone:phone,grade:grade,direction:direction});
}

// 供 app.js 调用
function showInputCard(){
  document.getElementById('gateCard').classList.add('hidden');
  document.getElementById('inputCard').classList.remove('hidden');
  updateUsesDisplay(-1);
}

function updateUsesDisplay(n){
  var bar=document.getElementById('usesBar');
  if(!bar)return;
  if(__isLoggedIn){
    bar.innerHTML='<span style="display:flex;align-items:center;gap:12px"><span style="color:var(--gr);font-weight:600">✅ 已登录 · 无限使用</span><button class="btn btn-gh btn-sm" id="btnLogout" style="font-size:.75rem;padding:2px 8px">退出登录</button></span>';
    setTimeout(function(){
      var bl=document.getElementById('btnLogout');
      if(bl)bl.addEventListener('click',doLogout);
    },100);
  }else if(n<0){
    bar.innerHTML='<span style="color:var(--o);font-weight:600">🎁 试用模式 · 免费 1 次</span>';
  }else{
    bar.innerHTML='剩余免费次数：<span style="font-weight:700;color:'+(n<=0?'var(--r)':'var(--g)')+'">'+n+'</span> 次';
  }
}

function doLogout(){
  __isLoggedIn=false;
  localStorage.removeItem('zjyk_logged_in');
  localStorage.removeItem('zjyk_phone');
  document.getElementById('inputCard').classList.add('hidden');
  document.getElementById('gateCard').classList.remove('hidden');
  document.getElementById('topNav').classList.add('hidden');
  toastAuth('已退出登录');
}

function checkAuthAndSpend(){
  if(__isLoggedIn)return true;
  var uses=parseInt(localStorage.getItem('zjyk_free_uses')||'0');
  if(uses>0){
    uses--;localStorage.setItem('zjyk_free_uses',uses);
    updateUsesDisplay(uses);
    return true;
  }
  var am=document.getElementById('authModal');if(am)am.classList.remove('hidden');
  return false;
}

function toastAuth(msg,err){
  var t=document.createElement('div');t.className='toast'+(err?' err':'');
  t.textContent=msg;document.body.appendChild(t);
  requestAnimationFrame(function(){t.classList.add('show');});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},2500);
}
