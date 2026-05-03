"use client";
import { useState, useRef, useEffect, useCallback, Fragment } from "react";

// ═══════════════════════════════════════════════
//  SUPABASE CONFIG
// ═══════════════════════════════════════════════
const SUPA_URL = "https://ypdulxgrtlksqkgylrwc.supabase.co";
const SUPA_KEY = "sb_publishable_v3JziLlzJrd-x6RFIkzZig_szdQO_6c";
const H = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
};

const db = {
  async get(table: string, filters: Record<string, string> = {}, single = false) {
    let url = `${SUPA_URL}/rest/v1/${table}?select=*`;
    Object.entries(filters).forEach(([k, v]) => { url += `&${k}=eq.${encodeURIComponent(v)}`; });
    const heads: Record<string, string> = { ...H, ...(single ? { Accept: "application/vnd.pgrst.object+json" } : {}) };
    try {
      const r = await fetch(url, { headers: heads });
      if (!r.ok) return { data: null, error: await r.text() };
      return { data: await r.json(), error: null };
    } catch (e: any) { return { data: null, error: e.message }; }
  },
  async post(table: string, body: object) {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
        method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body),
      });
      if (!r.ok) return { data: null, error: await r.text() };
      const d = await r.json();
      return { data: Array.isArray(d) ? d[0] : d, error: null };
    } catch (e: any) { return { data: null, error: e.message }; }
  },
  async patch(table: string, body: object, filters: Record<string, string>) {
    let url = `${SUPA_URL}/rest/v1/${table}?`;
    url += Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
    try {
      const r = await fetch(url, {
        method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body),
      });
      if (!r.ok) return { data: null, error: await r.text() };
      return { data: await r.json(), error: null };
    } catch (e: any) { return { data: null, error: e.message }; }
  },
};

// ═══════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════
const GOLD = "#C9A84C";
const TODAY = new Date().toISOString().slice(0, 10);
const fmt = (n: any) => `${Number(n || 0).toFixed(2)} €`;
const BCOLORS = ["#E74C3C","#3498DB","#2ECC71","#9B59B6","#E67E22","#1ABC9C","#F39C12","#E91E63"];
const DEF_SVCS = [
  { name: "Corte de pelo", price: 15 }, { name: "Afeitado", price: 12 },
  { name: "Arreglo de barba", price: 10 }, { name: "Corte + Barba", price: 25 },
  { name: "Tinte", price: 35 }, { name: "Tratamiento", price: 20 },
];
const DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const SLOTS = (() => {
  const s: string[] = [];
  for (let h = 8; h < 21; h++) for (let m = 0; m < 60; m += 15)
    s.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  return s;
})();

// ═══════════════════════════════════════════════
//  DEVICE HOOK
// ═══════════════════════════════════════════════
function useDevice() {
  const g = () => typeof window === "undefined" ? "d" : window.innerWidth < 640 ? "m" : window.innerWidth < 1024 ? "t" : "d";
  const [v, setV] = useState<"m"|"t"|"d">("d");
  useEffect(() => {
    setV(g());
    const h = () => setV(g()); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);
  return v;
}

function weekDays(d: string) {
  const dt = new Date(d), day = dt.getDay();
  const mon = new Date(dt); mon.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({length:7},(_,i)=>{ const x=new Date(mon); x.setDate(mon.getDate()+i); return x.toISOString().slice(0,10); });
}

// ═══════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════
const S: Record<string, React.CSSProperties> = {
  overlay: {position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:12},
  modal:   {background:"#181818",border:"1px solid #333",borderRadius:20,maxHeight:"92vh",overflowY:"auto",width:460,maxWidth:"96vw"},
  mhead:   {padding:"18px 22px",borderBottom:"1px solid #222",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#181818",zIndex:1},
  mbody:   {padding:"18px 22px",display:"flex",flexDirection:"column",gap:14},
  mfoot:   {padding:"14px 22px",borderTop:"1px solid #222",display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"#181818"},
  fi:      {background:"#111",border:"1px solid #333",borderRadius:8,color:"#fff",padding:"10px 12px",fontSize:14,outline:"none",width:"100%"},
  btnG:    {border:"none",borderRadius:10,color:"#111",cursor:"pointer",padding:"10px 22px",fontSize:14,fontWeight:800},
  btnS:    {background:"#222",border:"1px solid #333",borderRadius:10,color:"#aaa",cursor:"pointer",padding:"10px 18px",fontSize:14},
  card:    {background:"#141414",border:"1px solid #222",borderRadius:16,padding:20},
  err:     {background:"#E74C3C18",border:"1px solid #E74C3C55",borderRadius:8,padding:"9px 13px",color:"#E74C3C",fontSize:13},
  ok:      {background:"#2ECC7118",border:"1px solid #2ECC7155",borderRadius:8,padding:"9px 13px",color:"#2ECC71",fontSize:13},
  arrow:   {background:"#1a1a1a",border:"1px solid #333",color:"#aaa",cursor:"pointer",padding:"7px 13px",borderRadius:7,fontSize:15},
};

// ═══════════════════════════════════════════════
//  UI PRIMITIVES
// ═══════════════════════════════════════════════
function FG({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:1}}>{label}</label>
      {children}
    </div>
  );
}
function Spin() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:60,color:"#666"}}>
      <div style={{width:36,height:36,border:"3px solid #222",borderTop:`3px solid ${GOLD}`,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{fontSize:13}}>Cargando...</span>
    </div>
  );
}
function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.mhead}>
          <span style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>{title}</span>
          <button style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:22}} onClick={onClose}>✕</button>
        </div>
        <div style={S.mbody}>{children}</div>
        {footer && <div style={S.mfoot}>{footer}</div>}
      </div>
    </div>
  );
}
function DevBadge({ dv }: { dv: string }) {
  const icons: Record<string,string> = {m:"📱",t:"📟",d:"🖥"};
  const labels: Record<string,string> = {m:"Móvil",t:"Tablet",d:"Escritorio"};
  return (
    <div style={{position:"fixed",bottom:10,right:10,background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:20,padding:"4px 10px",fontSize:10,color:"#555",pointerEvents:"none",zIndex:999,display:"flex",gap:5,alignItems:"center"}}>
      {icons[dv]} {labels[dv]}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  LOGO MODAL
// ═══════════════════════════════════════════════
function LogoModal({ wk, onSave, onClose }: any) {
  const [name, setName] = useState(wk.name);
  const [logo, setLogo] = useState(wk.logo_url || null);
  const [drag, setDrag] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const readFile = (f: File) => { if (!f || !f.type.startsWith("image/")) return; const r = new FileReader(); r.onload = e => setLogo(e.target?.result); r.readAsDataURL(f); };
  return (
    <Modal title="✏ Identidad" onClose={onClose} footer={
      <><button style={S.btnS} onClick={onClose}>Cancelar</button>
      <button style={{...S.btnG,background:wk.color||GOLD,opacity:saving?.6:1}} onClick={async()=>{setSaving(true);await onSave({name:name.trim()||wk.name,logo_url:logo});setSaving(false);}}>
        {saving?"Guardando…":"Guardar"}</button></>}>
      <div style={{background:"#111",border:"1px solid #2a2a2a",borderRadius:12,padding:14}}>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,marginBottom:10}}>VISTA PREVIA</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:48,height:48,borderRadius:12,overflow:"hidden",background:"#1a1a1a",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {logo?<img src={logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:22,color:wk.color||GOLD}}>✂</span>}
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>{name||"Nombre"}</div>
            <div style={{fontSize:11,color:wk.color||GOLD,marginTop:3}}>✏ Editar logo</div>
          </div>
        </div>
      </div>
      <FG label="Nombre"><input style={S.fi} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre de la barbería"/></FG>
      <FG label="Logo / Foto">
        <div style={{border:`2px dashed ${drag?wk.color||GOLD:"#333"}`,borderRadius:12,padding:"24px 16px",textAlign:"center",cursor:"pointer",background:"#111",transition:"all .2s"}}
          onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);if(e.dataTransfer.files[0])readFile(e.dataTransfer.files[0])}}
          onClick={()=>ref.current?.click()}>
          {logo
            ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><img src={logo} alt="" style={{width:64,height:64,borderRadius:12,objectFit:"cover",border:"2px solid #333"}}/><span style={{fontSize:12,color:"#777"}}>Clic para cambiar</span></div>
            :<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><div style={{fontSize:32}}>📷</div><div style={{color:"#888",fontSize:13}}>Arrastra o haz clic</div><div style={{color:"#555",fontSize:11}}>PNG · JPG · WEBP</div></div>}
        </div>
        <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])readFile(e.target.files[0]);}}/>
        {logo&&<button style={{background:"none",border:"none",color:"#E74C3C",cursor:"pointer",fontSize:12,marginTop:6}} onClick={()=>setLogo(null)}>✕ Eliminar foto</button>}
      </FG>
    </Modal>
  );
}

