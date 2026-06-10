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

  // 隐藏邮箱/密码/切换按钮，只显示手机号
  var ep=document.getElementById('authEmail');if(ep)ep.style.display='none';
  var pp=document.getElementById('authPassword');if(pp)pp.style.display='none';
  var ps=document.getElementById('authPhone');if(ps){ps.style.display='';ps.placeholder='请输入手机号';}
  var sb=document.getElementById('btnAuthSwitch');if(sb)sb.style.display='none';
  var hh=document.getElementById('authHint');if(hh)hh.style.display='none';
  var tt=document.getElementById('authTitle');if(tt)tt.textContent='📱 输入手机号即可使用';
  var mg=document.getElementById('authMsg');if(mg)mg.textContent='简单注册即可继续使用完整功能';
  var bts=document.getElementById('btnAuthSubmit');if(bts)bts.textContent='🚀 开始使用';
})();

function doTrial(){
  // 始终先关闭认证弹窗、显示输入卡
  document.getElementById('authModal').classList.add('hidden');
  var trialed=localStorage.getItem('zjyk_trialed');
  if(!trialed){
    localStorage.setItem('zjyk_trialed','1');
    localStorage.setItem('zjyk_free_uses','1');
  }
  showInputCard();
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

  // 始终先在本地标记登录（注册入口不能因为云端失败而卡住）
  __isLoggedIn=true;
  localStorage.setItem('zjyk_logged_in','1');
  localStorage.setItem('zjyk_phone',phone);
  var phoneList=JSON.parse(localStorage.getItem('zjyk_phone_list')||'[]');
  phoneList.push({phone:phone,time:new Date().toISOString()});
  localStorage.setItem('zjyk_phone_list',JSON.stringify(phoneList));

  // 异步尝试写入 Supabase（不阻塞注册流程）
  var cloudOk=false;
  try{
    // 生成 UUID（profiles 表的 id 列要求 UUID 格式）
    var id=crypto.randomUUID?crypto.randomUUID():('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16);}));
    var body={id:id,phone:phone};
    // 方案1：用 supabase 客户端库
    var {error}=await supabase.from('phone_registrations').insert(body);
    if(error){
      console.warn('[Auth] supabase insert failed:',error.code,error.message);
      // 方案2：用 REST API 降级尝试
      var resp=await fetch(SUPABASE_URL+'/rest/v1/phone_registrations',{
        method:'POST',
        headers:{
          'apikey':SUPABASE_KEY,
          'Authorization':'Bearer '+SUPABASE_KEY,
          'Content-Type':'application/json',
          'Prefer':'return=minimal'
        },
        body:JSON.stringify(body)
      });
      if(resp.ok){cloudOk=true;console.log('[Auth] REST insert OK');}
      else{var e=await resp.json().catch(function(){return{};});console.error('[Auth] REST insert failed:',resp.status,e);}
    }else{cloudOk=true;console.log('[Auth] supabase insert OK');}
  }catch(e){console.error('[Auth] insert exception:',e);}

  // 注册完成
  var msg=cloudOk?'✅ 注册成功！（已同步云端）':'✅ 注册成功';
  toastAuth(msg);
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
