/**
 * 非凡教育 · 浙江艺考志愿助手 — 极简认证
 * 流程：输入授权手机号 → 云端验证 → 付费/试用
 * 不依赖任何 Auth Provider，纯 REST API
 */
var __isLoggedIn=false;
var __isPaidUser=false;
var __paidExpires=null;

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
    function tryShow(){
      if(typeof showDashboard==='function'){showDashboard();}
      else{setTimeout(tryShow,80);}
    }
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
    var phoneInput=document.getElementById('authPhone');
    if(phoneInput)phoneInput.value='';
    if(phoneInput)phoneInput.focus();
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

  // 回车提交
  var phoneInput=document.getElementById('authPhone');
  if(phoneInput)phoneInput.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();handlePhoneSubmit();}});
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
  var btn=document.getElementById('btnAuthSubmit');if(btn){btn.disabled=false;btn.textContent='🚀 登录';}
}

function handlePhoneSubmit(){
  var phone=document.getElementById('authPhone').value.trim();
  if(!phone)return toastAuth('请输入手机号',1);
  if(!/^1[3-9]\d{9}$/.test(phone))return toastAuth('请输入有效的11位手机号',1);

  var btn=document.getElementById('btnAuthSubmit');
  if(btn){btn.disabled=true;btn.textContent='⏳ 验证中...';}

  // 先检查云端授权
  checkUserAuthorization(phone).then(function(res){
    if(btn){btn.disabled=false;btn.textContent='🚀 登录';}

    __isLoggedIn=true;
    localStorage.setItem('zjyk_logged_in','1');
    localStorage.setItem('zjyk_phone',phone);

    if(res&&res.ok&&res.authorized&&res.data){
      // 授权用户 → 完整版
      __isPaidUser=true;
      localStorage.setItem('zjyk_is_paid','1');
      if(res.data.expires_at){
        localStorage.setItem('zjyk_paid_expires',res.data.expires_at);
      }else{
        localStorage.removeItem('zjyk_paid_expires');
      }
      toast('✅ 欢迎回来，已解锁完整版！',0);
    }else{
      // 未授权 → 试用版
      __isPaidUser=false;
      localStorage.setItem('zjyk_is_paid','0');
      toast('🎁 试用模式已开启，仅开放部分功能',0);
    }
    showDashboardNow();
  }).catch(function(e){
    // 网络错误 → 用本地缓存
    if(btn){btn.disabled=false;btn.textContent='🚀 登录';}
    __isLoggedIn=true;
    localStorage.setItem('zjyk_logged_in','1');
    localStorage.setItem('zjyk_phone',phone);
    var paidCache=localStorage.getItem('zjyk_is_paid');
    __isPaidUser=(paidCache==='1');
    toast('⚠️ 网络异常，使用本地缓存登录',1);
    showDashboardNow();
  });
}

function toastAuth(msg,type){
  var hint=document.getElementById('authHint');
  if(hint){hint.style.color=type?'var(--_red-500)':'var(--g)';hint.textContent=msg;}
  setTimeout(function(){
    var h=document.getElementById('authHint');
    if(h){h.style.color='var(--t3)';}
  },3000);
}

// ===== 付费状态 UI =====
function updatePaidUI(){
  var bar=document.getElementById('usesBar');
  if(!bar)return;
  // 控制付费导航链接的显隐
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
  var phone=localStorage.getItem('zjyk_phone')||'';
  var msg='📞 开通完整版\n\n请添加客服微信，提供您的注册手机号：'+phone+'\n\n付费后即可解锁全部功能：\n· 志愿填报完整结果（无数量限制）\n· 院校浏览\n· 专业浏览\n· 数据分析\n\n💡 管理员确认收款后，将在后台授权您的手机号';
  alert(msg);
}

function doLogout(){
  __isLoggedIn=false;
  __isPaidUser=false;
  __paidExpires=null;
  localStorage.removeItem('zjyk_logged_in');
  localStorage.removeItem('zjyk_is_paid');
  localStorage.removeItem('zjyk_paid_expires');
  localStorage.removeItem('zjyk_phone');
  document.getElementById('gateCard').classList.remove('hidden');
  var ic=document.getElementById('inputCard');if(ic)ic.classList.add('hidden');
  var db=document.getElementById('dashboard');if(db)db.classList.add('hidden');
  var tn=document.getElementById('topNav');if(tn)tn.classList.add('hidden');
  var bar=document.getElementById('usesBar');if(bar)bar.innerHTML='';
  toast('已退出登录',0);
}
