/**
 * 非凡教育 · 浙江艺考志愿助手 — 极简认证（零配置）
 * 流程：输入手机号 → 直接存入 Supabase → 标记已登录 → 可用
 * 不依赖任何 Auth Provider，纯 REST API
 */
var __isLoggedIn=false;

(async function initAuth(){
  // 检查 localStorage 中是否有登录标记
  var saved=localStorage.getItem('zjyk_logged_in');
  if(saved){
    __isLoggedIn=true;
    showInputCard();
  }else{
    document.getElementById('gateCard').classList.remove('hidden');
    document.getElementById('inputCard').classList.add('hidden');
  }

  // 引导卡片按钮
  document.getElementById('btnGateLogin').addEventListener('click',function(){
    document.getElementById('authModal').classList.remove('hidden');
  });
  document.getElementById('btnGateTrial').addEventListener('click',doTrial);

  // 弹窗按钮
  document.getElementById('btnAuthSubmit').addEventListener('click',handlePhoneSubmit);
  document.getElementById('btnAuthCancel').addEventListener('click',function(){
    document.getElementById('authModal').classList.add('hidden');
  });
  document.getElementById('authModal').addEventListener('click',function(e){
    if(e.target===this)this.classList.add('hidden');
  });

  // 隐藏邮箱/密码/切换按钮
  var ep=document.getElementById('authEmail');if(ep)ep.style.display='none';
  var pp=document.getElementById('authPassword');if(pp)pp.style.display='none';
  var ps=document.getElementById('authPhone');if(ps){ps.style.display='';ps.placeholder='请输入手机号';}
  var sb=document.getElementById('btnAuthSwitch');if(sb)sb.style.display='none';
  var hh=document.getElementById('authHint');if(hh)hh.style.display='none';
  var tt=document.getElementById('authTitle');if(tt)tt.textContent='📱 输入手机号即可使用';
  var mg=document.getElementById('authMsg');if(mg)mg.textContent='无需注册，输入手机号立即使用';
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

async function handlePhoneSubmit(){
  var phone=document.getElementById('authPhone').value.trim();
  if(!phone)return toastAuth('请输入手机号',1);
  if(!/^1[3-9]\d{9}$/.test(phone))return toastAuth('请输入有效的11位手机号',1);

  var btn=document.getElementById('btnAuthSubmit');
  btn.disabled=true;btn.textContent='⏳ 提交中...';

  // 直接用 REST API 写入 profiles 表（不依赖登录）
  var id='phone_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
  var resp=await fetch('https://nhewhebhbknydhcbvjnv.supabase.co/rest/v1/profiles',{
    method:'POST',
    headers:{
      'apikey':'sb_publishable_9XfINH7l5nqjYbdEy4MqTQ__5O4BhnZ',
      'Authorization':'Bearer sb_publishable_9XfINH7l5nqjYbdEy4MqTQ__5O4BhnZ',
      'Content-Type':'application/json',
      'Prefer':'return=minimal'
    },
    body:JSON.stringify({id:id,phone:phone})
  });

  if(!resp.ok){
    var err=await resp.json();
    btn.disabled=false;btn.textContent='🚀 开始使用';
    // 可能是 RLS 问题
    if(err.code==='42501'){
      return toastAuth('服务配置中，请稍后再试',1);
    }
    return toastAuth('提交失败: '+(err.message||'请重试'),1);
  }

  // 成功！标记本地登录
  __isLoggedIn=true;
  localStorage.setItem('zjyk_logged_in','1');
  localStorage.setItem('zjyk_phone',phone);
  toastAuth('✅ 登录成功！手机号已保存');
  document.getElementById('authModal').classList.add('hidden');
  showInputCard();
  btn.disabled=false;btn.textContent='🚀 开始使用';
}

// 供 app.js 调用
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
