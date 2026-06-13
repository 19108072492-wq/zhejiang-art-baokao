/**
 * 非凡教育 · 浙江艺考志愿助手 — 极简认证（零配置）
 * 流程：输入手机号 → 直接存入 Supabase → 标记已登录 → 可用
 * 不依赖任何 Auth Provider，纯 REST API
 */
var __isLoggedIn=false;
var __isPaidUser=false; // 是否付费用户
var __paidExpires=null; // 付费过期时间

(function initAuth(){
  setupAuthUI();

  // 检查 localStorage 中是否有登录标记
  var saved=localStorage.getItem('zjyk_logged_in');
  if(saved){
    __isLoggedIn=true;
    // 恢复付费状态
    var paidCache=localStorage.getItem('zjyk_is_paid');
    if(paidCache==='1'){
      __isPaidUser=true;
      var expires=localStorage.getItem('zjyk_paid_expires');
      if(expires&&new Date(expires)<new Date()){
        __isPaidUser=false;
        localStorage.setItem('zjyk_is_paid','0');
      }
    }
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

// 后台同步到云端（不阻塞用户，内置超时+重试）
function syncToCloud(body){
  supaInsert(body).then(function(res){
    if(res.ok)console.log('[Auth] 云端同步成功');
    else console.warn('[Auth] 云端同步失败:',res.error);
  });
}

function doTrial(){
  document.getElementById('authModal').classList.add('hidden');
  var trialed=localStorage.getItem('zjyk_trialed');
  if(!trialed){
    localStorage.setItem('zjyk_trialed','1');
    localStorage.setItem('zjyk_free_uses','1');
  }
  __isLoggedIn=true;
  __isPaidUser=false;
  localStorage.setItem('zjyk_logged_in','1');
  localStorage.setItem('zjyk_is_paid','0');
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
  updatePaidUI();
  var btn=document.getElementById('btnAuthSubmit');if(btn){btn.disabled=false;btn.textContent='🚀 注册';}
}

function handlePhoneSubmit(){
  var phone=document.getElementById('authPhone').value.trim();
  if(!phone)return toastAuth('请输入手机号',1);
  if(!/^1[3-9]\d{9}$/.test(phone))return toastAuth('请输入有效的11位手机号',1);

  var grade=document.getElementById('authGrade').value;
  var direction=document.getElementById('authDirection').value;

  // ★ 立即本地登录
  __isLoggedIn=true;
  localStorage.setItem('zjyk_logged_in','1');
  localStorage.setItem('zjyk_phone',phone);
  // ★ 检查付费状态（异步，不阻塞用户）
  checkUserAuthorization(phone).then(function(res){
    if(res.ok&&res.authorized){
      __isPaidUser=true;
      localStorage.setItem('zjyk_is_paid','1');
      if(res.data&&res.data.expires_at){
        __paidExpires=res.data.expires_at;
        localStorage.setItem('zjyk_paid_expires',res.data.expires_at);
      }else{
        localStorage.removeItem('zjyk_paid_expires');
      }
      updatePaidUI();
    }else{
      __isPaidUser=false;
      localStorage.setItem('zjyk_is_paid','0');
      updatePaidUI();
    }
  }).catch(function(){
    // 网络错误时，使用本地缓存的付费状态
    var cached=localStorage.getItem('zjyk_is_paid');
    __isPaidUser=(cached==='1');
    updatePaidUI();
  });

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
  __isPaidUser=false;
  localStorage.removeItem('zjyk_logged_in');
  localStorage.removeItem('zjyk_phone');
  localStorage.removeItem('zjyk_is_paid');
  localStorage.removeItem('zjyk_paid_expires');
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

// ========== 付费状态 UI ==========

function updatePaidUI(){
  var bar=document.getElementById('usesBar');
  if(!bar)return;
  // ★ 控制付费导航链接的显隐
  var paidNavLinks=document.querySelectorAll('#topNav a[data-paid="1"]');
  for(var i=0;i<paidNavLinks.length;i++){
    paidNavLinks[i].style.display=__isPaidUser?'':'none';
  }
  if(__isPaidUser){
    var expText='';
    if(__paidExpires){
      var d=new Date(__paidExpires);
      expText='（至 '+d.toLocaleDateString('zh-CN')+'）';
    }
    bar.innerHTML='<span style="display:flex;align-items:center;gap:12px"><span style="color:var(--gr);font-weight:600">✅ 已授权 '+expText+'</span><button class="btn btn-gh btn-sm" id="btnLogout" style="font-size:.75rem;padding:2px 8px">退出登录</button></span>';
  }else if(__isLoggedIn){
    bar.innerHTML='<span style="color:var(--o);font-weight:600">🎁 试用模式 · 仅开放算分功能</span> <button class="btn btn-g btn-sm" id="btnUpgrade" style="font-size:.75rem;padding:2px 8px">🔓 开通完整版</button> <button class="btn btn-gh btn-sm" id="btnLogout" style="font-size:.75rem;padding:2px 8px">退出登录</button>';
    setTimeout(function(){
      var bu=document.getElementById('btnUpgrade');
      if(bu)bu.addEventListener('click',showUpgradeModal);
      var bl=document.getElementById('btnLogout');
      if(bl)bl.addEventListener('click',doLogout);
    },100);
    return;
  }
  setTimeout(function(){
    var bl=document.getElementById('btnLogout');
    if(bl)bl.addEventListener('click',doLogout);
  },100);
}

function showUpgradeModal(){
  var existing=document.getElementById('upgradeModal');
  if(existing){existing.classList.remove('hidden');return;}
  var html='<div class="mod hidden" id="upgradeModal"><div class="mod-sm">'+
    '<h3>🔓 开通完整版</h3>'+
    '<p style="font-size:.82rem;color:var(--t2);margin:12px 0">请联系非凡教育管理员，提供您的手机号，我们将为您开通完整功能授权。</p>'+
    '<div style="background:var(--color-surface-alt);padding:12px;border-radius:var(--rd);margin:12px 0;font-size:.82rem">'+
    '<div>📱 联系管理员：<strong>请在非凡教育前台咨询</strong></div>'+
    '<div style="margin-top:6px">🎁 开通后可使用：</div>'+
    '<ul style="margin:6px 0 0 16px;color:var(--gr)">'+
    '<li>完整志愿填报算分（无数量限制）</li>'+
    '<li>院校浏览（全部）</li>'+
    '<li>专业浏览（全部）</li>'+
    '<li>志愿单生成与导出</li>'+
    '</ul></div>'+
    '<div style="display:flex;gap:8px;margin-top:12px">'+
    '<button class="btn btn-g" id="btnUpgradeClose">关闭</button>'+
    '</div></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);
  document.getElementById('btnUpgradeClose').addEventListener('click',function(){document.getElementById('upgradeModal').classList.add('hidden');});
  document.getElementById('upgradeModal').addEventListener('click',function(e){if(e.target===this)this.classList.add('hidden');});
}
