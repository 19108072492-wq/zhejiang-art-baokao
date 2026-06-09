/**
 * 非凡教育 · 浙江艺考志愿助手 — 认证与次数管理 v2
 */
var authMode='register';

// 页面加载时默认显示注册界面
(function(){
  var t=document.getElementById('authTitle');
  if(t)t.textContent='📝 注册账号';
  var b=document.getElementById('btnAuthSubmit');
  if(b)b.textContent='注册';
  var s=document.getElementById('btnAuthSwitch');
  if(s)s.textContent='去登录';
  var h=document.getElementById('authHint');
  if(h)h.textContent='已有账号？点击"去登录"';
  var p=document.getElementById('authPhone');
  if(p)p.style.display='';
})();

// 初始化认证状态
var __isLoggedIn=false;
(async function initAuth(){
  var s=await supabase.auth.getSession();
  var session=s.data.session;
  if(session){
    __isLoggedIn=true;
    showInputCard();
    updateUsesDisplay(-1);
  }else{
    // 未登录：显示引导卡片，隐藏输入卡片
    document.getElementById('gateCard').classList.remove('hidden');
    document.getElementById('inputCard').classList.add('hidden');
  }

  // 引导卡片按钮
  document.getElementById('btnGateLogin').addEventListener('click',function(){
    document.getElementById('authModal').classList.remove('hidden');
    document.getElementById('authMsg').textContent='注册登录后即可使用完整的志愿填报功能';
  });
  document.getElementById('btnGateTrial').addEventListener('click',doTrial);

  // 认证弹窗事件
  document.getElementById('btnAuthSubmit').addEventListener('click',handleAuth);
  document.getElementById('btnAuthSwitch').addEventListener('click',switchAuthMode);
  document.getElementById('btnAuthCancel').addEventListener('click',function(){
    document.getElementById('authModal').classList.add('hidden');
  });
  document.getElementById('authModal').addEventListener('click',function(e){
    if(e.target===this)this.classList.add('hidden');
  });

  // 如果之前试用过，显示试用状态
  var trialed=localStorage.getItem('zjyk_trialed');
  if(trialed){
    document.getElementById('gateCard').querySelector('.card-sub').textContent='你已用尽免费体验次数，请注册登录后继续使用';
    document.getElementById('btnGateTrial').disabled=true;
    document.getElementById('btnGateTrial').textContent='✅ 已体验';
    document.getElementById('btnGateTrial').style.opacity='0.5';
  }
})();

function doTrial(){
  var trialed=localStorage.getItem('zjyk_trialed');
  if(trialed){
    document.getElementById('authModal').classList.remove('hidden');
    document.getElementById('authMsg').textContent='免费体验次数已用完，注册登录后即可继续使用';
    return;
  }
  // 标记已试用
  localStorage.setItem('zjyk_trialed','1');
  // 显示输入卡片
  showInputCard();
  // 标记"试用中"：只能使用1次
  localStorage.setItem('zjyk_free_uses','1');
}

function showInputCard(){
  document.getElementById('gateCard').classList.add('hidden');
  document.getElementById('inputCard').classList.remove('hidden');
  updateUsesDisplay(-1);
}

function updateUsesDisplay(n){
  var bar=document.getElementById('usesBar');
  if(!bar)return;
  if(__isLoggedIn){
    bar.innerHTML='<span style="color:var(--gr);font-weight:600">✅ 已登录 · 无限使用</span>';
  }else if(n<0){
    bar.innerHTML='<span style="color:var(--o);font-weight:600">🎁 试用模式 · 免费 1 次</span>';
  }else{
    bar.innerHTML='剩余免费次数：<span style="font-weight:700;color:'+(n<=0?'var(--r)':'var(--g)')+'">'+n+'</span> 次';
  }
}

async function handleAuth(){
  var email=document.getElementById('authEmail').value.trim();
  var password=document.getElementById('authPassword').value.trim();
  var phone=document.getElementById('authPhone').value.trim();
  if(!email||!password)return toastAuth('请填写邮箱和密码',1);
  if(password.length<6)return toastAuth('密码至少6位',1);

  if(authMode==='register'){
    var r=await supabase.auth.signUp({email:email,password:password});
    if(r.error)return toastAuth(r.error.message,1);
    if(phone&&r.data.user){
      await supabase.from('profiles').upsert({id:r.data.user.id,phone:phone});
    }
    __isLoggedIn=true;
    toastAuth('注册成功！已自动登录');
    document.getElementById('authModal').classList.add('hidden');
    showInputCard();
  }else{
    var r2=await supabase.auth.signInWithPassword({email:email,password:password});
    if(r2.error)return toastAuth(r2.error.message,1);
    __isLoggedIn=true;
    toastAuth('登录成功！');
    document.getElementById('authModal').classList.add('hidden');
    showInputCard();
  }
}

function switchAuthMode(){
  if(authMode==='login'){
    authMode='register';
    document.getElementById('authTitle').textContent='📝 注册账号';
    document.getElementById('btnAuthSubmit').textContent='注册';
    document.getElementById('btnAuthSwitch').textContent='去登录';
    document.getElementById('authHint').textContent='已有账号？点击"去登录"';
    document.getElementById('authPhone').style.display='';
  }else{
    authMode='login';
    document.getElementById('authTitle').textContent='🔐 登录后继续使用';
    document.getElementById('btnAuthSubmit').textContent='登录';
    document.getElementById('btnAuthSwitch').textContent='去注册';
    document.getElementById('authHint').textContent='没有账号？点击"去注册"';
    document.getElementById('authPhone').style.display='none';
  }
}

// 供 app.js 调用的入口检查
async function checkAuthAndSpend(){
  if(__isLoggedIn)return true;
  // 试用模式：检查剩余次数
  var uses=parseInt(localStorage.getItem('zjyk_free_uses')||'0');
  if(uses>0){
    uses--;localStorage.setItem('zjyk_free_uses',uses);
    updateUsesDisplay(uses);
    return true;
  }
  // 次数用完
  document.getElementById('authModal').classList.remove('hidden');
  document.getElementById('authMsg').textContent='免费次数已用完，注册登录后即可继续使用';
  return false;
}

function toastAuth(msg,err){
  var t=document.createElement('div');t.className='toast'+(err?' err':'');
  t.textContent=msg;document.body.appendChild(t);
  requestAnimationFrame(function(){t.classList.add('show');});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},2500);
}