// ═══════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════
function Auth({ onLogin, dv }: { onLogin: (w: any) => void; dv: string }) {
  const [tab, setTab]         = useState<"login"|"register"|"verify"|"done">("login");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [name, setName]       = useState("");
  const [addr, setAddr]       = useState("");
  const [phone, setPhone]     = useState("");
  const [pin, setPin]         = useState("");
  const [code, setCode]       = useState("");
  const [sent, setSent]       = useState("");
  const [pending, setPending] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");
  const mob = dv === "m";

  const login = async () => {
    setErr(""); setLoading(true);
    const { data, error } = await db.get("workshops", { email: email.trim(), password_hash: pass }, true);
    if (error) setErr("Email o contraseña incorrectos.");
    else if (data.verified === false) setErr("Cuenta pendiente de verificación.");
    else onLogin(data);
    setLoading(false);
  };

  const register = async () => {
    setErr("");
    if (!name.trim()||!email.trim()||!pass||!pin) return setErr("Rellena todos los campos.");
    if (pass.length < 6) return setErr("Contraseña: mínimo 6 caracteres.");
    if (pin.replace(/\D/g,"").length < 4) return setErr("PIN: mínimo 4 dígitos.");
    setLoading(true);
    const vcode = String(Math.floor(100000 + Math.random() * 900000));
    const { data, error } = await db.post("workshops", {
      name: name.trim(), email: email.trim(), password_hash: pass,
      address: addr.trim(), phone: phone.trim(), owner_pin: pin,
      color: GOLD, verified: false, verify_code: vcode, schedule: "",
    });
    if (error) { setErr(error.includes("unique")||error.includes("duplicate") ? "Ese email ya está registrado." : "Error al registrar."); setLoading(false); return; }
    await Promise.all(DEF_SVCS.map(s => db.post("services", { workshop_id: data.id, name: s.name, price: s.price, active: true })));
    setSent(vcode); setPending(data); setTab("verify"); setLoading(false);
  };

  const verify = async () => {
    setErr(""); setLoading(true);
    const { data } = await db.get("workshops", { id: pending.id, verify_code: code.trim() }, true);
    if (!data) { setErr("Código incorrecto."); setLoading(false); return; }
    await db.patch("workshops", { verified: true, verify_code: null }, { id: pending.id });
    setTab("done"); setLoading(false);
  };

  const p = mob ? 16 : 32;
  return (
    <div style={{minHeight:"100vh",background:"#0D0D0D",display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div style={{background:"#141414",border:"1px solid #222",borderRadius:mob?16:24,width:mob?"100%":430,maxWidth:"100%",overflow:"hidden"}}>
        {/* header */}
        <div style={{background:"linear-gradient(135deg,#1a1505,#0D0D0D)",padding:`${mob?28:40}px ${p}px ${mob?22:28}px`,textAlign:"center",borderBottom:"1px solid #222"}}>
          <div style={{fontSize:mob?38:50,marginBottom:10}}>✂</div>
          <div style={{fontSize:mob?26:32,fontWeight:900,color:"#fff",fontFamily:"Georgia,serif",letterSpacing:6}}>BARBER<span style={{color:GOLD}}>PRO</span></div>
          <div style={{fontSize:12,color:"#666",marginTop:6}}>Gestión para barberías modernas</div>
        </div>
        {/* tabs */}
        {(tab==="login"||tab==="register") && (
          <div style={{display:"flex",borderBottom:"1px solid #222"}}>
            {(["login","register"] as const).map(t=>(
              <button key={t} style={{flex:1,background:"none",border:"none",color:tab===t?"#fff":"#555",cursor:"pointer",padding:"13px 8px",fontSize:13,fontWeight:700,borderBottom:tab===t?`2px solid ${GOLD}`:"2px solid transparent"}} onClick={()=>{setTab(t);setErr("");}}>
                {t==="login"?"Iniciar sesión":"Registrar barbería"}
              </button>
            ))}
          </div>
        )}
        {/* login */}
        {tab==="login" && (
          <div style={{padding:`22px ${p}px`,display:"flex",flexDirection:"column",gap:14}}>
            <FG label="Email"><input style={S.fi} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@barberia.es" onKeyDown={e=>e.key==="Enter"&&login()}/></FG>
            <FG label="Contraseña"><input style={S.fi} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&login()}/></FG>
            {err && <div style={S.err}>{err}</div>}
            <button style={{...S.btnG,background:GOLD,opacity:loading?.6:1}} onClick={login} disabled={loading}>{loading?"Accediendo…":"ACCEDER"}</button>
          </div>
        )}
        {/* register */}
        {tab==="register" && (
          <div style={{padding:`22px ${p}px`,display:"flex",flexDirection:"column",gap:12}}>
            <FG label="Nombre de la barbería *"><input style={S.fi} value={name} onChange={e=>setName(e.target.value)} placeholder="The Royal Cut"/></FG>
            <FG label="Email *"><input style={S.fi} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="barberia@email.com"/></FG>
            <FG label="Contraseña * (mín. 6 caracteres)"><input style={S.fi} type="password" value={pass} onChange={e=>setPass(e.target.value)}/></FG>
            <FG label="Dirección"><input style={S.fi} value={addr} onChange={e=>setAddr(e.target.value)} placeholder="Calle Gran Vía 45, Madrid"/></FG>
            <FG label="Teléfono"><input style={S.fi} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="91 123 45 67"/></FG>
            <FG label="PIN del propietario * (4+ dígitos)"><input style={S.fi} type="password" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,8))} placeholder="Solo números"/></FG>
            <div style={{background:"#1a1505",border:"1px solid #3a2a05",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#aaa",lineHeight:1.6}}>
              📧 Se enviará código de verificación a <strong style={{color:GOLD}}>J.ventas.adan@gmail.com</strong>
            </div>
            {err && <div style={S.err}>{err}</div>}
            <button style={{...S.btnG,background:GOLD,opacity:loading?.6:1,marginTop:4}} onClick={register} disabled={loading}>{loading?"Registrando…":"SOLICITAR REGISTRO"}</button>
          </div>
        )}
        {/* verify */}
        {tab==="verify" && (
          <div style={{padding:`24px ${p}px`,display:"flex",flexDirection:"column",gap:16}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:10}}>📬</div>
              <div style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>Verificación enviada</div>
              <div style={{fontSize:13,color:"#666",marginTop:8,lineHeight:1.6}}>Código enviado a <strong style={{color:GOLD}}>J.ventas.adan@gmail.com</strong></div>
            </div>
            <div style={{background:"#111",border:"1px solid #333",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:10,color:"#555",letterSpacing:2,marginBottom:6}}>CÓDIGO DE VERIFICACIÓN</div>
              <div style={{fontSize:28,fontWeight:900,color:GOLD,fontFamily:"monospace",letterSpacing:8}}>{sent}</div>
            </div>
            <FG label="Introduce el código"><input style={{...S.fi,textAlign:"center",fontSize:22,letterSpacing:8}} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" maxLength={6}/></FG>
            {err && <div style={S.err}>{err}</div>}
            <button style={{...S.btnG,background:GOLD,opacity:loading?.6:1}} onClick={verify} disabled={loading}>{loading?"Verificando…":"VERIFICAR"}</button>
            <button style={S.btnS} onClick={()=>setTab("login")}>Volver</button>
          </div>
        )}
        {/* done */}
        {tab==="done" && (
          <div style={{padding:`28px ${p}px`,display:"flex",flexDirection:"column",gap:14,alignItems:"center",textAlign:"center"}}>
            <div style={{fontSize:48}}>✅</div>
            <div style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>¡Barbería verificada!</div>
            <div style={{fontSize:13,color:"#888",lineHeight:1.7}}><strong style={{color:"#fff"}}>{pending?.name}</strong> está lista. Ya puedes iniciar sesión.</div>
            <button style={{...S.btnG,background:GOLD,width:"100%"}} onClick={()=>{setEmail(pending?.email||"");setPass("");setTab("login");}}>IR AL INICIO DE SESIÓN</button>
          </div>
        )}
      </div>
      <DevBadge dv={dv}/>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  APPOINTMENT MODAL
// ═══════════════════════════════════════════════
function ApptModal({ sd, date, time, ac, onSave, onClose }: any) {
  const [f, setF] = useState({ client:"", serviceId:sd.services[0]?.id||"", barberId:sd.barbers[0]?.id||"", date, time });
  const [saving, setSaving] = useState(false);
  const s = (k: string, v: string) => setF(p => ({...p,[k]:v}));
  const svc = sd.services.find((x: any)=>x.id===f.serviceId);
  const bar = sd.barbers.find((x: any)=>x.id===f.barberId);
  return (
    <Modal title="📅 Nueva Cita" onClose={onClose} footer={
      <><button style={S.btnS} onClick={onClose}>Cancelar</button>
      <button style={{...S.btnG,background:ac,opacity:saving?.6:1}} onClick={async()=>{
        if(!f.client||!f.serviceId||!f.barberId)return;
        setSaving(true);
        await onSave({...f,type:"appointment",serviceName:svc?.name||"",price:svc?.price||0,barberName:bar?.name||"",barberColor:bar?.color||"#888",paid:false,payment:null});
        setSaving(false);
      }}>{saving?"Guardando…":"Guardar cita"}</button></>}>
      <div style={{background:"#0f1a0a",border:"1px solid #2a3a1a",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#9a9"}}>
        ℹ️ Sin cobro — usa <strong style={{color:"#2ECC71"}}>💰 Cobrar</strong> para registrar el pago.
      </div>
      <FG label="Cliente"><input style={S.fi} value={f.client} onChange={e=>s("client",e.target.value)} placeholder="Nombre del cliente"/></FG>
      <FG label="Fecha"><input style={S.fi} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
      <FG label="Hora"><select style={S.fi} value={f.time} onChange={e=>s("time",e.target.value)}>{SLOTS.map(x=><option key={x} value={x}>{x}</option>)}</select></FG>
      <FG label="Servicio"><select style={S.fi} value={f.serviceId} onChange={e=>s("serviceId",e.target.value)}>{sd.services.map((x: any)=><option key={x.id} value={x.id}>{x.name} — {fmt(x.price)}</option>)}</select></FG>
      <FG label="Barbero"><select style={S.fi} value={f.barberId} onChange={e=>s("barberId",e.target.value)}>{sd.barbers.map((x: any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></FG>
    </Modal>
  );
}

// ═══════════════════════════════════════════════
//  CHARGE MODAL
// ═══════════════════════════════════════════════
function CharModal({ sd, date, onSave, onClose }: any) {
  const [f, setF] = useState({ serviceId:sd.services[0]?.id||"", barberId:sd.barbers[0]?.id||"", date, payment:"metalico" });
  const [saving, setSaving] = useState(false);
  const s = (k: string, v: string) => setF(p => ({...p,[k]:v}));
  const svc = sd.services.find((x: any)=>x.id===f.serviceId);
  const bar = sd.barbers.find((x: any)=>x.id===f.barberId);
  return (
    <Modal title="💰 Registrar Cobro" onClose={onClose} footer={
      <><button style={S.btnS} onClick={onClose}>Cancelar</button>
      <button style={{...S.btnG,background:"#2ECC71",opacity:saving?.6:1}} onClick={async()=>{
        if(!f.serviceId||!f.barberId)return; setSaving(true);
        await onSave({...f,type:"charge",serviceName:svc?.name||"",price:svc?.price||0,barberName:bar?.name||"",barberColor:bar?.color||"#888",paid:true,client:null,time:new Date().toTimeString().slice(0,5)});
        setSaving(false);
      }}>{saving?"Registrando…":"Registrar cobro"}</button></>}>
      <FG label="Fecha"><input style={S.fi} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></FG>
      <FG label="Servicio"><select style={S.fi} value={f.serviceId} onChange={e=>s("serviceId",e.target.value)}>{sd.services.map((x: any)=><option key={x.id} value={x.id}>{x.name} — {fmt(x.price)}</option>)}</select></FG>
      <FG label="Barbero"><select style={S.fi} value={f.barberId} onChange={e=>s("barberId",e.target.value)}>{sd.barbers.map((x: any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></FG>
      <FG label="Método de pago">
        <div style={{display:"flex",gap:8}}>
          {["metalico","tarjeta"].map(v=>(
            <button key={v} style={{flex:1,background:f.payment===v?"#2ECC71":"#222",border:"1px solid #333",borderRadius:8,color:f.payment===v?"#111":"#aaa",cursor:"pointer",padding:10,fontSize:13,fontWeight:700}} onClick={()=>s("payment",v)}>
              {v==="metalico"?"💵 Metálico":"💳 Tarjeta"}
            </button>
          ))}
        </div>
      </FG>
      {svc && (
        <div style={{background:"#0a1a0a",border:"1px solid #1a3a1a",borderRadius:10,padding:14,textAlign:"center"}}>
          <div style={{fontSize:11,color:"#666",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Total a cobrar</div>
          <div style={{fontSize:32,fontWeight:900,color:"#2ECC71",fontFamily:"Georgia,serif"}}>{fmt(svc.price)}</div>
        </div>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════
//  DAY VIEW (15 min slots)
// ═══════════════════════════════════════════════
function DayV({ date, appts, onSlot, dv }: any) {
  const mob = dv==="m";
  const da = appts.filter((a: any) => a.date===date);
  return (
    <div style={{background:"#141414",borderRadius:mob?10:14,overflow:"hidden",border:"1px solid #222",maxHeight:"70vh",overflowY:"auto"}}>
      {SLOTS.map(slot => {
        const isH = slot.endsWith(":00");
        const ap = da.filter((a: any) => (a.time||"").slice(0,5)===slot);
        return (
          <div key={slot} style={{display:"flex",borderBottom:`1px solid ${isH?"#2a2a2a":"#191919"}`,minHeight:mob?28:34,cursor:"pointer",background:isH?"#161616":"#141414"}} onClick={()=>onSlot(date,slot)}>
            <div style={{width:mob?44:56,color:isH?"#666":"#2e2e2e",fontSize:mob?9:11,padding:isH?"6px 6px 0":"2px 6px 0",flexShrink:0,textAlign:"right",borderRight:`1px solid ${isH?"#2a2a2a":"#1e1e1e"}`,fontWeight:isH?600:400}}>
              {isH?slot:slot.slice(3)}
            </div>
            <div style={{flex:1,padding:"3px 8px",display:"flex",flexDirection:"column",gap:2}}>
              {ap.map((a: any) => {
                const col = a.barber_color||"#888";
                return (
                  <div key={a.id} style={{padding:mob?"2px 6px":"3px 8px",borderRadius:5,fontSize:mob?10:12,display:"flex",alignItems:"center",gap:6,background:col+"22",borderLeft:`3px solid ${col}`}}>
                    <span style={{color:col,fontWeight:700,fontSize:mob?9:11}}>{slot}</span>
                    <span style={{color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.service_name||"—"}</span>
                    <span style={{marginLeft:"auto",fontWeight:700,color:a.paid?"#2ECC71":GOLD,fontSize:mob?10:12,flexShrink:0}}>{a.paid?fmt(a.price):"pendiente"}</span>
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

// ═══════════════════════════════════════════════
//  WEEK VIEW
// ═══════════════════════════════════════════════
function WeekV({ date, appts, ac, onSlot, dv }: any) {
  const tab_ = dv==="t";
  const wk = weekDays(date);
  const HRS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
  return (
    <div style={{background:"#141414",borderRadius:14,overflow:"hidden",border:"1px solid #222",maxHeight:"72vh",overflowY:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:`${tab_?42:52}px repeat(7,1fr)`,borderBottom:"1px solid #2a2a2a",position:"sticky",top:0,background:"#141414",zIndex:2}}>
        <div style={{borderRight:"1px solid #1a1a1a"}}/>
        {wk.map((d,i)=>{
          const isT=d===TODAY;
          return (
            <div key={d} style={{padding:"10px 3px",textAlign:"center",cursor:"pointer",color:isT?ac:"#888"}} onClick={()=>onSlot(d,"09:00")}>
              <div style={{fontSize:tab_?9:11,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{DAYS[i]}</div>
              <div style={{fontSize:tab_?14:18,fontWeight:700,...(isT?{background:ac,color:"#111",borderRadius:"50%",width:tab_?22:28,height:tab_?22:28,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}:{})}}>{new Date(d).getDate()}</div>
            </div>
          );
        })}
      </div>
      {HRS.map(h=>(
        <div key={h} style={{display:"grid",gridTemplateColumns:`${tab_?42:52}px repeat(7,1fr)`,borderBottom:"1px solid #1a1a1a"}}>
          <div style={{fontSize:tab_?9:11,color:"#444",padding:"7px 5px 0",textAlign:"right",borderRight:"1px solid #1a1a1a"}}>{h}</div>
          {wk.map(d=>{
            const ap = appts.filter((a: any)=>a.date===d&&(a.time||"").startsWith(h));
            return (
              <div key={d} style={{borderRight:"1px solid #1a1a1a",padding:2,minHeight:tab_?40:50,cursor:"pointer"}} onClick={()=>onSlot(d,h)}>
                {ap.map((a: any)=>{
                  const col=a.barber_color||"#888";
                  return (
                    <div key={a.id} style={{padding:"2px 4px",borderRadius:4,marginBottom:2,background:col+"33",borderLeft:`3px solid ${col}`}}>
                      <div style={{color:col,fontSize:tab_?9:11,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.service_name||"—"}</div>
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

// ═══════════════════════════════════════════════
//  CALENDAR TAB
// ═══════════════════════════════════════════════
function CalTab({ wk, sd, ac, dv, addAppt }: any) {
  const [view, setView] = useState("week");
  const [cur, setCur]   = useState(TODAY);
  const [apptM, setApptM] = useState(false);
  const [charM, setCharM] = useState(false);
  const [selD, setSelD] = useState(TODAY);
  const [selT, setSelT] = useState("09:00");
  const mob=dv==="m", tab_=dv==="t";

  const nav = (dir: number) => { const d=new Date(cur); if(view==="day")d.setDate(d.getDate()+dir); else d.setDate(d.getDate()+dir*7); setCur(d.toISOString().slice(0,10)); };
  const lbl = () => { const d=new Date(cur); if(view==="day")return`${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; const w=weekDays(cur),a=new Date(w[0]),b=new Date(w[6]); return`${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()].slice(0,3)} ${b.getFullYear()}`; };
  const openSlot = (date: string, time: string) => { setSelD(date); setSelT(time); setApptM(true); };
  const p = mob?12:tab_?18:28;

  return (
    <div style={{padding:p,maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:mob?12:20,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:mob?20:26,fontWeight:900,color:"#fff",fontFamily:"Georgia,serif"}}>Calendario</div>
          <div style={{fontSize:mob?11:13,color:"#666",marginTop:2}}>{lbl()}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",background:"#1a1a1a",borderRadius:8,overflow:"hidden",border:"1px solid #333"}}>
            {["day","week"].map(v=>(
              <button key={v} style={{background:view===v?ac:"transparent",border:"none",color:view===v?"#111":"#888",cursor:"pointer",padding:mob?"6px 10px":"8px 14px",fontSize:mob?11:13,fontWeight:600}} onClick={()=>setView(v)}>
                {v==="day"?"Día":"Semana"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:4}}>
            <button style={S.arrow} onClick={()=>nav(-1)}>‹</button>
            <button style={S.arrow} onClick={()=>setCur(TODAY)}>Hoy</button>
            <button style={S.arrow} onClick={()=>nav(1)}>›</button>
          </div>
          <button style={{background:ac,border:"none",color:"#111",cursor:"pointer",padding:mob?"7px 12px":"9px 16px",borderRadius:9,fontWeight:800,fontSize:mob?11:13}} onClick={()=>{setSelD(cur);setSelT("09:00");setApptM(true);}}>+ Cita</button>
          <button style={{background:"#2ECC71",border:"none",color:"#111",cursor:"pointer",padding:mob?"7px 12px":"9px 16px",borderRadius:9,fontWeight:800,fontSize:mob?11:13}} onClick={()=>{setSelD(cur);setCharM(true);}}>💰 Cobrar</button>
        </div>
      </div>
      {view==="day" && <DayV date={cur} appts={sd.appointments} ac={ac} onSlot={openSlot} dv={dv}/>}
      {view==="week" && <WeekV date={cur} appts={sd.appointments} ac={ac} onSlot={openSlot} dv={dv}/>}
      {apptM && <ApptModal sd={sd} date={selD} time={selT} ac={ac} onSave={async(r: any)=>{await addAppt(r);setApptM(false);}} onClose={()=>setApptM(false)}/>}
      {charM && <CharModal sd={sd} date={selD} ac={ac} onSave={async(r: any)=>{await addAppt(r);setCharM(false);}} onClose={()=>setCharM(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  BARBERS TAB
// ═══════════════════════════════════════════════
function BarTab({ sd, ac, dv, addBarber, delBarber }: any) {
  const [showF, setShowF] = useState(false);
  const [name, setName]   = useState("");
  const [color, setColor] = useState("#E74C3C");
  const [saving, setSaving] = useState(false);
  const mob=dv==="m", tab_=dv==="t";
  const p = mob?12:tab_?18:28;
  const add = async () => {
    if(!name.trim()) return; setSaving(true);
    const av = name.trim().split(" ").map((w: string)=>w[0]).join("").slice(0,2).toUpperCase();
    await addBarber({name:name.trim(),avatar:av,color});
    setName(""); setShowF(false); setSaving(false);
  };
  return (
    <div style={{padding:p,maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:mob?14:22,gap:10}}>
        <div>
          <div style={{fontSize:mob?20:26,fontWeight:900,color:"#fff",fontFamily:"Georgia,serif"}}>Barberos</div>
          <div style={{fontSize:mob?11:13,color:"#666",marginTop:2}}>{sd.barbers.length} activos</div>
        </div>
        <button style={{background:ac,border:"none",color:"#111",cursor:"pointer",padding:mob?"7px 12px":"9px 16px",borderRadius:9,fontWeight:800,fontSize:mob?11:13}} onClick={()=>setShowF(f=>!f)}>
          {showF?"✕ Cancelar":"+ Nuevo"}
        </button>
      </div>
      {showF && (
        <div style={{...S.card,marginBottom:20,display:"flex",flexDirection:"column",gap:14}}>
          <FG label="Nombre completo"><input style={S.fi} value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Carlos Ruiz" onKeyDown={e=>e.key==="Enter"&&add()}/></FG>
          <FG label="Color">
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {BCOLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:mob?26:32,height:mob?26:32,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #fff":"3px solid transparent",boxShadow:color===c?`0 0 0 2px ${c}`:"none"}}/>)}
            </div>
          </FG>
          <button style={{...S.btnG,background:ac,opacity:saving?.6:1}} onClick={add}>{saving?"Añadiendo…":"Añadir barbero"}</button>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":tab_?"repeat(3,1fr)":"repeat(auto-fill,minmax(170px,1fr))",gap:mob?10:16}}>
        {sd.barbers.map((b: any)=>(
          <div key={b.id} style={{...S.card,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:mob?7:10}}>
            <div style={{width:mob?46:60,height:mob?46:60,borderRadius:"50%",background:(b.color||"#888")+"33",color:b.color||"#888",border:`2px solid ${b.color||"#888"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:mob?16:22,fontWeight:800}}>{b.avatar||"?"}</div>
            <div style={{fontWeight:700,color:"#fff",fontSize:mob?12:14}}>{b.name}</div>
            <div style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:(b.color||"#888")+"22",color:b.color||"#888"}}>Activo</div>
            <button style={{background:"none",border:"1px solid #333",borderRadius:8,color:"#E74C3C",cursor:"pointer",padding:"5px 10px",fontSize:11}} onClick={()=>delBarber(b.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  CONFIG TAB (PIN protected)
// ═══════════════════════════════════════════════
function CfgTab({ wk, sd, ac, dv, saveServices, delService, updateWk }: any) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr]     = useState("");
  const [sub, setSub]           = useState("info");
  const mob = dv==="m";
  const tryPin = () => { if(pinInput===(wk.owner_pin||"1234")){setUnlocked(true);setPinErr("");}else{setPinErr("PIN incorrecto.");setPinInput("");} };
  const SUBS = [{id:"info",ic:"🏪",lb:"Barbería"},{id:"svcs",ic:"✂",lb:"Servicios"},{id:"fin",ic:"💰",lb:"Finanzas"},{id:"stats",ic:"📊",lb:"Estadísticas"}];

  if(!unlocked) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",padding:20}}>
      <div style={{...S.card,width:mob?"100%":360,maxWidth:"100%",textAlign:"center",padding:mob?24:36}}>
        <div style={{fontSize:48,marginBottom:12}}>🔐</div>
        <div style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",marginBottom:8}}>Área del propietario</div>
        <div style={{fontSize:13,color:"#666",marginBottom:24,lineHeight:1.6}}>Introduce el PIN para acceder a configuración y finanzas.</div>
        <FG label="PIN"><input style={{...S.fi,textAlign:"center",fontSize:24,letterSpacing:10}} type="password" value={pinInput} onChange={e=>setPinInput(e.target.value.replace(/\D/g,"").slice(0,8))} placeholder="••••" onKeyDown={e=>e.key==="Enter"&&tryPin()}/></FG>
        {pinErr && <div style={{...S.err,marginTop:10}}>{pinErr}</div>}
        <button style={{...S.btnG,background:ac,width:"100%",marginTop:16}} onClick={tryPin}>ACCEDER</button>
      </div>
    </div>
  );

  const p = mob?10:28;
  return (
    <div style={{padding:p,maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:mob?14:22}}>
        <div>
          <div style={{fontSize:mob?18:24,fontWeight:900,color:"#fff",fontFamily:"Georgia,serif"}}>⚙️ Configuración</div>
          <div style={{fontSize:11,color:ac,marginTop:2}}>🔓 Propietario</div>
        </div>
        <button style={{background:"none",border:"1px solid #333",color:"#E74C3C",cursor:"pointer",padding:"6px 12px",borderRadius:8,fontSize:12}} onClick={()=>setUnlocked(false)}>Bloquear</button>
      </div>
      <div style={{display:"flex",gap:mob?4:8,marginBottom:mob?14:22,flexWrap:"wrap"}}>
        {SUBS.map(st=>(
          <button key={st.id} style={{background:sub===st.id?ac:"#1a1a1a",border:"1px solid #333",borderRadius:9,color:sub===st.id?"#111":"#888",cursor:"pointer",padding:mob?"7px 10px":"8px 16px",fontSize:mob?11:13,fontWeight:700,display:"flex",alignItems:"center",gap:5}} onClick={()=>setSub(st.id)}>
            <span>{st.ic}</span><span>{mob?st.lb.slice(0,5):st.lb}</span>
          </button>
        ))}
      </div>
      {sub==="info"  && <CfgInfo  wk={wk} ac={ac} dv={dv} updateWk={updateWk}/>}
      {sub==="svcs"  && <CfgSvcs  sd={sd} ac={ac} dv={dv} saveServices={saveServices} delService={delService}/>}
      {sub==="fin"   && <CfgFin   sd={sd} ac={ac} dv={dv}/>}
      {sub==="stats" && <CfgStats sd={sd} ac={ac} dv={dv}/>}
    </div>
  );
}

function CfgInfo({ wk, ac, dv, updateWk }: any) {
  const [info, setInfo] = useState({name:wk.name||"",address:wk.address||"",phone:wk.phone||"",schedule:wk.schedule||""});
  const [pass, setPass] = useState({cur:"",nxt:"",cfm:""});
  const [msg, setMsg]   = useState("");
  const [saving, setSaving] = useState(false);
  const mob = dv==="m";
  const show = (m: string) => { setMsg(m); setTimeout(()=>setMsg(""),4000); };
  const saveInfo = async () => { setSaving(true); const e=await updateWk(info); show(e?"❌ "+e:"✅ Datos guardados."); setSaving(false); };
  const savePass = async () => {
    if(pass.cur!==wk.password_hash) return show("❌ Contraseña actual incorrecta.");
    if(pass.nxt.length<6) return show("❌ Mínimo 6 caracteres.");
    if(pass.nxt!==pass.cfm) return show("❌ Las contraseñas no coinciden.");
    setSaving(true); await updateWk({password_hash:pass.nxt}); setPass({cur:"",nxt:"",cfm:""}); show("✅ Contraseña actualizada."); setSaving(false);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={S.card}>
        <div style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",marginBottom:16}}>Datos de la barbería</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:14}}>
          <FG label="Nombre"><input style={S.fi} value={info.name} onChange={e=>setInfo(i=>({...i,name:e.target.value}))}/></FG>
          <FG label="Dirección"><input style={S.fi} value={info.address} onChange={e=>setInfo(i=>({...i,address:e.target.value}))} placeholder="Calle, número, ciudad"/></FG>
          <FG label="Teléfono"><input style={S.fi} value={info.phone} onChange={e=>setInfo(i=>({...i,phone:e.target.value}))} placeholder="91 123 45 67"/></FG>
          <FG label="Horario"><input style={S.fi} value={info.schedule} onChange={e=>setInfo(i=>({...i,schedule:e.target.value}))} placeholder="Lun–Sáb 9:00–20:00"/></FG>
        </div>
        {msg && <div style={{...(msg.startsWith("✅")?S.ok:S.err),marginTop:10}}>{msg}</div>}
        <button style={{...S.btnG,background:ac,marginTop:14,opacity:saving?.6:1}} onClick={saveInfo}>{saving?"Guardando…":"Guardar datos"}</button>
      </div>
      <div style={S.card}>
        <div style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",marginBottom:16}}>Cambiar contraseña</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:14}}>
          <FG label="Contraseña actual"><input style={S.fi} type="password" value={pass.cur} onChange={e=>setPass(p=>({...p,cur:e.target.value}))}/></FG>
          <FG label="Nueva contraseña"><input style={S.fi} type="password" value={pass.nxt} onChange={e=>setPass(p=>({...p,nxt:e.target.value}))}/></FG>
          <FG label="Confirmar nueva"><input style={S.fi} type="password" value={pass.cfm} onChange={e=>setPass(p=>({...p,cfm:e.target.value}))}/></FG>
        </div>
        <button style={{...S.btnG,background:ac,marginTop:14,opacity:saving?.6:1}} onClick={savePass}>Cambiar contraseña</button>
      </div>
    </div>
  );
}

function CfgSvcs({ sd, ac, dv, saveServices, delService }: any) {
  const [svcs, setSvcs] = useState(sd.services.map((s: any)=>({...s})));
  const [msg, setMsg]   = useState("");
  const [saving, setSaving] = useState(false);
  const mob = dv==="m";
  const upd = (id: string, k: string, v: any) => setSvcs((ss: any[])=>ss.map(s=>s.id===id?{...s,[k]:v}:s));
  const add  = () => setSvcs((ss: any[])=>[...ss,{id:`new_${Date.now()}`,name:"Nuevo servicio",price:10,_new:true}]);
  const save = async () => { setSaving(true); await saveServices(svcs); setMsg("✅ Precios guardados."); setTimeout(()=>setMsg(""),3000); setSaving(false); };
  return (
    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>Servicios y precios</div>
        <button style={{...S.btnG,background:ac,padding:"7px 14px",fontSize:13}} onClick={add}>+ Añadir</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {svcs.map((s: any)=>(
          <div key={s.id} style={{display:"flex",gap:10,alignItems:"center",background:"#111",borderRadius:10,padding:"10px 12px"}}>
            <input style={{...S.fi,flex:1}} value={s.name} onChange={e=>upd(s.id,"name",e.target.value)}/>
            <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
              <input style={{...S.fi,width:mob?60:76,textAlign:"right"}} type="number" value={s.price} onChange={e=>upd(s.id,"price",parseFloat(e.target.value)||0)}/>
              <span style={{color:"#666",fontSize:13}}>€</span>
            </div>
            <button style={{background:"none",border:"none",color:"#E74C3C",cursor:"pointer",fontSize:16,flexShrink:0}} onClick={()=>{if(!s._new)delService(s.id);setSvcs((ss: any[])=>ss.filter(x=>x.id!==s.id));}}>✕</button>
          </div>
        ))}
      </div>
      {msg && <div style={{...S.ok,marginTop:12}}>{msg}</div>}
      <button style={{...S.btnG,background:ac,marginTop:16,opacity:saving?.6:1}} onClick={save}>{saving?"Guardando…":"Guardar precios"}</button>
    </div>
  );
}

function CfgFin({ sd, ac, dv }: any) {
  const mob = dv==="m";
  const [filter, setFilter] = useState("all");
  const charges = sd.appointments.filter((a: any)=>a.paid);
  const stats = (ap: any[]) => ({total:ap.reduce((s,a)=>s+(+a.price||0),0),met:ap.filter(a=>a.payment==="metalico").reduce((s,a)=>s+(+a.price||0),0),tar:ap.filter(a=>a.payment==="tarjeta").reduce((s,a)=>s+(+a.price||0),0),n:ap.length});
  const wd = weekDays(TODAY), cm = TODAY.slice(0,7);
  const W = stats(charges.filter((a: any)=>wd.includes(a.date)));
  const M = stats(charges.filter((a: any)=>(a.date||"").startsWith(cm)));
  const filtered = filter==="all"?charges:charges.filter((a: any)=>a.payment===filter);
  const Box = ({ic,val,lbl,hi}:{ic:string;val:string;lbl:string;hi?:boolean}) => (
    <div style={{background:"#111",borderRadius:10,padding:mob?"10px 6px":"14px 10px",textAlign:"center"}}>
      <div style={{fontSize:mob?18:22,marginBottom:5}}>{ic}</div>
      <div style={{fontSize:mob?14:20,fontWeight:900,color:hi?ac:"#fff",fontFamily:"Georgia,serif"}}>{val}</div>
      <div style={{fontSize:9,color:"#666",textTransform:"uppercase",letterSpacing:1,marginTop:3}}>{lbl}</div>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {[["Semana",W,"📊","📈",false],["Mes",M,"📈","📊",true]].map(([period,Sx,ic1,,hi])=>(
        <div key={period as string} style={S.card}>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",marginBottom:14}}>{period==="Semana"?"Esta semana":"Este mes"}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:mob?8:12}}>
            <Box ic={ic1 as string} val={fmt((Sx as any).total)} lbl={`Total · ${(Sx as any).n}`} hi={hi as boolean}/>
            <Box ic="💵" val={fmt((Sx as any).met)} lbl="Metálico"/>
            <Box ic="💳" val={fmt((Sx as any).tar)} lbl="Tarjeta"/>
          </div>
        </div>
      ))}
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>Registro de cobros</div>
          <div style={{display:"flex",gap:6}}>
            {[["all","Todos"],["metalico","💵"],["tarjeta","💳"]].map(([v,l])=>(
              <button key={v} style={{background:filter===v?ac:"#1a1a1a",color:filter===v?"#111":"#888",border:"1px solid #333",borderRadius:7,cursor:"pointer",padding:"5px 10px",fontSize:mob?10:12,fontWeight:700}} onClick={()=>setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {filtered.length===0&&<div style={{textAlign:"center",color:"#555",fontSize:13,padding:"24px 0"}}>Sin cobros registrados.</div>}
          {[...filtered].reverse().map((a: any)=>{
            const col=a.barber_color||"#888";
            return (
              <div key={a.id} style={{background:"#111",borderRadius:10,padding:mob?"9px 10px":"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:3,height:34,borderRadius:2,background:col,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,color:"#fff",fontSize:mob?12:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.service_name||"—"}</div>
                  <div style={{fontSize:mob?9:11,color:"#666",marginTop:1}}>{a.barber_name} · {a.date}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:mob?13:16,fontWeight:800,color:GOLD,fontFamily:"Georgia,serif"}}>{fmt(a.price)}</div>
                  <div style={{padding:"2px 6px",borderRadius:5,fontSize:9,fontWeight:600,marginTop:3,display:"inline-block",background:a.payment==="metalico"?"#2ECC7133":"#3498DB33",color:a.payment==="metalico"?"#2ECC71":"#3498DB"}}>{a.payment==="metalico"?"💵":"💳"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CfgStats({ sd, ac, dv }: any) {
  const mob = dv==="m";
  const [period, setPeriod] = useState("week");
  const charges = sd.appointments.filter((a: any)=>a.paid);
  const wd = weekDays(TODAY), cm = TODAY.slice(0,7);
  const rel = period==="week"?charges.filter((a: any)=>wd.includes(a.date)):charges.filter((a: any)=>(a.date||"").startsWith(cm));
  const byBar = sd.barbers.map((b: any)=>{
    const ba = rel.filter((a: any)=>a.barber_id===b.id);
    return {...b,n:ba.length,total:ba.reduce((s: number,a: any)=>s+(+a.price||0),0),met:ba.filter((a: any)=>a.payment==="metalico").reduce((s: number,a: any)=>s+(+a.price||0),0),tar:ba.filter((a: any)=>a.payment==="tarjeta").reduce((s: number,a: any)=>s+(+a.price||0),0),svcs:ba};
  }).sort((a: any,b: any)=>b.total-a.total);
  const tot = byBar.reduce((s: number,b: any)=>s+b.total,0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8}}>
        {[["week","Esta semana"],["month","Este mes"]].map(([v,l])=>(
          <button key={v} style={{background:period===v?ac:"#1a1a1a",border:"1px solid #333",borderRadius:9,color:period===v?"#111":"#888",cursor:"pointer",padding:"8px 16px",fontSize:13,fontWeight:700}} onClick={()=>setPeriod(v)}>{l}</button>
        ))}
      </div>
      {byBar.map((b: any,i: number)=>{
        const col=b.color||"#888";
        const pct=tot>0?Math.round(b.total/tot*100):0;
        return (
          <div key={b.id} style={S.card}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
              <div style={{width:mob?44:56,height:mob?44:56,borderRadius:"50%",background:col+"33",color:col,border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:mob?16:22,fontWeight:800,flexShrink:0}}>{b.avatar||"?"}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,color:"#fff",fontSize:mob?14:16}}>{b.name}</div>
                <div style={{fontSize:12,color:"#666",marginTop:2}}>{b.n} servicios · {fmt(b.total)}</div>
                <div style={{marginTop:8,background:"#222",borderRadius:4,height:6,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:4}}/></div>
                <div style={{fontSize:10,color:"#666",marginTop:3}}>{pct}% del total</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:mob?16:22,fontWeight:900,color:col,fontFamily:"Georgia,serif"}}>{fmt(b.total)}</div>
                <div style={{fontSize:10,color:"#666",marginTop:2}}>#{i+1}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{background:"#2ECC7111",border:"1px solid #2ECC7133",borderRadius:8,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:11,color:"#2ECC71",fontWeight:700}}>💵 Metálico</div><div style={{fontSize:15,fontWeight:800,color:"#fff",marginTop:3}}>{fmt(b.met)}</div></div>
              <div style={{background:"#3498DB11",border:"1px solid #3498DB33",borderRadius:8,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:11,color:"#3498DB",fontWeight:700}}>💳 Tarjeta</div><div style={{fontSize:15,fontWeight:800,color:"#fff",marginTop:3}}>{fmt(b.tar)}</div></div>
            </div>
          </div>
        );
      })}
      {byBar.every((b: any)=>b.n===0)&&<div style={{textAlign:"center",color:"#555",fontSize:14,padding:"40px 0"}}>Sin cobros este {period==="week"?"semana":"mes"}.</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════
export default function Home() {
  const dv = useDevice();
  const [wk, setWk]   = useState<any>(null);
  const [sd, setSd]   = useState<any>(null);
  const [loading, setLd] = useState(false);
  const [tab, setTab] = useState("cal");
  const [showLogo, setLogo] = useState(false);

  const load = useCallback(async (wid: string) => {
    setLd(true);
    const [b, s, a] = await Promise.all([
      db.get("barbers",      {workshop_id:wid}),
      db.get("services",     {workshop_id:wid}),
      db.get("appointments", {workshop_id:wid}),
    ]);
    setSd({
      barbers:      (b.data||[]).filter((x: any)=>x.active!==false),
      services:     (s.data||[]).filter((x: any)=>x.active!==false),
      appointments: a.data||[],
    });
    setLd(false);
  }, []);

  const onLogin  = useCallback((w: any)=>{setWk(w);load(w.id);setTab("cal");},[load]);
  const onLogout = ()=>{setWk(null);setSd(null);};

  const saveLogo = async ({name,logo_url}: any) => { await db.patch("workshops",{name,logo_url},{id:wk.id}); setWk((w: any)=>({...w,name,logo_url})); setLogo(false); };

  const addAppt = useCallback(async (rec: any) => {
    const {data,error} = await db.post("appointments",{workshop_id:wk.id,barber_id:rec.barberId,barber_name:rec.barberName,barber_color:rec.barberColor,type:rec.type,client:rec.client||null,service_name:rec.serviceName,price:rec.price,payment:rec.payment||null,paid:rec.paid||false,date:rec.date,time:rec.time||new Date().toTimeString().slice(0,5)});
    if(!error&&data) setSd((p: any)=>({...p,appointments:[...p.appointments,data]}));
  }, [wk]);

  const addBarber = useCallback(async ({name,avatar,color}: any) => {
    const {data,error} = await db.post("barbers",{workshop_id:wk.id,name,avatar,color,active:true});
    if(!error&&data) setSd((p: any)=>({...p,barbers:[...p.barbers,data]}));
  }, [wk]);

  const delBarber = useCallback(async (id: string) => {
    await db.patch("barbers",{active:false},{id});
    setSd((p: any)=>({...p,barbers:p.barbers.filter((b: any)=>b.id!==id)}));
  }, []);

  const saveServices = useCallback(async (list: any[]) => {
    await Promise.all(list.map(s=>s._new?db.post("services",{workshop_id:wk.id,name:s.name,price:s.price,active:true}):db.patch("services",{name:s.name,price:s.price},{id:s.id})));
    const {data} = await db.get("services",{workshop_id:wk.id});
    setSd((p: any)=>({...p,services:(data||[]).filter((x: any)=>x.active!==false)}));
  }, [wk]);

  const delService = useCallback(async (id: string) => {
    await db.patch("services",{active:false},{id});
    setSd((p: any)=>({...p,services:p.services.filter((s: any)=>s.id!==id)}));
  }, []);

  const updateWk = useCallback(async (fields: any) => {
    const {error} = await db.patch("workshops",fields,{id:wk.id});
    if(!error) setWk((w: any)=>({...w,...fields}));
    return error;
  }, [wk]);

  if (!wk) return <Auth onLogin={onLogin} dv={dv}/>;
  if (loading||!sd) return <div style={{minHeight:"100vh",background:"#0D0D0D",display:"flex",alignItems:"center",justifyContent:"center"}}><Spin/></div>;

  const ac = wk.color||GOLD;
  const mob=dv==="m", tab_=dv==="t";
  const NAV = [{id:"cal",ic:"📅",lb:"Calendario"},{id:"bar",ic:"💈",lb:"Barberos"},{id:"cfg",ic:"⚙️",lb:"Config."}];
  const props = {wk,sd,setSd,ac,dv,addAppt,addBarber,delBarber,saveServices,delService,updateWk};

  const Content = () => {
    if(tab==="cal") return <CalTab {...props}/>;
    if(tab==="bar") return <BarTab {...props}/>;
    if(tab==="cfg") return <CfgTab {...props}/>;
    return null;
  };

  // ── MOBILE
  if(mob) return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#0D0D0D",color:"#E8E8E8",overflow:"hidden"}}>
      <header style={{background:"#141414",borderBottom:"1px solid #222",padding:"0 14px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:34,height:34,borderRadius:9,overflow:"hidden",background:"#1a1a1a",border:"1px solid #2a2a2a",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={()=>setLogo(true)}>
            {wk.logo_url?<img src={wk.logo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:16,color:ac}}>✂</span>}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif"}}>{wk.name}</div>
            <button style={{background:"none",border:"none",color:ac,fontSize:9,padding:0,cursor:"pointer",fontWeight:600}} onClick={()=>setLogo(true)}>✏ Editar</button>
          </div>
        </div>
        <button style={{background:"none",border:"1px solid #333",color:"#666",cursor:"pointer",padding:"4px 10px",borderRadius:6,fontSize:11}} onClick={onLogout}>Salir</button>
      </header>
      <div style={{flex:1,overflow:"auto"}}><Content/></div>
      <nav style={{background:"#141414",borderTop:"1px solid #222",display:"flex",flexShrink:0}}>
        {NAV.map(n=>(
          <button key={n.id} style={{flex:1,background:"none",border:"none",color:tab===n.id?ac:"#666",cursor:"pointer",padding:"9px 0 7px",display:"flex",flexDirection:"column",alignItems:"center",gap:2}} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:20}}>{n.ic}</span>
            <span style={{fontSize:9,fontWeight:700}}>{n.lb}</span>
            {tab===n.id&&<div style={{width:16,height:2,borderRadius:1,background:ac}}/>}
          </button>
        ))}
      </nav>
      {showLogo&&<LogoModal wk={wk} onSave={saveLogo} onClose={()=>setLogo(false)}/>}
      <DevBadge dv={dv}/>
    </div>
  );

  // ── TABLET
  if(tab_) return (
    <div style={{display:"flex",height:"100vh",background:"#0D0D0D",color:"#E8E8E8",overflow:"hidden"}}>
      <aside style={{width:68,background:"#141414",borderRight:"1px solid #222",display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 0",flexShrink:0}}>
        <div style={{width:40,height:40,borderRadius:10,overflow:"hidden",background:"#1a1a1a",border:"1px solid #2a2a2a",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:3}} onClick={()=>setLogo(true)}>
          {wk.logo_url?<img src={wk.logo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:18,color:ac}}>✂</span>}
        </div>
        <button style={{background:"none",border:"none",color:ac,fontSize:9,cursor:"pointer",marginBottom:10,fontWeight:700}} onClick={()=>setLogo(true)}>✏</button>
        <div style={{width:"80%",height:1,background:"#222",marginBottom:8}}/>
        {NAV.map(n=>(
          <button key={n.id} style={{width:52,height:52,background:tab===n.id?"#1e1e1e":"none",border:"none",borderRadius:12,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,marginBottom:4,position:"relative"}} onClick={()=>setTab(n.id)}>
            {tab===n.id&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,borderRadius:2,background:ac}}/>}
            <span style={{fontSize:20}}>{n.ic}</span>
            <span style={{fontSize:8,color:tab===n.id?ac:"#666",fontWeight:700,textTransform:"uppercase"}}>{n.lb.slice(0,5)}</span>
          </button>
        ))}
        <button style={{marginTop:"auto",background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:18}} onClick={onLogout} title="Salir">⬅</button>
      </aside>
      <main style={{flex:1,overflow:"auto"}}><Content/></main>
      {showLogo&&<LogoModal wk={wk} onSave={saveLogo} onClose={()=>setLogo(false)}/>}
      <DevBadge dv={dv}/>
    </div>
  );

  // ── DESKTOP
  return (
    <div style={{display:"flex",height:"100vh",background:"#0D0D0D",color:"#E8E8E8",overflow:"hidden"}}>
      <aside style={{width:230,background:"#141414",borderRight:"1px solid #222",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"18px 14px 14px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:52,height:52,borderRadius:14,overflow:"hidden",background:"#1a1a1a",border:"1.5px solid #2a2a2a",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {wk.logo_url?<img src={wk.logo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:26,color:ac}}>✂</span>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{wk.name}</div>
            <button style={{background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,color:ac,padding:0,marginTop:3}} onClick={()=>setLogo(true)}>✏ Editar logo</button>
          </div>
        </div>
        <div style={{height:1,background:"#222",margin:"0 14px"}}/>
        <nav style={{flex:1,padding:"14px 10px",display:"flex",flexDirection:"column",gap:4}}>
          {NAV.map(n=>(
            <button key={n.id} style={{background:tab===n.id?"#1e1e1e":"none",border:"none",color:tab===n.id?"#fff":"#888",cursor:"pointer",padding:"12px 16px",borderRadius:10,display:"flex",alignItems:"center",gap:12,fontSize:14,fontWeight:600,textAlign:"left",position:"relative"}} onClick={()=>setTab(n.id)}>
              {tab===n.id&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,borderRadius:2,background:ac}}/>}
              <span style={{fontSize:18}}>{n.ic}</span><span>{n.lb}</span>
            </button>
          ))}
        </nav>
        <button style={{background:"none",border:"none",color:"#555",cursor:"pointer",padding:"12px 20px",fontSize:13,textAlign:"left"}} onClick={onLogout}>← Cerrar sesión</button>
      </aside>
      <main style={{flex:1,overflow:"auto"}}><Content/></main>
      {showLogo&&<LogoModal wk={wk} onSave={saveLogo} onClose={()=>setLogo(false)}/>}
      <DevBadge dv={dv}/>
    </div>
  );
}
