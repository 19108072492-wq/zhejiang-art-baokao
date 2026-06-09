/**
 * 非凡教育 · 浙江艺考志愿助手 — 极简认证（手机号收集）
 * 流程：用户输入手机号 → 匿名登录 → 手机号存入 Supabase → 无限使用
 */
var __isLoggedIn=false;

// 初始化
(async function initAuth(){
  // 检查是否已有匿名登录 session
  var s=await supabase.auth.getSession();
  if(s.data.session){
    __isLoggedIn=true;
    showInputCard();
  }else{
    document.getElementById('gateCard').classList.remove('hidden');
    document.getElementById('inputCard').classList.add('hidden');
  }

  // 引导卡片按钮：进入手机号输入弹窗
  document.getElementById('btnGateLogin').addEventListener('click',function(){
    document.getElementById('authModal').classList.remove('hidden');
  });

  // 试用按钮
  document.getElementById('btnGateTrial').addEventListener('click',doTrial);

  // 认证弹窗按钮
  document.getElementById('btnAuthSubmit').addEventListener('click',handlePhoneAuth);
  document.getElementById('btnAuthCancel').addEventListener('click',function(){
    document.getElementById('authModal').classList.add('hidden');
  });
  document.getElementById('authModal').addEventListener('click',function(e){
    if(e.target===this)this.classList.add('hidden');
  });

  // 隐藏不需要的元素
  var ep=document.getElementById('authEmail');if(ep)ep.style.display='none';
  var pp=document.getElementById('authPassword');if(pp)pp.style.display='none';
  var ps=document.getElementById('authPhone');if(ps){ps.style.display='';ps.placeholder='请输入手机号';}
  var sb=document.getElementById('btnAuthSwitch');if(sb)sb.style.display='none';
  var hh=document.getElementById('authHint');if(hh)hh.style.display='none';
  var tt=document.getElementById('authTitle');if(tt)tt.textContent='📱 输入手机号即可使用';
  var mg=document.getElementById('authMsg');if(mg)mg.textContent='输入手机号后自动登录，无需注册';
  var bts=document.getElementById('btnAuthSubmit');if(bts)bts.textContent='🚀 开始使用';
})();

function doTrial(){
  var trialed=localStorage.getItem('zjyk_trialed');
  if(trialed){
    document.getElementById('authModal').classList.remove('hidden');
    return;
  }
  localStorage.setItem('zjyk_trialed','1');
  showInputCard();
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

async function handlePhoneAuth(){
  var phone=document.getElementById('authPhone').value.trim();
  if(!phone)return toastAuth('请输入手机号',1);
  if(!/^1[3-9]\d{9}$/.test(phone))return toastAuth('请输入有效的11位手机号',1);

  var btn=document.getElementById('btnAuthSubmit');
  btn.disabled=true;btn.textContent='⏳ 登录中...';

  // 匿名登录
  var r=await supabase.auth.signInAnonymously();
  if(r.error){
    btn.disabled=false;btn.textContent='🚀 开始使用';
    return toastAuth('登录失败，请刷新页面重试',1);
  }

  // 存入手机号
  var uid=r.data.user.id;
  await supabase.from('profiles').upsert({id:uid,phone:phone});

  __isLoggedIn=true;
  toastAuth('登录成功！');
  document.getElementById('authModal').classList.add('hidden');
  showInputCard();
  btn.disabled=false;btn.textContent='🚀 开始使用';
}

// 供 app.js 调用的入口检查
async function checkAuthAndSpend(){
  if(__isLoggedIn)return true;
  var uses=parseInt(localStorage.getItem('zjyk_free_uses')||'0');
  if(uses>0){
    uses--;localStorage.setItem('zjyk_free_uses',uses);
    updateUsesDisplay(uses);
    return true;
  }
  document.getElementById('authModal').classList.remove('hidden');
  return false;
}

function toastAuth(msg,err){
  var t=document.createElement('div');t.className='toast'+(err?' err':'');
  t.textContent=msg;document.body.appendChild(t);
  requestAnimationFrame(function(){t.classList.add('show');});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},2500);
}
