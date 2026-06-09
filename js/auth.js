/**
 * 非凡教育 · 浙江艺考志愿助手 — 认证与次数管理
 */
var authMode='login';

// 初始化：检查现有 session + 显示剩余次数
(async function initAuth(){
  var s=await supabase.auth.getSession();
  var session=s.data.session;
  var uses=parseInt(localStorage.getItem('zjyk_free_uses')||'3');
  if(session){updateUsesDisplay(-1);}
  else{updateUsesDisplay(uses);}
  document.getElementById('btnAuthSubmit').addEventListener('click',handleAuth);
  document.getElementById('btnAuthSwitch').addEventListener('click',switchAuthMode);
  document.getElementById('btnAuthCancel').addEventListener('click',function(){
    document.getElementById('authModal').classList.add('hidden');
  });
  document.getElementById('authModal').addEventListener('click',function(e){
    if(e.target===this)this.classList.add('hidden');
  });
})();

function updateUsesDisplay(n){
  var bar=document.getElementById('usesBar');
  if(!bar)return;
  if(n<0){bar.innerHTML='<span style="color:var(--gr);font-weight:600">✅ 已登录 · 无限使用</span>';}
  else{bar.innerHTML='剩余免费次数：<span style="font-weight:700;color:'+(n<=1?'var(--r)':'var(--g)')+'">'+n+'</span> 次';}
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
    toastAuth('注册成功！已自动登录');
    document.getElementById('authModal').classList.add('hidden');
    updateUsesDisplay(-1);
  }else{
    var r2=await supabase.auth.signInWithPassword({email:email,password:password});
    if(r2.error)return toastAuth(r2.error.message,1);
    toastAuth('登录成功！');
    document.getElementById('authModal').classList.add('hidden');
    updateUsesDisplay(-1);
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
  var s=await supabase.auth.getSession();
  if(s.data.session)return true;
  var uses=parseInt(localStorage.getItem('zjyk_free_uses')||'3');
  if(uses>0){
    uses--;localStorage.setItem('zjyk_free_uses',uses);
    updateUsesDisplay(uses);
    return true;
  }
  document.getElementById('authModal').classList.remove('hidden');
  document.getElementById('authMsg').textContent='免费次数已用完（3次），注册登录后即可继续使用';
  return false;
}

function toastAuth(msg,err){
  var t=document.createElement('div');t.className='toast'+(err?' err':'');
  t.textContent=msg;document.body.appendChild(t);
  requestAnimationFrame(function(){t.classList.add('show');});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},2500);
}
