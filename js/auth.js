/**
 * 非凡教育 · 浙江艺考志愿助手 — 认证系统
 * 登录：授权用户输入手机号直接登录 → 云端验证 → 完整版
 * 注册：新用户输入手机号+年级+专业方向 → 注册 → 试用版（仅分数测算+10所院校）
 */
var __isLoggedIn=false;
var __isPaidUser=false;
var __paidExpires=null;

// ===== 顾问追踪：URL 参数捕获 =====
(function(){
  var params=new URLSearchParams(window.location.search);
  var ref=params.get('ref');
  if(ref){
    localStorage.setItem('zjyk_advisor_code',ref);
    console.log('[auth] 顾问码已捕获：'+ref);
  }
})();

function initAuth(){
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
    // showDashboard 由 app.js 定义，defer 顺序已保证其先于 auth.js 执行
    if(typeof showDashboard==='function'){showDashboard();}
    else{console.error('[auth] showDashboard undefined — check script load order');}
  }else{
    var gc=document.getElementById('gateCard');if(gc)gc.classList.remove('hidden');
    var ic=document.getElementById('inputCard');if(ic)ic.classList.add('hidden');
  }
}

// 等待 app.js 就绪后再初始化认证模块
// app.js 末尾会设置 window.__appReady=true 并回调 window.__authInitPending
(function(){
  if(window.__appReady){
    // app.js 已经执行完（正常情况，auth.js 在 app.js 之后加载）
    initAuth();
  }else{
    // 万一 auth.js 先执行（不应发生，但保底）
    window.__authInitPending=initAuth;
  }
})();

function setupAuthUI(){
  // === 登录按钮 ===
  var bl=document.getElementById('btnGateLogin');
  if(bl)bl.addEventListener('click',function(){
    document.getElementById('authModal').classList.remove('hidden');
    var phoneInput=document.getElementById('authPhone');
    if(phoneInput){phoneInput.value='';phoneInput.focus();}
  });

  // === 注册按钮 ===
  var br=document.getElementById('btnGateRegister');
  if(br)br.addEventListener('click',function(){
    document.getElementById('registerModal').classList.remove('hidden');
    var rp=document.getElementById('regPhone');
    if(rp){rp.value='';rp.focus();}
  });

  // === 登录弹窗 ===
  var bs=document.getElementById('btnAuthSubmit');
  if(bs)bs.addEventListener('click',handleLogin);
  var bc=document.getElementById('btnAuthCancel');
  if(bc)bc.addEventListener('click',function(){
    document.getElementById('authModal').classList.add('hidden');
  });
  var am=document.getElementById('authModal');
  if(am)am.addEventListener('click',function(e){
    if(e.target===this)this.classList.add('hidden');
  });
  // 回车提交
  var phoneInput=document.getElementById('authPhone');
  if(phoneInput)phoneInput.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();handleLogin();}});

  // === 注册弹窗 ===
  var rs=document.getElementById('btnRegSubmit');
  if(rs)rs.addEventListener('click',handleRegister);
  var rc=document.getElementById('btnRegCancel');
  if(rc)rc.addEventListener('click',function(){
    document.getElementById('registerModal').classList.add('hidden');
  });
  var rm=document.getElementById('registerModal');
  if(rm)rm.addEventListener('click',function(e){
    if(e.target===this)this.classList.add('hidden');
  });
  // 回车提交
  var regPhoneInput=document.getElementById('regPhone');
  if(regPhoneInput)regPhoneInput.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();handleRegister();}});
}

