
"use client";
import { useState, useRef, useEffect, useCallback } from "react";


// ════════════════════════════════════════════════════════════════
//  SUPABASE CLIENT
// ════════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://ypdulxgrtlksqkgylrwc.supabase.co";
const SUPABASE_KEY = "sb_publishable_v3JziLlzJrd-x6RFIkzZig_szdQO_6c";

const sb = {
  headers() {
    return {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    };
  },

  async query(table, options = {}) {
    const params = [];
    if (options.select) params.push(`select=${encodeURIComponent(options.select)}`);
    if (options.eq) Object.entries(options.eq).forEach(([k,v]) => params.push(`${k}=eq.${encodeURIComponent(v)}`));
    const url = `${SUPABASE_URL}/rest/v1/${table}?${params.join("&")}`;
    const headers = { ...this.headers(), ...(options.single ? { "Accept": "application/vnd.pgrst.object+json" } : {}) };
    try {
      const res = await fetch(url, { headers });
      const text = await res.text();
      if (!res.ok) return { data: null, error: text };
      const data = text ? JSON.parse(text) : (options.single ? null : []);
      return { data, error: null };
    } catch(e) { return { data: null, error: e.message }; }
  },

  async insert(table, body) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...this.headers(), "Prefer": "return=representation" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) return { data: null, error: text };
      const data = text ? JSON.parse(text) : null;
      return { data: Array.isArray(data) ? data[0] : data, error: null };
    } catch(e) { return { data: null, error: e.message }; }
  },

  async update(table, body, eq) {
    const qs = Object.entries(eq).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
        method: "PATCH",
        headers: { ...this.headers(), "Prefer": "return=representation" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) return { data: null, error: text };
      return { data: text ? JSON.parse(text) : null, error: null };
    } catch(e) { return { data: null, error: e.message }; }
  },

  async remove(table, eq) {
    const qs = Object.entries(eq).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
        method: "DELETE",
        headers: this.headers(),
      });
      return { error: res.ok ? null : await res.text() };
    } catch(e) { return { error: e.message }; }
  },
};

// ════════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════════
const fmt   = n  => `${Number(n||0).toFixed(2)} €`;
const today = new Date().toISOString().slice(0,10);
const GOLD  = "#C9A84C";
const BARBER_COLORS = ["#E74C3C","#3498DB","#2ECC71","#9B59B6","#E67E22","#1ABC9C","#F39C12","#E91E63"];
const DEFAULT_SERVICES = [
  {name:"Corte de pelo",price:15},{name:"Afeitado",price:12},{name:"Arreglo de barba",price:10},
  {name:"Corte + Barba",price:25},{name:"Tinte",price:35},{name:"Tratamiento",price:20},
];
const SLOTS_15 = (() => {
  const s=[];
  for(let h=8;h<21;h++) for(let m=0;m<60;m+=15)
    s.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  return s;
})();
const DAYS_ES   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getWeekDays(dateStr) {
  const d=new Date(dateStr),day=d.getDay();
  const mon=new Date(d); mon.setDate(d.getDate()-(day===0?6:day-1));
  return Array.from({length:7},(_,i)=>{ const x=new Date(mon); x.setDate(mon.getDate()+i); return x.toISOString().slice(0,10); });
}

// ════════════════════════════════════════════════════════════════
//  DEVICE HOOK
// ════════════════════════════════════════════════════════════════
function useDevice() {
  const get=()=>window.innerWidth<640?"mobile":window.innerWidth<1024?"tablet":"desktop";
  const [d,setD]=useState(get);
  useEffect(()=>{ const h=()=>setD(get()); window.addEventListener("resize",h); return ()=>window.removeEventListener("resize",h); },[]);
  return d;
}

