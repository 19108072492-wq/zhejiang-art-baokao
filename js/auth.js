/**
 * 非凡教育 · 浙江艺考志愿助手 — 认证系统
 * 登录：授权用户输入手机号直接登录 → 云端验证 → 完整版
 * 注册：新用户输入手机号+年级+专业方向 → 注册 → 试用版（仅分数测算+10所院校）
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
  console.log('[Auth] 开始验证手机号:', phone);
  checkUserAuthorization(phone).then(function(res){
    if(btn){btn.disabled=false;btn.textContent='🚀 登录';}
    console.log('[Auth] 验证结果:', JSON.stringify(res));

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
      console.error('[Auth] API调用失败:', errMsg);
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
    console.error('[Auth] 网络异常:', e);
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

  // 注册到 Supabase users 表
  supaInsert({phone:phone,grade:grade,direction:direction,source:'register'}).then(function(res){
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
  // 控制付费导航链接的显隐
  var paidNavLinks=document.querySelectorAll('#topNav a[data-paid="1"]');
  for(var i=0;i<paidNavLinks.length;i++){
    paidNavLinks[i].style.display=__isPaidUser?'':'none';
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
    bar.innerHTML='<span style="color:var(--o);font-weight:600">🎁 未授权模式 · 数量限制，无法查看详情</span> <button class="btn btn-g btn-sm" id="btnUpgrade" style="font-size:.75rem;padding:2px 8px">🔓 升级完整版</button>';
    setTimeout(function(){
      var bu=document.getElementById('btnUpgrade');
      if(bu)bu.addEventListener('click',showUpgradeModal);
    },100);
  }
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