// ===== 登录（授权用户） =====
function handleLogin(){
  var phone=document.getElementById('authPhone').value.trim();
  if(!phone)return toastAuth('authHint','请输入手机号',1);
  if(!/^1[3-9]\d{9}$/.test(phone))return toastAuth('authHint','请输入有效的11位手机号',1);

  var btn=document.getElementById('btnAuthSubmit');
  if(btn){btn.disabled=true;btn.textContent='⏳ 验证中...';}

  // 检查云端授权
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
    }else if(res&&!res.ok){
      // API调用失败
      __isPaidUser=false;
      localStorage.setItem('zjyk_is_paid','0');
      var errMsg=res.error||'未知错误';
      toast('❌ 验证失败：'+errMsg+'，请检查网络后重试',1);
    }else if(res&&res.ok&&!res.authorized&&res.expired){
      // 已过期
      __isPaidUser=false;
      localStorage.setItem('zjyk_is_paid','0');
      toast('⚠️ 授权已过期，请联系客服续费',1);
    }else{
      // 未授权 → 提示去注册或联系客服
      __isPaidUser=false;
      localStorage.setItem('zjyk_is_paid','0');
      toast('⚠️ 该手机号未授权，请先注册或联系客服开通',1);
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

// ===== 注册（新用户） =====
function handleRegister(){
  var phone=document.getElementById('regPhone').value.trim();
  var grade=document.getElementById('regGrade').value;
  var direction=document.getElementById('regDirection').value;

  if(!phone)return toastAuth('regHint','请输入手机号',1);
  if(!/^1[3-9]\d{9}$/.test(phone))return toastAuth('regHint','请输入有效的11位手机号',1);
  if(!grade)return toastAuth('regHint','请选择年级',1);
  if(!direction)return toastAuth('regHint','请选择专业方向',1);

  var btn=document.getElementById('btnRegSubmit');
  if(btn){btn.disabled=true;btn.textContent='⏳ 注册中...';}

  // 注册到 Supabase，带上顾问追踪码
  var advisorCode=localStorage.getItem('zjyk_advisor_code')||'';
  supaInsert({phone:phone,grade:grade,direction:direction,source:'register',advisor_code:advisorCode}).then(function(res){
    if(btn){btn.disabled=false;btn.textContent='✅ 注册';}

    __isLoggedIn=true;
    __isPaidUser=false;
    localStorage.setItem('zjyk_logged_in','1');
    localStorage.setItem('zjyk_phone',phone);
    localStorage.setItem('zjyk_is_paid','0');
    localStorage.setItem('zjyk_grade',grade);
    localStorage.setItem('zjyk_direction',direction);

    // 同时检查是否已被授权
    checkUserAuthorization(phone).then(function(authRes){
      if(authRes&&authRes.ok&&authRes.authorized&&authRes.data){
        __isPaidUser=true;
        localStorage.setItem('zjyk_is_paid','1');
        if(authRes.data.expires_at){
          localStorage.setItem('zjyk_paid_expires',authRes.data.expires_at);
        }
        toast('✅ 注册成功，该手机号已授权，自动解锁完整版！',0);
      }else{
        toast('🎉 注册成功！当前为试用版，仅开放分数测算功能',0);
      }
      showDashboardNow();
    }).catch(function(){
      toast('🎉 注册成功！当前为试用版，仅开放分数测算功能',0);
      showDashboardNow();
    });
  }).catch(function(e){
    if(btn){btn.disabled=false;btn.textContent='✅ 注册';}
    // 即使云端失败，也允许本地注册
    __isLoggedIn=true;
    __isPaidUser=false;
    localStorage.setItem('zjyk_logged_in','1');
    localStorage.setItem('zjyk_phone',phone);
    localStorage.setItem('zjyk_is_paid','0');
    localStorage.setItem('zjyk_grade',grade);
    localStorage.setItem('zjyk_direction',direction);
    toast('⚠️ 网络异常，已本地注册。试用版功能可用',1);
    showDashboardNow();
  });
}

function showDashboardNow(){
  document.getElementById('authModal').classList.add('hidden');
  document.getElementById('registerModal').classList.add('hidden');
  if(typeof showDashboard==='function'){showDashboard();}
  else{
    document.getElementById('gateCard').classList.add('hidden');
    var ic=document.getElementById('inputCard');if(ic)ic.classList.remove('hidden');
    var tn=document.getElementById('topNav');if(tn)tn.classList.remove('hidden');
    if(typeof switchTab==='function')switchTab('dashboard');
  }
  updatePaidUI();
}

function toastAuth(hintId,msg,type){
  var hint=document.getElementById(hintId);
  if(hint){hint.style.color=type?'var(--_red-500)':'var(--gr)';hint.textContent=msg;}
  setTimeout(function(){
    var h=document.getElementById(hintId);
    if(h){h.style.color='var(--t3)';h.textContent=hintId==='authHint'?'未注册？请返回点击"注册"':'已有账号？请返回点击"登录"';}
  },3000);
}

// ===== 付费状态 UI =====
function updatePaidUI(){
  var bar=document.getElementById('usesBar');
  var userBar=document.getElementById('userBar');
  if(!bar)return;
  // 控制付费导航链接：体验版显示但加锁样式，完整版正常显示
  var paidNavLinks=document.querySelectorAll('#topNav a[data-paid="1"]');
  for(var i=0;i<paidNavLinks.length;i++){
    if(__isPaidUser){
      paidNavLinks[i].style.display='';
      paidNavLinks[i].classList.remove('nav-locked');
    }else if(__isLoggedIn){
      // 体验版：显示但加锁标记
      paidNavLinks[i].style.display='';
      paidNavLinks[i].classList.add('nav-locked');
    }else{
      paidNavLinks[i].style.display='none';
      paidNavLinks[i].classList.remove('nav-locked');
    }
  }
  // 顶部用户栏
  if(userBar){
    if(__isLoggedIn){
      var phone=localStorage.getItem('zjyk_phone')||'';
      var statusTag=__isPaidUser
        ?'<span style="color:var(--gr);font-weight:600;font-size:.78rem">✅ 完整版</span>'
        :'<span style="color:var(--o);font-weight:600;font-size:.78rem">🎁 试用</span>';
      userBar.innerHTML='<span style="color:var(--t3);font-size:.78rem">'+esc(phone)+'</span>'+statusTag+'<button class="btn btn-gh btn-sm" id="btnLogout" style="font-size:.72rem;padding:2px 6px">退出</button>';
      userBar.classList.remove('hidden');
      var btnL=document.getElementById('btnLogout');
      if(btnL)btnL.addEventListener('click',doLogout);
    }else{
      userBar.innerHTML='';
      userBar.classList.add('hidden');
    }
  }
  if(__isPaidUser){
    var expText='';
    if(__paidExpires){
      var d=new Date(__paidExpires);
      expText='（至 '+d.toLocaleDateString('zh-CN')+'）';
    }
    bar.innerHTML='<span style="display:flex;align-items:center;gap:12px"><span style="color:var(--gr);font-weight:600">✅ 已授权 '+expText+'</span></span>';
  }else if(__isLoggedIn){
    bar.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;background:linear-gradient(135deg,var(--_brand-100),var(--_brand-50));border:1.5px solid rgba(127,94,8,.18);border-left:4px solid var(--_brand-500);border-radius:var(--rd);padding:8px 12px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:1.1rem">🎁</span><div><div style="font-size:.82rem;font-weight:700;color:var(--_ink)">体验版</div><div style="font-size:.73rem;color:#5a4b25">升级解锁院校详情/院校浏览/专业浏览等完整功能</div></div></div><button class="upgrade-banner-btn" id="btnUpgrade" style="font-size:.76rem;padding:5px 12px">🔓 升级</button></div>';
    setTimeout(function(){
      var bu=document.getElementById('btnUpgrade');
      if(bu)bu.addEventListener('click',showUpgradeModal);
    },100);
  }
}

function showUpgradeModal(source){
  var modal=document.getElementById('upgradeModal');
  if(modal){
    // 根据触发来源动态更新顶部文案
    var iconEl=modal.querySelector('.up-modal-head-icon');
    var h2El=modal.querySelector('.up-modal-head h2');
    var pEl=modal.querySelector('.up-modal-head p');
    var sourceMap={
      'form' :{icon:'📋',title:'生成志愿单',desc:'完整版才可使用，升级后解锁'},
      'cmp'  :{icon:'🔍',title:'院校对比',desc:'完整版才可使用，升级后解锁'},
      'school':{icon:'🎯',title:'院校浏览 · 文化课目标分析',desc:'查看分数差距、文化分目标'},
      'major' :{icon:'📚',title:'专业浏览 · 冲稳保分析',desc:'查看专业录取分、冲稳保匹配'}
    };
    var cfg=source&&sourceMap[source]?sourceMap[source]:{icon:'🌟',title:'升级完整版，解锁全部功能',desc:'如需了解完整版详情，请联系顾问'};
    if(iconEl)iconEl.textContent=cfg.icon;
    if(h2El)h2El.textContent=cfg.title==='升级完整版，解锁全部功能'?cfg.title:('🔒 '+cfg.title+'为完整版专属');
    if(pEl)pEl.textContent=cfg.desc;
    modal.classList.remove('hidden');
    // 点击遮罩关闭
    modal.onclick=function(e){if(e.target===modal)modal.classList.add('hidden');};
  }else{
    // 兜底：upgradeModal 不存在时降级到 alert
    alert('当前为体验版，如需了解完整版详情，请联系顾问：139-1213-1231');
  }
}

function doLogout(){
  __isLoggedIn=false;
  __isPaidUser=false;
  __paidExpires=null;
  localStorage.removeItem('zjyk_logged_in');
  localStorage.removeItem('zjyk_is_paid');
  localStorage.removeItem('zjyk_paid_expires');
  localStorage.removeItem('zjyk_phone');
  localStorage.removeItem('zjyk_grade');
  localStorage.removeItem('zjyk_direction');
  document.getElementById('gateCard').classList.remove('hidden');
  var ic=document.getElementById('inputCard');if(ic)ic.classList.add('hidden');
  var db=document.getElementById('dashboard');if(db)db.classList.add('hidden');
  var tn=document.getElementById('topNav');if(tn)tn.classList.add('hidden');
  var userBar=document.getElementById('userBar');if(userBar){userBar.innerHTML='';userBar.classList.add('hidden');}
  var bar=document.getElementById('usesBar');if(bar)bar.innerHTML='';
  toast('已退出登录',0);
}