// ════════════════════════════════════════════════════════════════
//  UI PRIMITIVES
// ════════════════════════════════════════════════════════════════
function FG({label,children}) {
  return <div style={{display:"flex",flexDirection:"column",gap:6}}><label style={C.fl}>{label}</label>{children}</div>;
}
function Spinner({label="Cargando..."}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:60,color:"#666"}}>
      <div style={{width:36,height:36,border:"3px solid #222",borderTop:`3px solid ${GOLD}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <span style={{fontSize:13}}>{label}</span>
    </div>
  );
}
function Modal({title,onClose,children,footer,width=460}) {
  return (
    <div style={C.overlay} onClick={onClose}>
      <div style={{...C.modal,width,maxWidth:"96vw"}} onClick={e=>e.stopPropagation()}>
        <div style={C.mHead}><span style={C.mTitle}>{title}</span><button style={C.mX} onClick={onClose}>✕</button></div>
        <div style={C.mBody}>{children}</div>
        {footer&&<div style={C.mFoot}>{footer}</div>}
      </div>
    </div>
  );
}
function DeviceBadge({device}) {
  const icons={mobile:"📱",tablet:"📟",desktop:"🖥"};
  return <div style={{position:"fixed",bottom:12,right:12,background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:20,padding:"4px 10px",fontSize:10,color:"#555",zIndex:999,pointerEvents:"none",fontFamily:"monospace"}}>{icons[device]} {device}</div>;
}

// ════════════════════════════════════════════════════════════════
//  LOGO MODAL
// ════════════════════════════════════════════════════════════════
function LogoModal({shop,onSave,onClose}) {
  const [name,setName]=useState(shop.name);
  const [logo,setLogo]=useState(shop.logo_url||null);
  const [drag,setDrag]=useState(false);
  const [saving,setSaving]=useState(false);
  const fileRef=useRef();
  const readFile=f=>{ if(!f||!f.type.startsWith("image/")) return; const r=new FileReader(); r.onload=e=>setLogo(e.target.result); r.readAsDataURL(f); };
  return (
    <Modal title="✏ Identidad de la barbería" onClose={onClose}
      footer={<><button style={C.btnSec} onClick={onClose}>Cancelar</button><button style={{...C.btnPri,background:shop.color||GOLD,opacity:saving?0.6:1}} onClick={async()=>{setSaving(true);await onSave({name:name.trim()||shop.name,logo_url:logo});setSaving(false);}}>{saving?"Guardando…":"Guardar"}</button></>}>
      <div style={{background:"#111",borderRadius:12,padding:14,border:"1px solid #2a2a2a"}}>
        <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>VISTA PREVIA</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={C.logoBox}>{logo?<img src={logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:22,color:shop.color||GOLD}}>✂</span>}</div>
          <div><div style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>{name||"Nombre"}</div><div style={{fontSize:11,color:shop.color||GOLD,marginTop:3}}>✏ Editar logo</div></div>
        </div>
      </div>
      <FG label="Nombre"><input style={C.fi} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre de la barbería"/></FG>
      <FG label="Logo / Foto">
        <div style={{...C.dropZone,...(drag?{borderColor:shop.color||GOLD}:{})}}
          onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);readFile(e.dataTransfer.files[0])}}
          onClick={()=>fileRef.current.click()}>
          {logo?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><img src={logo} alt="" style={{width:64,height:64,borderRadius:12,objectFit:"cover",border:"2px solid #333"}}/><span style={{fontSize:12,color:"#777"}}>Clic para cambiar</span></div>
            :<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><div style={{fontSize:32}}>📷</div><div style={{color:"#888",fontSize:13}}>Arrastra o haz clic</div><div style={{color:"#555",fontSize:11}}>PNG · JPG · WEBP</div></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>readFile(e.target.files[0])}/>
        {logo&&<button style={{background:"none",border:"none",color:"#E74C3C",cursor:"pointer",fontSize:12,padding:0,marginTop:6}} onClick={()=>setLogo(null)}>✕ Eliminar foto</button>}
      </FG>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
//  AUTH SCREEN
// ════════════════════════════════════════════════════════════════
function AuthScreen({onLogin,device}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [shopName,setShopName]=useState("");
  const [address,setAddress]=useState("");
  const [phone,setPhone]=useState("");
  const [pin,setPin]=useState("");
  const [verifyCode,setVerifyCode]=useState("");
  const [sentCode,setSentCode]=useState("");
  const [pendingShop,setPendingShop]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const isMobile=device==="mobile";

  const doLogin=async()=>{
    setErr(""); setLoading(true);
    const {data,error}=await sb.query("workshops",{select:"*",eq:{email:email.trim(),password_hash:pass},single:true});
    if(error||!data){
      setErr(error?"Error Supabase: "+JSON.stringify(error):"Email o contraseña incorrectos.");
    } else if(data.verified===false){
      setErr("Cuenta pendiente de verificación.");
    } else {
      onLogin(data);
    }
    setLoading(false);
  };

  const doRegister=async()=>{
    setErr("");
    if(!shopName.trim()||!email.trim()||!pass||!pin){setErr("Rellena todos los campos obligatorios.");return;}
    if(pass.length<6){setErr("La contraseña debe tener al menos 6 caracteres.");return;}
    if(pin.length<4){setErr("El PIN debe tener al menos 4 dígitos.");return;}
    setLoading(true);
    const code=String(Math.floor(100000+Math.random()*900000));
    const {data,error}=await sb.insert("workshops",{
      name:shopName.trim(), email:email.trim(), password_hash:pass,
      address:address.trim(), phone:phone.trim(), owner_pin:pin,
      color:GOLD, logo_url:null, verified:false, verify_code:code, schedule:"",
    });
    if(error||!data){setErr("Error al registrar: "+JSON.stringify(error||"sin respuesta"));setLoading(false);return;}
    await Promise.all(DEFAULT_SERVICES.map(s=>sb.insert("services",{workshop_id:data.id,name:s.name,price:s.price})));
    setSentCode(code); setPendingShop(data); setMode("verify");
    setLoading(false);
  };

  const doVerify=async()=>{
    setErr(""); setLoading(true);
    const {data}=await sb.query("workshops",{select:"verify_code,id",eq:{id:pendingShop.id},single:true});
    if(!data||data.verify_code!==verifyCode.trim()){setErr("Código incorrecto.");setLoading(false);return;}
    await sb.update("workshops",{verified:true,verify_code:null},{id:pendingShop.id});
    setMode("approved"); setLoading(false);
  };

  const p=isMobile?16:32;
  return (
    <div style={{minHeight:"100vh",background:"#0D0D0D",display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div className="fade-in" style={{background:"#141414",border:"1px solid #222",borderRadius:isMobile?16:24,width:isMobile?"100%":440,maxWidth:"100%",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#1a1505,#0D0D0D)",padding:`${isMobile?28:40}px ${p}px ${isMobile?24:30}px`,textAlign:"center",borderBottom:"1px solid #222"}}>
          <div style={{fontSize:isMobile?38:50,marginBottom:10}}>✂</div>
          <div style={{fontSize:isMobile?26:32,fontWeight:900,color:"#fff",fontFamily:"Georgia,serif",letterSpacing:6}}>BARBER<span style={{color:GOLD}}>PRO</span></div>
          <div style={{fontSize:12,color:"#666",marginTop:6,letterSpacing:1}}>Gestión para barberías modernas</div>
        </div>

        {(mode==="login"||mode==="register")&&(
          <div style={{display:"flex",borderBottom:"1px solid #222"}}>
            {[["login","Iniciar sesión"],["register","Registrar barbería"]].map(([m,l])=>(
              <button key={m} style={{flex:1,background:"none",border:"none",color:mode===m?"#fff":"#555",cursor:"pointer",padding:"13px 8px",fontSize:13,fontWeight:700,borderBottom:mode===m?`2px solid ${GOLD}`:"2px solid transparent"}} onClick={()=>{setMode(m);setErr("");}}>
                {l}
              </button>
            ))}
          </div>
        )}

        {mode==="login"&&(
          <div style={{padding:`22px ${p}px`,display:"flex",flexDirection:"column",gap:14}}>
            <FG label="Email"><input style={C.fi} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@barberia.es" onKeyDown={e=>e.key==="Enter"&&doLogin()}/></FG>
            <FG label="Contraseña"><input style={C.fi} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&doLogin()}/></FG>
            {err&&<div style={C.errBox}>{err}</div>}
            <button style={{...C.btnPri,background:GOLD,opacity:loading?0.6:1}} onClick={doLogin} disabled={loading}>
              {loading?<span>⏳ Conectando…</span>:"ACCEDER"}
            </button>
          </div>
        )}

        {mode==="register"&&(
          <div style={{padding:`22px ${p}px`,display:"flex",flexDirection:"column",gap:14}}>
            <FG label="Nombre de la barbería *"><input style={C.fi} value={shopName} onChange={e=>setShopName(e.target.value)} placeholder="Ej: The Royal Cut"/></FG>
            <FG label="Email *"><input style={C.fi} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="barberia@email.com"/></FG>
            <FG label="Contraseña * (mín. 6 caracteres)"><input style={C.fi} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/></FG>
            <FG label="Dirección"><input style={C.fi} value={address} onChange={e=>setAddress(e.target.value)} placeholder="Calle, número, ciudad"/></FG>
            <FG label="Teléfono"><input style={C.fi} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="600 000 000"/></FG>
            <FG label="PIN del propietario * (4+ dígitos)"><input style={C.fi} type="password" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/,"").slice(0,8))} placeholder="Solo números"/></FG>
            <div style={{background:"#1a1505",border:"1px solid #3a2a05",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#aaa",lineHeight:1.6}}>
              📧 Se enviará un código de verificación a <strong style={{color:GOLD}}>J.ventas.adan@gmail.com</strong>
            </div>
            {err&&<div style={C.errBox}>{err}</div>}
            <button style={{...C.btnPri,background:GOLD,opacity:loading?0.6:1}} onClick={doRegister} disabled={loading}>{loading?"Registrando…":"SOLICITAR REGISTRO"}</button>
          </div>
        )}

        {mode==="verify"&&(
          <div style={{padding:`24px ${p}px`,display:"flex",flexDirection:"column",gap:16}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>📬</div>
              <div style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>Verificación enviada</div>
              <div style={{fontSize:13,color:"#666",marginTop:8}}>Código enviado a <strong style={{color:GOLD}}>J.ventas.adan@gmail.com</strong></div>
            </div>
            <div style={{background:"#111",border:"1px solid #333",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>Código de verificación</div>
              <div style={{fontSize:28,fontWeight:900,color:GOLD,fontFamily:"monospace",letterSpacing:8}}>{sentCode}</div>
            </div>
            <FG label="Introduce el código">
              <input style={{...C.fi,textAlign:"center",fontSize:22,letterSpacing:8}} value={verifyCode} onChange={e=>setVerifyCode(e.target.value.replace(/\D/,"").slice(0,6))} placeholder="000000" maxLength={6}/>
            </FG>
            {err&&<div style={C.errBox}>{err}</div>}
            <button style={{...C.btnPri,background:GOLD,opacity:loading?0.6:1}} onClick={doVerify} disabled={loading}>{loading?"Verificando…":"VERIFICAR"}</button>
            <button style={C.btnSec} onClick={()=>setMode("login")}>Volver al inicio</button>
          </div>
        )}

        {mode==="approved"&&(
          <div style={{padding:`28px ${p}px`,display:"flex",flexDirection:"column",gap:16,alignItems:"center",textAlign:"center"}}>
            <div style={{fontSize:48}}>✅</div>
            <div style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>¡Barbería verificada!</div>
            <div style={{fontSize:13,color:"#888",lineHeight:1.7}}><strong style={{color:"#fff"}}>{pendingShop?.name}</strong> está lista.<br/>Ya puedes iniciar sesión.</div>
            <button style={{...C.btnPri,background:GOLD,width:"100%"}} onClick={()=>{setEmail(pendingShop?.email||"");setPass("");setMode("login");}}>IR AL INICIO DE SESIÓN</button>
          </div>
        )}
      </div>
      <DeviceBadge device={device}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ROOT APP
// ════════════════════════════════════════════════════════════════
function App() {
  const device=useDevice();
  const [workshop,setWorkshop]=useState(null);
  const [shopData,setShopData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [tab,setTab]=useState("calendar");
  const [showLogo,setShowLogo]=useState(false);

  const loadShopData=useCallback(async(wid)=>{
    setLoading(true);
    const [bRes,sRes,aRes]=await Promise.all([
      sb.query("barbers",     {select:"*",eq:{workshop_id:wid}}),
      sb.query("services",    {select:"*",eq:{workshop_id:wid}}),
      sb.query("appointments",{select:"*",eq:{workshop_id:wid}}),
    ]);
    setShopData({barbers:bRes.data||[],services:sRes.data||[],appointments:aRes.data||[]});
    setLoading(false);
  },[]);

  const handleLogin=useCallback((w)=>{setWorkshop(w);loadShopData(w.id);setTab("calendar");},[loadShopData]);
  const handleLogout=()=>{setWorkshop(null);setShopData(null);};

  const saveLogo=async({name,logo_url})=>{
    await sb.update("workshops",{name,logo_url},{id:workshop.id});
    setWorkshop(w=>({...w,name,logo_url})); setShowLogo(false);
  };
  const addAppointment=useCallback(async(rec)=>{
    const now=new Date().toTimeString().slice(0,5);
    const {data,error}=await sb.insert("appointments",{
      workshop_id:workshop.id, barber_id:rec.barberId||null,
      type:rec.type||"charge", client:rec.client||null,
      service_name:rec.serviceName, price:rec.price,
      payment:rec.payment||null, paid:rec.paid||false,
      date:rec.date, time:rec.time||now,
      barber_name:rec.barberName||null, barber_color:rec.color||null,
    });
    if(!error&&data) setShopData(p=>({...p,appointments:[...p.appointments,data]}));
    else if(error) alert("Error guardando: "+error);
  },[workshop]);

  const addBarber=useCallback(async({name,avatar,color})=>{
    const {data,error}=await sb.insert("barbers",{workshop_id:workshop.id,name,avatar,color});
    if(!error&&data) setShopData(p=>({...p,barbers:[...p.barbers,data]}));
  },[workshop]);

  const removeBarber=useCallback(async(id)=>{
    await sb.remove("barbers",{id});
    setShopData(p=>({...p,barbers:p.barbers.filter(b=>b.id!==id)}));
  },[]);

  const updateServices=useCallback(async(services)=>{
    await Promise.all(services.map(s=>
      s._new ? sb.insert("services",{workshop_id:workshop.id,name:s.name,price:s.price})
             : sb.update("services",{name:s.name,price:s.price},{id:s.id})
    ));
    const {data}=await sb.query("services",{select:"*",eq:{workshop_id:workshop.id}});
    setShopData(p=>({...p,services:data||[]}));
  },[workshop]);

  const deleteService=useCallback(async(id)=>{
    await sb.remove("services",{id});
    setShopData(p=>({...p,services:p.services.filter(s=>s.id!==id)}));
  },[]);

  const updateWorkshopInfo=useCallback(async(fields)=>{
    const {error}=await sb.update("workshops",fields,{id:workshop.id});
    if(!error) setWorkshop(w=>({...w,...fields}));
    return error;
  },[workshop]);

  if(!workshop) return <AuthScreen onLogin={handleLogin} device={device}/>;
  if(loading||!shopData) return <div style={{minHeight:"100vh",background:"#0D0D0D",display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner label="Cargando tu barbería…"/></div>;

  const ac=workshop.color||GOLD;
  const NAV=[{id:"calendar",icon:"📅",label:"Calendario"},{id:"barbers",icon:"💈",label:"Barberos"},{id:"settings",icon:"⚙️",label:"Configuración"}];
  const tabProps={workshop,shopData,setShopData,accentColor:ac,device,addAppointment,addBarber,removeBarber,updateServices,deleteService,updateWorkshopInfo};

  const isMobile=device==="mobile";
  const isTablet=device==="tablet";

  const SidebarLogo=()=>(
    <div style={{padding:"16px 12px 12px",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:isTablet?38:50,height:isTablet?38:50,borderRadius:isTablet?10:13,overflow:"hidden",background:"#1a1a1a",border:"1.5px solid #2a2a2a",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={()=>setShowLogo(true)}>
        {workshop.logo_url?<img src={workshop.logo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:isTablet?16:24,color:ac}}>✂</span>}
      </div>
      {!isTablet&&<div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{workshop.name}</div>
        <button style={{background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,color:ac,padding:0,marginTop:2}} onClick={()=>setShowLogo(true)}>✏ Editar logo</button>
      </div>}
    </div>
  );

  if(isMobile) return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#0D0D0D",overflow:"hidden"}}>
      <header style={{background:"#141414",borderBottom:"1px solid #222",padding:"0 14px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:34,height:34,borderRadius:9,overflow:"hidden",background:"#1a1a1a",border:"1px solid #2a2a2a",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={()=>setShowLogo(true)}>
            {workshop.logo_url?<img src={workshop.logo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:16,color:ac}}>✂</span>}
          </div>
          <div><div style={{fontSize:12,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>{workshop.name}</div>
            <button style={{background:"none",border:"none",color:ac,fontSize:9,padding:0,cursor:"pointer",fontWeight:600}} onClick={()=>setShowLogo(true)}>✏ Editar</button></div>
        </div>
        <button style={{background:"none",border:"1px solid #333",color:"#666",cursor:"pointer",padding:"4px 10px",borderRadius:6,fontSize:11}} onClick={handleLogout}>Salir</button>
      </header>
      <div style={{flex:1,overflow:"auto"}} className="fade-in">
        {tab==="calendar"&&<CalendarTab {...tabProps}/>}
        {tab==="barbers" &&<BarbersTab  {...tabProps}/>}
        {tab==="settings"&&<SettingsTab {...tabProps}/>}
      </div>
      <nav style={{background:"#141414",borderTop:"1px solid #222",display:"flex",flexShrink:0}}>
        {NAV.map(n=>(
          <button key={n.id} style={{flex:1,background:"none",border:"none",color:tab===n.id?ac:"#666",cursor:"pointer",padding:"9px 0 7px",display:"flex",flexDirection:"column",alignItems:"center",gap:2}} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:20}}>{n.icon}</span>
            <span style={{fontSize:9,fontWeight:700}}>{n.label}</span>
            {tab===n.id&&<div style={{width:16,height:2,borderRadius:1,background:ac}}/>}
          </button>
        ))}
      </nav>
      {showLogo&&<LogoModal shop={workshop} onSave={saveLogo} onClose={()=>setShowLogo(false)}/>}
      <DeviceBadge device={device}/>
    </div>
  );

  if(isTablet) return (
    <div style={{display:"flex",height:"100vh",background:"#0D0D0D",overflow:"hidden"}}>
      <aside style={{width:64,background:"#141414",borderRight:"1px solid #222",display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",flexShrink:0}}>
        <SidebarLogo/>
        <button style={{background:"none",border:"none",color:ac,fontSize:9,cursor:"pointer",marginBottom:10,fontWeight:700}} onClick={()=>setShowLogo(true)}>✏</button>
        <div style={{width:"80%",height:1,background:"#222",marginBottom:8}}/>
        {NAV.map(n=>(
          <button key={n.id} style={{width:46,height:46,background:tab===n.id?"#1e1e1e":"none",border:"none",borderRadius:11,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,marginBottom:3,position:"relative"}} onClick={()=>setTab(n.id)}>
            {tab===n.id&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,borderRadius:2,background:ac}}/>}
            <span style={{fontSize:18}}>{n.icon}</span>
            <span style={{fontSize:7,color:tab===n.id?ac:"#666",fontWeight:700,textTransform:"uppercase"}}>{n.label.slice(0,5)}</span>
          </button>
        ))}
        <button style={{marginTop:"auto",background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:16}} onClick={handleLogout} title="Salir">⬅</button>
      </aside>
      <main style={{flex:1,overflow:"auto"}} className="fade-in">
        {tab==="calendar"&&<CalendarTab {...tabProps}/>}
        {tab==="barbers" &&<BarbersTab  {...tabProps}/>}
        {tab==="settings"&&<SettingsTab {...tabProps}/>}
      </main>
      {showLogo&&<LogoModal shop={workshop} onSave={saveLogo} onClose={()=>setShowLogo(false)}/>}
      <DeviceBadge device={device}/>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:"#0D0D0D",overflow:"hidden"}}>
      <aside style={{width:220,background:"#141414",borderRight:"1px solid #222",display:"flex",flexDirection:"column",flexShrink:0}}>
        <SidebarLogo/>
        <div style={{height:1,background:"#222",margin:"0 12px"}}/>
        <nav style={{flex:1,padding:"12px 8px",display:"flex",flexDirection:"column",gap:3}}>
          {NAV.map(n=>(
            <button key={n.id} style={{background:tab===n.id?"#1e1e1e":"none",border:"none",color:tab===n.id?"#fff":"#888",cursor:"pointer",padding:"11px 14px",borderRadius:9,display:"flex",alignItems:"center",gap:11,fontSize:13,fontWeight:600,textAlign:"left",position:"relative",transition:"all .2s"}} onClick={()=>setTab(n.id)}>
              {tab===n.id&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,borderRadius:2,background:ac}}/>}
              <span style={{fontSize:17}}>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <button style={{background:"none",border:"none",color:"#555",cursor:"pointer",padding:"12px 18px",fontSize:12,textAlign:"left"}} onClick={handleLogout}>← Cerrar sesión</button>
      </aside>
      <main style={{flex:1,overflow:"auto"}} className="fade-in">
        {tab==="calendar"&&<CalendarTab {...tabProps}/>}
        {tab==="barbers" &&<BarbersTab  {...tabProps}/>}
        {tab==="settings"&&<SettingsTab {...tabProps}/>}
      </main>
      {showLogo&&<LogoModal shop={workshop} onSave={saveLogo} onClose={()=>setShowLogo(false)}/>}
      <DeviceBadge device={device}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  CALENDAR TAB
// ════════════════════════════════════════════════════════════════
function CalendarTab({shopData,accentColor:ac,device,addAppointment}) {
  const isMobile=device==="mobile",isTablet=device==="tablet";
  const [view,setView]=useState("week");
  const [cur,setCur]=useState(today);
  const [apptModal,setApptModal]=useState(false);
  const [chargeModal,setChargeModal]=useState(false);
  const [selDate,setSelDate]=useState(today);
  const [selTime,setSelTime]=useState("09:00");

  const navDate=dir=>{ const d=new Date(cur); view==="day"?d.setDate(d.getDate()+dir):d.setDate(d.getDate()+dir*7); setCur(d.toISOString().slice(0,10)); };
  const label=()=>{ const d=new Date(cur); if(view==="day") return `${d.getDate()} de ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`; const w=getWeekDays(cur),a=new Date(w[0]),b=new Date(w[6]); return `${a.getDate()}–${b.getDate()} ${MONTHS_ES[b.getMonth()].slice(0,3)} ${b.getFullYear()}`; };
  const openSlot=(date,time)=>{setSelDate(date);setSelTime(time);setApptModal(true);};
  const p=isMobile?12:isTablet?18:28;

  return (
    <div style={{padding:p,maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isMobile?12:20,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:isMobile?20:26,fontWeight:900,color:"#fff",fontFamily:"Georgia,serif"}}>Calendario</div>
          <div style={{fontSize:isMobile?11:13,color:"#666",marginTop:2}}>{label()}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",background:"#1a1a1a",borderRadius:8,overflow:"hidden",border:"1px solid #333"}}>
            {["day","week"].map(v=>(
              <button key={v} style={{background:view===v?ac:"none",border:"none",color:view===v?"#111":"#888",cursor:"pointer",padding:isMobile?"6px 10px":"8px 14px",fontSize:isMobile?11:13,fontWeight:600}} onClick={()=>setView(v)}>
                {v==="day"?"Día":"Semana"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:4}}>
            <button style={C.arrowBtn} onClick={()=>navDate(-1)}>‹</button>
            <button style={C.arrowBtn} onClick={()=>setCur(today)}>Hoy</button>
            <button style={C.arrowBtn} onClick={()=>navDate(1)}>›</button>
          </div>
          <button style={{background:ac,border:"none",color:"#111",cursor:"pointer",padding:isMobile?"7px 12px":"9px 16px",borderRadius:9,fontWeight:800,fontSize:isMobile?11:13}} onClick={()=>{setSelDate(cur);setSelTime("09:00");setApptModal(true);}}>+ Cita</button>
          <button style={{background:"#2ECC71",border:"none",color:"#111",cursor:"pointer",padding:isMobile?"7px 12px":"9px 16px",borderRadius:9,fontWeight:800,fontSize:isMobile?11:13}} onClick={()=>{setSelDate(cur);setChargeModal(true);}}>💰 Cobrar</button>
        </div>
      </div>
      {view==="day"&&<DayView15 date={cur} appointments={shopData.appointments} onSlotClick={openSlot} device={device}/>}
      {view==="week"&&<WeekView date={cur} appointments={shopData.appointments} accentColor={ac} onSlotClick={openSlot} device={device}/>}
      {apptModal&&<AppointmentModal shopData={shopData} date={selDate} time={selTime} accentColor={ac} onSave={async r=>{await addAppointment(r);setApptModal(false);}} onClose={()=>setApptModal(false)}/>}
      {chargeModal&&<ChargeModal shopData={shopData} date={selDate} accentColor={ac} onSave={async r=>{await addAppointment(r);setChargeModal(false);}} onClose={()=>setChargeModal(false)}/>}
    </div>
  );
}

function DayView15({date,appointments,onSlotClick,device}) {
  const isMobile=device==="mobile";
  const da=appointments.filter(a=>a.date===date);
  return (
    <div style={{background:"#141414",borderRadius:isMobile?10:14,overflow:"hidden",border:"1px solid #222",maxHeight:isMobile?"65vh":"70vh",overflowY:"auto"}}>
      {SLOTS_15.map(slot=>{
        const isHour=slot.endsWith(":00");
        const ap=da.filter(a=>(a.time||"").slice(0,5)===slot);
        return (
          <div key={slot} style={{display:"flex",borderBottom:`1px solid ${isHour?"#252525":"#1a1a1a"}`,minHeight:isMobile?28:34,cursor:"pointer",background:isHour?"#161616":"#141414"}} onClick={()=>onSlotClick(date,slot)}>
            <div style={{width:isMobile?44:56,color:isHour?"#666":"#282828",fontSize:isMobile?9:11,padding:isHour?"6px 6px 0":"2px 6px 0",flexShrink:0,textAlign:"right",borderRight:`1px solid ${isHour?"#252525":"#1a1a1a"}`,fontWeight:isHour?600:400}}>
              {isHour?slot:slot.slice(3)}
            </div>
            <div style={{flex:1,padding:"3px 8px",display:"flex",flexDirection:"column",gap:2}}>
              {ap.map(a=>{
                const col=a.barber_color||"#888";
                return (
                  <div key={a.id} style={{padding:isMobile?"2px 6px":"3px 8px",borderRadius:5,fontSize:isMobile?10:12,display:"flex",alignItems:"center",gap:6,background:col+"22",borderLeft:`3px solid ${col}`}}>
                    <span style={{color:col,fontWeight:700,fontSize:isMobile?9:11}}>{slot}</span>
                    <span style={{color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.client&&a.client!=="—"?a.client:a.service_name}</span>
                    {!isMobile&&a.client&&a.client!=="—"&&<span style={{color:"#888",fontSize:11}}>· {a.service_name}</span>}
                    <span style={{marginLeft:"auto",fontWeight:700,color:a.paid?"#2ECC71":GOLD,fontSize:isMobile?10:12,flexShrink:0}}>{a.paid?fmt(a.price):"pendiente"}</span>
                    {a.paid&&<span style={{fontSize:9,color:a.payment==="metalico"?"#2ECC71":"#3498DB",flexShrink:0}}>{a.payment==="metalico"?"💵":"💳"}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekView({date,appointments,accentColor:ac,onSlotClick,device}) {
  const isTablet=device==="tablet";
  const week=getWeekDays(date);
  const HOURS=["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
  return (
    <div style={{background:"#141414",borderRadius:14,overflow:"hidden",border:"1px solid #222",maxHeight:"72vh",overflowY:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:`${isTablet?42:52}px repeat(7,1fr)`,borderBottom:"1px solid #252525",position:"sticky",top:0,background:"#141414",zIndex:2}}>
        <div style={{borderRight:"1px solid #1a1a1a"}}/>
        {week.map((d,i)=>{
          const isT=d===today;
          return (
            <div key={d} style={{padding:"10px 3px",textAlign:"center",cursor:"pointer",color:isT?ac:"#888"}} onClick={()=>onSlotClick(d,"09:00")}>
              <div style={{fontSize:isTablet?9:11,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{DAYS_ES[i]}</div>
              <div style={{fontSize:isTablet?14:18,fontWeight:700,...(isT?{background:ac,color:"#111",borderRadius:"50%",width:isTablet?22:28,height:isTablet?22:28,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}:{})}}>{new Date(d).getDate()}</div>
            </div>
          );
        })}
      </div>
      {HOURS.map(h=>(
        <div key={h} style={{display:"grid",gridTemplateColumns:`${isTablet?42:52}px repeat(7,1fr)`,borderBottom:"1px solid #1a1a1a"}}>
          <div style={{fontSize:isTablet?9:11,color:"#444",padding:"7px 5px 0",textAlign:"right",borderRight:"1px solid #1a1a1a"}}>{h}</div>
          {week.map(d=>{
            const ap=appointments.filter(a=>a.date===d&&(a.time||"").startsWith(h));
            return (
              <div key={d} style={{borderRight:"1px solid #1a1a1a",padding:"2px",minHeight:isTablet?40:50,cursor:"pointer"}} onClick={()=>onSlotClick(d,h)}>
                {ap.map(a=>{
                  const col=a.barber_color||"#888";
                  return (
                    <div key={a.id} style={{padding:"2px 4px",borderRadius:4,marginBottom:2,background:col+"33",borderLeft:`3px solid ${col}`}}>
                      <div style={{color:col,fontSize:isTablet?9:11,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.client&&a.client!=="—"?a.client.split(" ")[0]:a.service_name}</div>
                      {!isTablet&&<div style={{color:"#999",fontSize:10}}>{a.service_name}</div>}
                      <div style={{fontSize:9,color:a.paid?"#2ECC71":GOLD}}>{a.paid?fmt(a.price):"💈"}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AppointmentModal({shopData,date,time,accentColor:ac,onSave,onClose}) {
  const [form,setForm]=useState({client:"",serviceId:shopData.services[0]?.id||"",barberId:shopData.barbers[0]?.id||"",date,time});
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const svc=shopData.services.find(s=>s.id===form.serviceId);
  const bar=shopData.barbers.find(b=>b.id===form.barberId);
  return (
    <Modal title="📅 Nueva Cita" onClose={onClose}
      footer={<><button style={C.btnSec} onClick={onClose}>Cancelar</button><button style={{...C.btnPri,background:ac,opacity:saving?0.6:1}} onClick={async()=>{
        if(!form.client||!form.serviceId||!form.barberId) return;
        setSaving(true);
        await onSave({...form,type:"appointment",serviceName:svc?.name||"",price:svc?.price||0,barberName:bar?.name||"",color:bar?.color||"#888",paid:false,payment:null});
        setSaving(false);
      }}>{saving?"Guardando…":"Guardar cita"}</button></>}>
      <div style={{background:"#0f1a0a",border:"1px solid #2a3a1a",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#8a8"}}>
        ℹ️ Sin cobro. Para registrar el pago usa <strong style={{color:"#2ECC71"}}>💰 Cobrar</strong>.
      </div>
      <FG label="Cliente"><input style={C.fi} value={form.client} onChange={e=>set("client",e.target.value)} placeholder="Nombre del cliente"/></FG>
      <FG label="Fecha"><input style={C.fi} type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></FG>
      <FG label="Hora"><select style={C.fi} value={form.time} onChange={e=>set("time",e.target.value)}>{SLOTS_15.map(s=><option key={s}>{s}</option>)}</select></FG>
      <FG label="Servicio"><select style={C.fi} value={form.serviceId} onChange={e=>set("serviceId",e.target.value)}>{shopData.services.map(s=><option key={s.id} value={s.id}>{s.name} — {fmt(s.price)}</option>)}</select></FG>
      <FG label="Barbero"><select style={C.fi} value={form.barberId} onChange={e=>set("barberId",e.target.value)}>{shopData.barbers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></FG>
    </Modal>
  );
}

function ChargeModal({shopData,date,accentColor:ac,onSave,onClose}) {
  const [form,setForm]=useState({serviceId:shopData.services[0]?.id||"",barberId:shopData.barbers[0]?.id||"",date,payment:"metalico"});
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const svc=shopData.services.find(s=>s.id===form.serviceId);
  const bar=shopData.barbers.find(b=>b.id===form.barberId);
  return (
    <Modal title="💰 Registrar Cobro" onClose={onClose}
      footer={<><button style={C.btnSec} onClick={onClose}>Cancelar</button><button style={{...C.btnPri,background:"#2ECC71",opacity:saving?0.6:1}} onClick={async()=>{
        if(!form.serviceId||!form.barberId) return;
        setSaving(true);
        await onSave({...form,type:"charge",client:null,serviceName:svc?.name||"",price:svc?.price||0,barberName:bar?.name||"",color:bar?.color||"#888",paid:true});
        setSaving(false);
      }}>{saving?"Registrando…":"Registrar cobro"}</button></>}>
      <FG label="Fecha"><input style={C.fi} type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></FG>
      <FG label="Servicio"><select style={C.fi} value={form.serviceId} onChange={e=>set("serviceId",e.target.value)}>{shopData.services.map(s=><option key={s.id} value={s.id}>{s.name} — {fmt(s.price)}</option>)}</select></FG>
      <FG label="Barbero"><select style={C.fi} value={form.barberId} onChange={e=>set("barberId",e.target.value)}>{shopData.barbers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></FG>
      <FG label="Método de pago">
        <div style={{display:"flex",gap:8}}>
          {[["metalico","💵 Metálico"],["tarjeta","💳 Tarjeta"]].map(([v,l])=>(
            <button key={v} style={{flex:1,background:form.payment===v?"#2ECC71":"#222",border:"1px solid #333",borderRadius:8,color:form.payment===v?"#111":"#aaa",cursor:"pointer",padding:"11px",fontSize:13,fontWeight:700}} onClick={()=>set("payment",v)}>{l}</button>
          ))}
        </div>
      </FG>
      {svc&&<div style={{background:"#0a1a0a",border:"1px solid #1a3a1a",borderRadius:10,padding:14,textAlign:"center"}}>
        <div style={{fontSize:11,color:"#666",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Total a cobrar</div>
        <div style={{fontSize:32,fontWeight:900,color:"#2ECC71",fontFamily:"Georgia,serif"}}>{fmt(svc.price)}</div>
      </div>}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
//  BARBERS TAB
// ════════════════════════════════════════════════════════════════
function BarbersTab({shopData,accentColor:ac,device,addBarber,removeBarber}) {
  const isMobile=device==="mobile",isTablet=device==="tablet";
  const [showF,setShowF]=useState(false);
  const [name,setName]=useState("");
  const [color,setColor]=useState("#E74C3C");
  const [saving,setSaving]=useState(false);
  const add=async()=>{ if(!name.trim()) return; setSaving(true); const av=name.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); await addBarber({name:name.trim(),avatar:av,color}); setName(""); setShowF(false); setSaving(false); };
  const p=isMobile?12:isTablet?18:28;
  const cols=isMobile?"repeat(2,1fr)":isTablet?"repeat(3,1fr)":"repeat(auto-fill,minmax(170px,1fr))";
  return (
    <div style={{padding:p,maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isMobile?14:22,gap:10}}>
        <div><div style={{fontSize:isMobile?20:26,fontWeight:900,color:"#fff",fontFamily:"Georgia,serif"}}>Barberos</div><div style={{fontSize:isMobile?11:13,color:"#666",marginTop:2}}>{shopData.barbers.length} activos</div></div>
        <button style={{background:ac,border:"none",color:"#111",cursor:"pointer",padding:isMobile?"7px 12px":"9px 16px",borderRadius:9,fontWeight:800,fontSize:isMobile?11:13}} onClick={()=>setShowF(f=>!f)}>{showF?"✕ Cancelar":"+ Nuevo"}</button>
      </div>
      {showF&&(
        <div style={{background:"#141414",border:"1px solid #222",borderRadius:isMobile?10:16,padding:isMobile?14:20,marginBottom:20,display:"flex",flexDirection:"column",gap:14}}>
          <FG label="Nombre"><input style={C.fi} value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Carlos Ruiz" onKeyDown={e=>e.key==="Enter"&&add()}/></FG>
          <FG label="Color"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{BARBER_COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:isMobile?26:32,height:isMobile?26:32,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #fff":"3px solid transparent",boxShadow:color===c?`0 0 0 2px ${c}`:"none"}}/>)}</div></FG>
          <button style={{...C.btnPri,background:ac,opacity:saving?0.6:1}} onClick={add}>{saving?"Añadiendo…":"Añadir barbero"}</button>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:cols,gap:isMobile?10:16}}>
        {shopData.barbers.map(b=>(
          <div key={b.id} style={{background:"#141414",border:"1px solid #222",borderRadius:isMobile?12:18,padding:isMobile?"14px 10px":"20px 14px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:isMobile?7:10}}>
            <div style={{width:isMobile?46:60,height:isMobile?46:60,borderRadius:"50%",background:(b.color||"#888")+"33",color:b.color||"#888",border:`2px solid ${b.color||"#888"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?16:22,fontWeight:800}}>{b.avatar||"?"}</div>
            <div style={{fontWeight:700,color:"#fff",fontSize:isMobile?12:14}}>{b.name}</div>
            <div style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:(b.color||"#888")+"22",color:b.color||"#888"}}>Activo</div>
            <button style={{background:"none",border:"1px solid #333",borderRadius:8,color:"#E74C3C",cursor:"pointer",padding:"5px 10px",fontSize:11}} onClick={()=>removeBarber(b.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SETTINGS TAB
// ════════════════════════════════════════════════════════════════
function SettingsTab({workshop,shopData,accentColor:ac,device,updateServices,deleteService,updateWorkshopInfo}) {
  const [unlocked,setUnlocked]=useState(false);
  const [pinInput,setPinInput]=useState("");
  const [pinErr,setPinErr]=useState("");
  const [subTab,setSubTab]=useState("info");
  const isMobile=device==="mobile";
  const tryUnlock=()=>{ if(pinInput===(workshop.owner_pin||"1234")){setUnlocked(true);setPinErr("");}else{setPinErr("PIN incorrecto.");setPinInput("");} };

  if(!unlocked) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",padding:20}}>
      <div style={{background:"#141414",border:"1px solid #222",borderRadius:20,padding:isMobile?"24px 20px":"36px 32px",width:isMobile?"100%":380,maxWidth:"100%",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🔐</div>
        <div style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",marginBottom:8}}>Área del propietario</div>
        <div style={{fontSize:13,color:"#666",marginBottom:24,lineHeight:1.6}}>Introduce el PIN para acceder.</div>
        <FG label="PIN"><input style={{...C.fi,textAlign:"center",fontSize:24,letterSpacing:10}} type="password" value={pinInput} onChange={e=>setPinInput(e.target.value.replace(/\D/,"").slice(0,8))} placeholder="••••" onKeyDown={e=>e.key==="Enter"&&tryUnlock()}/></FG>
        {pinErr&&<div style={{...C.errBox,marginTop:10}}>{pinErr}</div>}
        <button style={{...C.btnPri,background:ac,width:"100%",marginTop:16}} onClick={tryUnlock}>ACCEDER</button>
        <div style={{fontSize:11,color:"#444",marginTop:10}}>PIN por defecto: 1234</div>
      </div>
    </div>
  );

  const SUB=[{id:"info",icon:"🏪",label:"Barbería"},{id:"services",icon:"✂",label:"Servicios"},{id:"finances",icon:"💰",label:"Finanzas"},{id:"stats",icon:"📊",label:"Estadísticas"}];
  return (
    <div style={{padding:isMobile?10:28,maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isMobile?14:22}}>
        <div><div style={{fontSize:isMobile?18:24,fontWeight:900,color:"#fff",fontFamily:"Georgia,serif"}}>⚙️ Configuración</div><div style={{fontSize:11,color:ac,marginTop:2}}>🔓 Propietario</div></div>
        <button style={{background:"none",border:"1px solid #333",color:"#E74C3C",cursor:"pointer",padding:"6px 12px",borderRadius:8,fontSize:12}} onClick={()=>setUnlocked(false)}>Bloquear</button>
      </div>
      <div style={{display:"flex",gap:isMobile?4:8,marginBottom:isMobile?14:22,flexWrap:"wrap"}}>
        {SUB.map(st=>(
          <button key={st.id} style={{background:subTab===st.id?ac:"#1a1a1a",border:"1px solid #333",borderRadius:9,color:subTab===st.id?"#111":"#888",cursor:"pointer",padding:isMobile?"7px 10px":"8px 16px",fontSize:isMobile?11:13,fontWeight:700,display:"flex",alignItems:"center",gap:5}} onClick={()=>setSubTab(st.id)}>
            <span>{st.icon}</span><span>{isMobile?st.label.slice(0,5):st.label}</span>
          </button>
        ))}
      </div>
      {subTab==="info"    &&<SettingsInfo     workshop={workshop} accentColor={ac} device={device} updateWorkshopInfo={updateWorkshopInfo}/>}
      {subTab==="services"&&<SettingsServices shopData={shopData} accentColor={ac} device={device} updateServices={updateServices} deleteService={deleteService}/>}
      {subTab==="finances"&&<SettingsFinances shopData={shopData} accentColor={ac} device={device}/>}
      {subTab==="stats"   &&<SettingsStats    shopData={shopData} accentColor={ac} device={device}/>}
    </div>
  );
}

function SettingsInfo({workshop,accentColor:ac,device,updateWorkshopInfo}) {
  const [info,setInfo]=useState({name:workshop.name||"",address:workshop.address||"",phone:workshop.phone||"",schedule:workshop.schedule||""});
  const [pass,setPass]=useState({current:"",next:"",confirm:""});
  const [msg,setMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const isMobile=device==="mobile";
  const ok=m=>{setMsg("✅ "+m);setTimeout(()=>setMsg(""),3000);};
  const fail=m=>setMsg("❌ "+m);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={C.card}>
        <div style={C.cardTitle}>Datos de la barbería</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
          <FG label="Nombre"><input style={C.fi} value={info.name} onChange={e=>setInfo(i=>({...i,name:e.target.value}))}/></FG>
          <FG label="Dirección"><input style={C.fi} value={info.address} onChange={e=>setInfo(i=>({...i,address:e.target.value}))} placeholder="Calle, número, ciudad"/></FG>
          <FG label="Teléfono"><input style={C.fi} value={info.phone} onChange={e=>setInfo(i=>({...i,phone:e.target.value}))} placeholder="600 000 000"/></FG>
          <FG label="Horario"><input style={C.fi} value={info.schedule} onChange={e=>setInfo(i=>({...i,schedule:e.target.value}))} placeholder="Lun–Sáb 9:00–20:00"/></FG>
        </div>
        {msg&&<div style={msg.startsWith("✅")?C.successBox:C.errBox}>{msg}</div>}
        <button style={{...C.btnPri,background:ac,marginTop:12,opacity:saving?0.6:1}} onClick={async()=>{setSaving(true);const e=await updateWorkshopInfo(info);e?fail(""+e):ok("Datos guardados.");setSaving(false);}}>{saving?"Guardando…":"Guardar datos"}</button>
      </div>
      <div style={C.card}>
        <div style={C.cardTitle}>Cambiar contraseña</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
          <FG label="Contraseña actual"><input style={C.fi} type="password" value={pass.current} onChange={e=>setPass(p=>({...p,current:e.target.value}))}/></FG>
          <FG label="Nueva contraseña"><input style={C.fi} type="password" value={pass.next} onChange={e=>setPass(p=>({...p,next:e.target.value}))}/></FG>
          <FG label="Confirmar nueva"><input style={C.fi} type="password" value={pass.confirm} onChange={e=>setPass(p=>({...p,confirm:e.target.value}))}/></FG>
        </div>
        <button style={{...C.btnPri,background:ac,marginTop:12}} onClick={async()=>{
          if(pass.current!==workshop.password_hash){fail("Contraseña actual incorrecta.");return;}
          if(pass.next.length<6){fail("Mínimo 6 caracteres.");return;}
          if(pass.next!==pass.confirm){fail("Las contraseñas no coinciden.");return;}
          const e=await updateWorkshopInfo({password_hash:pass.next}); e?fail(""+e):ok("Contraseña actualizada.");
          setPass({current:"",next:"",confirm:""});
        }}>Cambiar contraseña</button>
        {msg&&<div style={msg.startsWith("✅")?C.successBox:C.errBox}>{msg}</div>}
      </div>
    </div>
  );
}

function SettingsServices({shopData,accentColor:ac,device,updateServices,deleteService}) {
  const [services,setServices]=useState(shopData.services.map(s=>({...s})));
  const [msg,setMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const isMobile=device==="mobile";
  const upd=(id,k,v)=>setServices(ss=>ss.map(s=>s.id===id?{...s,[k]:v}:s));
  const add=()=>setServices(ss=>[...ss,{id:`new_${Date.now()}`,name:"Nuevo servicio",price:10,_new:true}]);
  const del=id=>{ if(!id.startsWith("new_")) deleteService(id); setServices(ss=>ss.filter(s=>s.id!==id)); };
  return (
    <div style={C.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={C.cardTitle}>Servicios y precios</div>
        <button style={{background:ac,border:"none",color:"#111",cursor:"pointer",padding:"7px 14px",borderRadius:8,fontWeight:800,fontSize:13}} onClick={add}>+ Añadir</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {services.map(s=>(
          <div key={s.id} style={{display:"flex",gap:10,alignItems:"center",background:"#111",borderRadius:10,padding:"10px 12px"}}>
            <input style={{...C.fi,flex:1}} value={s.name} onChange={e=>upd(s.id,"name",e.target.value)}/>
            <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
              <input style={{...C.fi,width:isMobile?60:76,textAlign:"right"}} type="number" value={s.price} onChange={e=>upd(s.id,"price",parseFloat(e.target.value)||0)}/>
              <span style={{color:"#666",fontSize:13}}>€</span>
            </div>
            <button style={{background:"none",border:"none",color:"#E74C3C",cursor:"pointer",fontSize:16}} onClick={()=>del(s.id)}>✕</button>
          </div>
        ))}
      </div>
      {msg&&<div style={{...C.successBox,marginTop:12}}>{msg}</div>}
      <button style={{...C.btnPri,background:ac,marginTop:16,opacity:saving?0.6:1}} onClick={async()=>{setSaving(true);await updateServices(services);setMsg("✅ Guardado.");setTimeout(()=>setMsg(""),3000);setSaving(false);}}>{saving?"Guardando…":"Guardar precios"}</button>
    </div>
  );
}

function SettingsFinances({shopData,accentColor:ac,device}) {
  const isMobile=device==="mobile";
  const [filter,setFilter]=useState("all");
  const charges=shopData.appointments.filter(a=>a.paid);
  const stats=ap=>({total:ap.reduce((s,a)=>s+(a.price||0),0),metalico:ap.filter(a=>a.payment==="metalico").reduce((s,a)=>s+(a.price||0),0),tarjeta:ap.filter(a=>a.payment==="tarjeta").reduce((s,a)=>s+(a.price||0),0),count:ap.length});
  const wd=getWeekDays(today),cm=today.slice(0,7);
  const W=stats(charges.filter(a=>wd.includes(a.date)));
  const M=stats(charges.filter(a=>(a.date||"").startsWith(cm)));
  const filtered=filter==="all"?charges:charges.filter(a=>a.payment===filter);
  const Card=({label,val,icon,hi})=>(
    <div style={{background:"#111",borderRadius:10,padding:isMobile?"10px 6px":"14px 10px",textAlign:"center"}}>
      <div style={{fontSize:isMobile?18:22,marginBottom:5}}>{icon}</div>
      <div style={{fontSize:isMobile?14:20,fontWeight:900,color:hi?ac:"#fff",fontFamily:"Georgia,serif"}}>{val}</div>
      <div style={{fontSize:9,color:"#666",textTransform:"uppercase",letterSpacing:1,marginTop:3}}>{label}</div>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {[["Esta semana",W,false],["Este mes",M,true]].map(([title,S,hi])=>(
        <div key={title} style={C.card}>
          <div style={C.cardTitle}>{title}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:isMobile?8:12}}>
            <Card label="Total" val={fmt(S.total)} icon={hi?"📈":"📊"} hi={hi}/>
            <Card label="Metálico" val={fmt(S.metalico)} icon="💵"/>
            <Card label="Tarjeta" val={fmt(S.tarjeta)} icon="💳"/>
          </div>
          <div style={{fontSize:11,color:"#555",marginTop:8,textAlign:"right"}}>{S.count} servicios cobrados</div>
        </div>
      ))}
      <div style={C.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div style={C.cardTitle}>Registro de cobros</div>
          <div style={{display:"flex",gap:6}}>
            {[["all","Todos"],["metalico","💵"],["tarjeta","💳"]].map(([v,l])=>(
              <button key={v} style={{background:filter===v?ac:"#1a1a1a",color:filter===v?"#111":"#888",border:"1px solid #333",borderRadius:7,cursor:"pointer",padding:"5px 11px",fontSize:isMobile?10:12,fontWeight:700}} onClick={()=>setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {[...filtered].reverse().map(a=>{
            const col=a.barber_color||"#888";
            return (
              <div key={a.id} style={{background:"#111",border:"1px solid #1e1e1e",borderRadius:10,padding:isMobile?"9px 10px":"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:3,height:34,borderRadius:2,background:col,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,color:"#fff",fontSize:isMobile?12:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.service_name}</div>
                  <div style={{fontSize:isMobile?9:11,color:"#666",marginTop:1}}>{a.barber_name||a.barber_id} · {a.date}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:isMobile?13:16,fontWeight:800,color:GOLD,fontFamily:"Georgia,serif"}}>{fmt(a.price||0)}</div>
                  <div style={{padding:"2px 6px",borderRadius:5,fontSize:9,fontWeight:600,marginTop:3,display:"inline-block",background:a.payment==="metalico"?"#2ECC7133":"#3498DB33",color:a.payment==="metalico"?"#2ECC71":"#3498DB"}}>{a.payment==="metalico"?"💵":"💳"}</div>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&<div style={{textAlign:"center",color:"#555",fontSize:13,padding:"24px 0"}}>Sin cobros registrados.</div>}
        </div>
      </div>
    </div>
  );
}

function SettingsStats({shopData,accentColor:ac,device}) {
  const isMobile=device==="mobile";
  const [period,setPeriod]=useState("week");
  const charges=shopData.appointments.filter(a=>a.paid);
  const wd=getWeekDays(today),cm=today.slice(0,7);
  const rel=period==="week"?charges.filter(a=>wd.includes(a.date)):charges.filter(a=>(a.date||"").startsWith(cm));
  const stats=shopData.barbers.map(b=>{
    const ba=rel.filter(a=>a.barber_id===b.id);
    return {...b,count:ba.length,total:ba.reduce((s,a)=>s+(a.price||0),0),metalico:ba.filter(a=>a.payment==="metalico").reduce((s,a)=>s+(a.price||0),0),tarjeta:ba.filter(a=>a.payment==="tarjeta").reduce((s,a)=>s+(a.price||0),0),services:ba};
  }).sort((a,b)=>b.total-a.total);
  const totalAll=stats.reduce((s,b)=>s+b.total,0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8}}>
        {[["week","Esta semana"],["month","Este mes"]].map(([v,l])=>(
          <button key={v} style={{background:period===v?ac:"#1a1a1a",border:"1px solid #333",borderRadius:9,color:period===v?"#111":"#888",cursor:"pointer",padding:"8px 16px",fontSize:13,fontWeight:700}} onClick={()=>setPeriod(v)}>{l}</button>
        ))}
      </div>
      {stats.map((b,idx)=>{
        const col=b.color||"#888";
        const pct=totalAll>0?Math.round(b.total/totalAll*100):0;
        return (
          <div key={b.id} style={C.card}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
              <div style={{width:isMobile?44:56,height:isMobile?44:56,borderRadius:"50%",background:col+"33",color:col,border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?16:22,fontWeight:800,flexShrink:0}}>{b.avatar||"?"}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,color:"#fff",fontSize:isMobile?14:16}}>{b.name}</div>
                <div style={{fontSize:12,color:"#666",marginTop:2}}>{b.count} servicios · {fmt(b.total)}</div>
                <div style={{marginTop:8,background:"#222",borderRadius:4,height:6,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:4}}/></div>
                <div style={{fontSize:10,color:"#666",marginTop:3}}>{pct}% del total</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:isMobile?16:22,fontWeight:900,color:col,fontFamily:"Georgia,serif"}}>{fmt(b.total)}</div>
                <div style={{fontSize:10,color:"#666",marginTop:2}}>#{idx+1}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{background:"#2ECC7111",border:"1px solid #2ECC7133",borderRadius:8,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:11,color:"#2ECC71",fontWeight:700}}>💵 Metálico</div><div style={{fontSize:15,fontWeight:800,color:"#fff",marginTop:3}}>{fmt(b.metalico)}</div></div>
              <div style={{background:"#3498DB11",border:"1px solid #3498DB33",borderRadius:8,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:11,color:"#3498DB",fontWeight:700}}>💳 Tarjeta</div><div style={{fontSize:15,fontWeight:800,color:"#fff",marginTop:3}}>{fmt(b.tarjeta)}</div></div>
            </div>
            {b.services.length>0&&<div style={{marginTop:12,display:"flex",flexDirection:"column",gap:5}}>
              {b.services.slice(0,4).map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#777",padding:"4px 8px",background:"#111",borderRadius:6}}><span>{a.service_name}</span><span style={{color:GOLD}}>{fmt(a.price||0)}</span></div>)}
              {b.services.length>4&&<div style={{fontSize:11,color:"#555",textAlign:"center"}}>+{b.services.length-4} más</div>}
            </div>}
          </div>
        );
      })}
      {stats.every(b=>b.count===0)&&<div style={{textAlign:"center",color:"#555",fontSize:14,padding:"40px 0"}}>Sin cobros este {period==="week"?"semana":"mes"}.</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SHARED STYLES
// ════════════════════════════════════════════════════════════════
const C = {
  overlay:   {position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:12},
  modal:     {background:"#181818",border:"1px solid #333",borderRadius:20,maxHeight:"92vh",overflow:"auto"},
  mHead:     {padding:"18px 22px",borderBottom:"1px solid #222",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#181818",zIndex:1},
  mTitle:    {fontSize:16,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"},
  mX:        {background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:20,flexShrink:0},
  mBody:     {padding:"18px 22px",display:"flex",flexDirection:"column",gap:14},
  mFoot:     {padding:"14px 22px",borderTop:"1px solid #222",display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"#181818"},
  fl:        {fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:1},
  fi:        {background:"#111",border:"1px solid #333",borderRadius:8,color:"#fff",padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",width:"100%"},
  btnPri:    {border:"none",borderRadius:10,color:"#111",cursor:"pointer",padding:"10px 22px",fontSize:14,fontWeight:800},
  btnSec:    {background:"#222",border:"1px solid #333",borderRadius:10,color:"#aaa",cursor:"pointer",padding:"10px 18px",fontSize:14},
  arrowBtn:  {background:"#1a1a1a",border:"1px solid #333",color:"#aaa",cursor:"pointer",padding:"7px 12px",borderRadius:7,fontSize:14},
  errBox:    {background:"#E74C3C11",border:"1px solid #E74C3C44",borderRadius:8,padding:"8px 12px",color:"#E74C3C",fontSize:13,marginTop:4},
  successBox:{background:"#2ECC7111",border:"1px solid #2ECC7144",borderRadius:8,padding:"8px 12px",color:"#2ECC71",fontSize:13,marginTop:4},
  logoBox:   {width:48,height:48,borderRadius:12,overflow:"hidden",background:"#1a1a1a",border:"1.5px solid #2a2a2a",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"},
  dropZone:  {border:"2px dashed #333",borderRadius:12,padding:"24px 16px",textAlign:"center",cursor:"pointer",background:"#111",transition:"all .2s"},
  card:      {background:"#141414",border:"1px solid #222",borderRadius:16,padding:20,display:"flex",flexDirection:"column",gap:4},
  cardTitle: {fontSize:14,fontWeight:800,color:"#fff",marginBottom:8,fontFamily:"Georgia,serif"},
};

export default App;
