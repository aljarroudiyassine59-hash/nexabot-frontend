import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = async (path, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(`${API_URL}${path}`, { headers, ...options });
  if (!res.ok) throw new Error((await res.json()).detail || "Erreur API");
  return res.json();
};

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#07090E", panel: "#0C1018", card: "#101620",
  border: "#1A2535", border2: "#243040",
  green: "#00E87A", green2: "#00C268", teal: "#00D4B4",
  blue: "#4F8EF7", orange: "#FF7A2F", red: "#FF4757",
  yellow: "#FFD32A", purple: "#A855F7",
  text: "#E4EEF8", text2: "#8096B0", text3: "#3A5068",
  font: "'Outfit', 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── MOCK DATA (replaced by real API calls in production) ─────────────────────
const revenueData = [
  { m: "Oct", r: 3800, c: 52 }, { m: "Nov", r: 6200, c: 98 },
  { m: "Déc", r: 9100, c: 141 }, { m: "Jan", r: 12600, c: 192 },
  { m: "Fév", r: 16400, c: 251 }, { m: "Mar", r: 19800, c: 312 },
];
const weekData = [
  { j: "Lun", in: 312, out: 280, ai: 312 }, { j: "Mar", in: 560, out: 490, ai: 558 },
  { j: "Mer", in: 445, out: 380, ai: 444 }, { j: "Jeu", in: 710, out: 630, ai: 709 },
  { j: "Ven", in: 890, out: 780, ai: 886 }, { j: "Sam", in: 340, out: 290, ai: 338 },
  { j: "Dim", in: 180, out: 150, ai: 180 },
];
const geoData = [
  { name: "🇲🇦 Maroc", value: 34, color: T.green }, { name: "🇳🇬 Nigeria", value: 22, color: T.teal },
  { name: "🇧🇷 Brésil", value: 18, color: T.blue }, { name: "🇮🇳 Inde", value: 15, color: T.orange },
  { name: "🌍 Autres", value: 11, color: T.text3 },
];
const MOCK_CONTACTS = [
  { id:1, name:"Fatima Zahra",       phone:"+212612345678", tag:"VIP",      status:"active",   msgs:134, conv:"12m",  country:"🇲🇦" },
  { id:2, name:"Chidi Okonkwo",      phone:"+2348034567890",tag:"Lead",     status:"active",   msgs:23,  conv:"4h",   country:"🇳🇬" },
  { id:3, name:"Priya Sharma",       phone:"+919876543210", tag:"Client",   status:"inactive", msgs:89,  conv:"1j",   country:"🇮🇳" },
  { id:4, name:"Lucas Ferreira",     phone:"+5511987654321",tag:"Prospect", status:"active",   msgs:12,  conv:"30m",  country:"🇧🇷" },
  { id:5, name:"Amina Benali",       phone:"+213555123456", tag:"VIP",      status:"active",   msgs:201, conv:"5m",   country:"🇩🇿" },
  { id:6, name:"Mohammed Al-Rashid", phone:"+966501234567", tag:"Client",   status:"active",   msgs:56,  conv:"2h",   country:"🇸🇦" },
  { id:7, name:"Youssef Tazi",       phone:"+212698765432", tag:"VIP",      status:"active",   msgs:178, conv:"8m",   country:"🇲🇦" },
  { id:8, name:"Taiwo Adeyemi",      phone:"+2347065432109",tag:"Lead",     status:"inactive", msgs:8,   conv:"3j",   country:"🇳🇬" },
];
const MOCK_CAMPAIGNS = [
  { id:1, name:"Promo Ramadan 2026",      status:"running",   sent:1240, opened:980,  conv:156, color: T.green  },
  { id:2, name:"Relance Panier Abandonné",status:"running",   sent:540,  opened:410,  conv:89,  color: T.teal   },
  { id:3, name:"Bienvenue Nouveaux",      status:"scheduled", sent:0,    opened:0,    conv:0,   color: T.blue   },
  { id:4, name:"Black Friday 2025",       status:"completed", sent:3200, opened:2640, conv:512, color: T.text3  },
];
const INTEGRATIONS = [
  { name:"WhatsApp Cloud API",  logo:"💬", status:"connected",    color: T.green  },
  { name:"Claude AI (Sonnet)",  logo:"🤖", status:"connected",    color: T.teal   },
  { name:"Stripe Payments",     logo:"💳", status:"connected",    color: T.blue   },
  { name:"Twilio SMS Fallback", logo:"📱", status:"connected",    color: T.orange },
  { name:"HubSpot CRM Sync",    logo:"🔗", status:"disconnected", color: T.text3  },
  { name:"Zapier Automation",   logo:"⚡", status:"disconnected", color: T.text3  },
  { name:"Calendly Booking",    logo:"📅", status:"disconnected", color: T.text3  },
  { name:"Shopify Orders",      logo:"🛍️", status:"disconnected", color: T.text3  },
];
const PLANS = [
  { key:"starter",    name:"Starter",    price:"29€",  contacts:"500",  bots:1, campaigns:"5",  users:1, color: T.teal   },
  { key:"growth",     name:"Growth",     price:"79€",  contacts:"2 500",bots:5, campaigns:"∞",  users:5, color: T.green, badge:"POPULAIRE" },
  { key:"enterprise", name:"Enterprise", price:"299€", contacts:"∞",    bots:"∞",campaigns:"∞",users:"∞",color: T.orange },
];
const DEFAULT_PROMPT = `Tu es un assistant commercial IA professionnel et chaleureux.\n\nObjectifs:\n1. Accueillir le client avec enthousiasme\n2. Présenter les produits/services disponibles\n3. Prendre les commandes ou réservations\n4. Répondre aux questions (livraison, prix, délais)\n\nRègles:\n- Maximum 3 phrases par réponse\n- Toujours proposer une action concrète\n- Utiliser les emojis avec modération\n- Langue principale: Français`;

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
const Pill = ({ c = T.green, children, sm }) => (
  <span style={{ display:"inline-flex", alignItems:"center", padding: sm ? "2px 7px" : "3px 10px", borderRadius:20, fontSize: sm ? 10 : 11, fontWeight:600, background:`${c}18`, color:c, border:`1px solid ${c}30` }}>{children}</span>
);
const Dot = ({ on }) => (
  <div style={{ width:7, height:7, borderRadius:"50%", background: on ? T.green : T.text3, boxShadow: on ? `0 0 6px ${T.green}` : "none" }} />
);
const Card = ({ children, style }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, ...style }}>{children}</div>
);
const KPI = ({ icon, label, value, sub, color=T.green }) => (
  <Card style={{ padding:"20px 22px", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }} />
    <div style={{ fontSize:20, marginBottom:10 }}>{icon}</div>
    <div style={{ fontSize:26, fontWeight:800, color, letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:12, color:T.text2, marginTop:6 }}>{label}</div>
    {sub && <div style={{ fontSize:11, color, marginTop:4 }}>{sub}</div>}
  </Card>
);
const Section = ({ title, sub, children, action }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:10 }}>
      <div>
        <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, color:T.text }}>{title}</h2>
        {sub && <p style={{ margin:0, fontSize:13, color:T.text2 }}>{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, variant="primary", color=T.green, small, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "6px 14px" : "9px 20px", borderRadius:9, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: small ? 12 : 13, fontWeight:600, transition:"all 0.15s", opacity: disabled ? 0.5 : 1,
    background: variant==="primary" ? color : variant==="ghost" ? `${color}18` : T.panel,
    border: variant==="primary" ? "none" : `1px solid ${variant==="ghost" ? color+"40" : T.border}`,
    color: variant==="primary" ? "#000" : color || T.text2,
  }}>{children}</button>
);
const Input = ({ value, onChange, placeholder, type="text", multiline, rows=4, style: sx }) => {
  const base = { width:"100%", padding:"9px 14px", borderRadius:9, background:T.panel, border:`1px solid ${T.border}`, color:T.text, fontSize:13, fontFamily:multiline ? T.mono : T.font, lineHeight:1.7, resize:"vertical", boxSizing:"border-box", ...sx };
  return multiline
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={base} />
    : <input value={value} onChange={onChange} placeholder={placeholder} type={type} style={base} />;
};

// ─── AUTH SCREENS ─────────────────────────────────────────────────────────────
const AuthScreen = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", company:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      let data;
      if (mode === "login") {
        data = await api("/auth/login", { method:"POST", body: JSON.stringify({ email:form.email, password:form.password }) });
      } else {
        data = await api("/auth/register", { method:"POST", body: JSON.stringify({ email:form.email, password:form.password, company_name:form.company }) });
      }
      onLogin(data.token, data.user || { email:form.email });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.font }}>
      <div style={{ width:"100%", maxWidth:420, padding:24 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg,${T.green},${T.teal})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 16px" }}>◈</div>
          <div style={{ fontSize:26, fontWeight:800, color:T.text }}>NexaBot</div>
          <div style={{ fontSize:13, color:T.text2, marginTop:4 }}>WhatsApp AI Business Suite</div>
        </div>

        <Card style={{ padding:32 }}>
          <div style={{ display:"flex", gap:8, marginBottom:28, background:T.panel, borderRadius:10, padding:4 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, padding:"8px", borderRadius:8, border:"none", cursor:"pointer",
                background: mode===m ? T.card : "transparent", color: mode===m ? T.text : T.text2,
                fontSize:13, fontWeight: mode===m ? 700 : 400,
              }}>{m==="login" ? "Connexion" : "Inscription"}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="register" && (
              <div>
                <label style={{ fontSize:11, color:T.text2, letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Nom de l'entreprise</label>
                <Input value={form.company} onChange={e => setForm(p => ({...p, company:e.target.value}))} placeholder="Mon Entreprise SARL" />
              </div>
            )}
            <div>
              <label style={{ fontSize:11, color:T.text2, letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Email</label>
              <Input value={form.email} onChange={e => setForm(p => ({...p, email:e.target.value}))} placeholder="vous@email.com" type="email" />
            </div>
            <div>
              <label style={{ fontSize:11, color:T.text2, letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Mot de passe</label>
              <Input value={form.password} onChange={e => setForm(p => ({...p, password:e.target.value}))} placeholder="••••••••" type="password" />
            </div>
          </div>

          {error && <div style={{ marginTop:14, padding:"9px 14px", borderRadius:9, background:`${T.red}15`, border:`1px solid ${T.red}30`, color:T.red, fontSize:12 }}>{error}</div>}

          <Btn onClick={submit} disabled={loading} style={{ width:"100%", marginTop:20 }}>
            {loading ? "Chargement..." : mode==="login" ? "Se connecter" : "Créer mon compte"}
          </Btn>

          <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:T.text3 }}>
            Version démo · Toutes les fonctionnalités actives
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = () => (
  <Section title="Dashboard" sub="Vue d'ensemble · Mars 2026">
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14 }}>
      <KPI icon="💬" label="Messages envoyés" value="4 437" sub="↑ +23% ce mois" />
      <KPI icon="👥" label="Contacts actifs"  value="1 247" sub="↑ +89 nouveaux" color={T.teal}   />
      <KPI icon="🤖" label="Taux réponse IA"  value="98.4%" sub="Quasi-parfait"   color={T.blue}   />
      <KPI icon="💶" label="MRR"              value="19 800€" sub="↑ +3 400€"     color={T.orange} />
      <KPI icon="🎯" label="Taux conversion"  value="31.4%" sub="↑ +4.2 pts"      color={T.yellow} />
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18 }}>
      <Card style={{ padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Revenus MRR</div>
            <div style={{ fontSize:12, color:T.text2 }}>6 derniers mois</div>
          </div>
          <Pill c={T.green}>↑ +121% YTD</Pill>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={T.green} stopOpacity={0.3} />
                <stop offset="95%" stopColor={T.green} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="m" tick={{ fill:T.text3, fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:T.text3, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k€`} />
            <Tooltip contentStyle={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }} formatter={v => [`${v.toLocaleString()}€`,"MRR"]} />
            <Area type="monotone" dataKey="r" stroke={T.green} strokeWidth={2.5} fill="url(#rg)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ padding:24 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>Marchés</div>
        <div style={{ fontSize:12, color:T.text2, marginBottom:16 }}>Répartition géo</div>
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie data={geoData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={4} dataKey="value">
              {geoData.map((e,i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }} formatter={(v,n)=>[v+"%",n]} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
          {geoData.map(d => (
            <div key={d.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ width:7, height:7, borderRadius:2, background:d.color }} />
                <span style={{ fontSize:12, color:T.text2 }}>{d.name}</span>
              </div>
              <span style={{ fontSize:12, color:d.color, fontWeight:600 }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <Card style={{ padding:24 }}>
      <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>Activité messagerie</div>
      <div style={{ fontSize:12, color:T.text2, marginBottom:20 }}>Cette semaine · Reçus vs Envoyés vs Traités par IA</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={weekData} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
          <XAxis dataKey="j" tick={{ fill:T.text3, fontSize:11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill:T.text3, fontSize:11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }} />
          <Bar dataKey="in"  fill={T.green}  radius={[3,3,0,0]} name="Reçus"   />
          <Bar dataKey="out" fill={T.teal}   radius={[3,3,0,0]} name="Envoyés" />
          <Bar dataKey="ai"  fill={T.orange} radius={[3,3,0,0]} name="IA traités" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  </Section>
);

// ─── CHATBOT BUILDER ──────────────────────────────────────────────────────────
const ChatbotBuilder = ({ token }) => {
  const [prompt, setPrompt]   = useState(DEFAULT_PROMPT);
  const [botName, setBotName] = useState("NexaBot");
  const [lang, setLang]       = useState("fr");
  const [msgs, setMsgs]       = useState([{ role:"assistant", content:"Bonjour ! 👋 Je suis NexaBot. Comment puis-je vous aider aujourd'hui ?" }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);
  const chatRef = useRef(null);

  const flows = [
    { icon:"👋", label:"Accueil", on:true   }, { icon:"📦", label:"Produits", on:true },
    { icon:"🛒", label:"Commande", on:true  }, { icon:"📍", label:"Livraison", on:false },
    { icon:"💳", label:"Paiement", on:false }, { icon:"⭐", label:"Avis client", on:false },
  ];

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [msgs]);

  const save = async () => {
    try {
      await api("/bot", { method:"PUT", body: JSON.stringify({ name:botName, system_prompt:prompt, language:lang, active:true }) }, token);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch { setSaved(false); }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role:"user", content:input.trim() };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs); setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system: prompt,
          messages: newMsgs.slice(-10).map(m => ({ role:m.role, content:m.content })),
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text||"").join("") || "⚠️ Erreur IA";
      setMsgs(p => [...p, { role:"assistant", content:text }]);
    } catch {
      setMsgs(p => [...p, { role:"assistant", content:"⚠️ Connexion IA indisponible." }]);
    }
    setLoading(false);
  };

  return (
    <Section title="Chatbot Builder" sub="Configurez votre bot IA · Test en temps réel">
      <div style={{ display:"flex", gap:18, height:"calc(100vh - 220px)", minHeight:520 }}>
        {/* Config sidebar */}
        <div style={{ width:240, display:"flex", flexDirection:"column", gap:14, flexShrink:0 }}>
          <Card style={{ padding:18 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:14 }}>⚙️ Configuration</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={{ fontSize:10, color:T.text2, textTransform:"uppercase", letterSpacing:"0.12em", display:"block", marginBottom:5 }}>Nom du bot</label>
                <Input value={botName} onChange={e => setBotName(e.target.value)} placeholder="NexaBot" />
              </div>
              <div>
                <label style={{ fontSize:10, color:T.text2, textTransform:"uppercase", letterSpacing:"0.12em", display:"block", marginBottom:5 }}>Langue</label>
                <select value={lang} onChange={e => setLang(e.target.value)} style={{ width:"100%", padding:"8px 12px", borderRadius:9, background:T.panel, border:`1px solid ${T.border}`, color:T.text, fontSize:13, boxSizing:"border-box" }}>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="ar">🇲🇦 Darija / Arabe</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="pt">🇧🇷 Português</option>
                  <option value="hi">🇮🇳 Hindi</option>
                  <option value="sw">🇰🇪 Swahili</option>
                </select>
              </div>
            </div>
          </Card>

          <Card style={{ padding:18, flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:14 }}>◈ Flows actifs</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {flows.map((f,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:8, background: f.on ? `${T.green}0F` : "transparent", border:`1px solid ${f.on ? T.green+"25" : T.border}`, cursor:"pointer" }}>
                  <span style={{ fontSize:14 }}>{f.icon}</span>
                  <span style={{ fontSize:12, color: f.on ? T.text : T.text3, flex:1 }}>{f.label}</span>
                  <Dot on={f.on} />
                </div>
              ))}
            </div>
            <Btn variant="ghost" style={{ width:"100%", marginTop:10 }} small>+ Ajouter flow</Btn>
          </Card>
        </div>

        {/* Center: prompt + stats */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>
          <Card style={{ padding:22, flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:12 }}>🧠 Prompt Système · Claude AI</div>
            <textarea
              value={prompt} onChange={e => setPrompt(e.target.value)}
              style={{ width:"100%", height:"calc(100% - 80px)", padding:14, borderRadius:9, background:T.bg, border:`1px solid ${T.border}`, color:T.text, fontSize:12, fontFamily:T.mono, lineHeight:1.8, resize:"none", boxSizing:"border-box" }}
            />
            <div style={{ display:"flex", gap:10, marginTop:12, justifyContent:"flex-end" }}>
              <Btn variant="outline" small>📄 Templates</Btn>
              <Btn onClick={save} small color={saved ? T.teal : T.green}>{saved ? "✓ Sauvegardé !" : "💾 Sauvegarder"}</Btn>
            </div>
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            <Card style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:18, fontWeight:800, color:T.green }}>1 247</div>
              <div style={{ fontSize:11, color:T.text2, marginTop:4 }}>Conversations actives</div>
            </Card>
            <Card style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:18, fontWeight:800, color:T.teal }}>4.8/5</div>
              <div style={{ fontSize:11, color:T.text2, marginTop:4 }}>Satisfaction client</div>
            </Card>
            <Card style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:18, fontWeight:800, color:T.orange }}>3.2%</div>
              <div style={{ fontSize:11, color:T.text2, marginTop:4 }}>Escalades humain</div>
            </Card>
          </div>
        </div>

        {/* Right: Live chat test */}
        <div style={{ width:290, display:"flex", flexDirection:"column", background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", flexShrink:0 }}>
          <div style={{ padding:"14px 16px", background:`${T.green}12`, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:T.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🤖</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{botName}</div>
              <div style={{ fontSize:11, color:T.green, display:"flex", alignItems:"center", gap:5 }}><Dot on /> Test IA Live</div>
            </div>
          </div>

          <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:"12px 12px", display:"flex", flexDirection:"column", gap:8 }}>
            {msgs.map((m,i) => (
              <div key={i} style={{ display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth:"82%", padding:"8px 12px", fontSize:12, lineHeight:1.6,
                  borderRadius: m.role==="user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                  background: m.role==="user" ? T.green : T.panel,
                  color: m.role==="user" ? "#000" : T.text,
                  border: m.role==="user" ? "none" : `1px solid ${T.border}`,
                }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", justifyContent:"flex-start" }}>
                <div style={{ padding:"8px 14px", borderRadius:"12px 12px 12px 3px", background:T.panel, border:`1px solid ${T.border}`, fontSize:12, color:T.text2 }}>●●●</div>
              </div>
            )}
          </div>

          <div style={{ padding:10, borderTop:`1px solid ${T.border}`, display:"flex", gap:8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
              placeholder="Tester le bot..." style={{ flex:1, padding:"7px 12px", borderRadius:20, background:T.panel, border:`1px solid ${T.border}`, color:T.text, fontSize:12, outline:"none" }} />
            <button onClick={send} disabled={loading}
              style={{ width:32, height:32, borderRadius:"50%", background: loading ? T.text3 : T.green, border:"none", cursor: loading ? "not-allowed" : "pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>➤</button>
          </div>
        </div>
      </div>
    </Section>
  );
};

// ─── CRM ──────────────────────────────────────────────────────────────────────
const CRM = () => {
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const tagColor = { VIP:T.yellow, Client:T.green, Lead:T.blue, Prospect:T.orange };
  const filtered = contacts.filter(c =>
    (filter==="all" || c.tag.toLowerCase()===filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
  );

  return (
    <Section title="CRM Contacts" sub={`${contacts.length} contacts · WhatsApp Business`}
      action={<div style={{ display:"flex", gap:10 }}>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{ width:200 }} />
        <Btn>+ Importer CSV</Btn>
      </div>}>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {["all","vip","client","lead","prospect"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
            border:`1px solid ${filter===f ? T.green : T.border}`, background: filter===f ? `${T.green}18` : T.card,
            color: filter===f ? T.green : T.text2, textTransform:"capitalize"
          }}>{f==="all" ? `Tous (${contacts.length})` : f.toUpperCase()}</button>
        ))}
      </div>

      <Card>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 90px 90px 70px 70px 120px", padding:"11px 20px", borderBottom:`1px solid ${T.border}`, background:T.panel }}>
          {["Contact","Téléphone","Tag","Statut","Messages","Actif","Actions"].map(h => (
            <div key={h} style={{ fontSize:10, color:T.text3, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase" }}>{h}</div>
          ))}
        </div>
        {filtered.map(c => (
          <div key={c.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 90px 90px 70px 70px 120px", padding:"13px 20px", borderBottom:`1px solid ${T.border}`, alignItems:"center" }}
            onMouseEnter={e => e.currentTarget.style.background=T.panel}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:`${T.green}18`, border:`1px solid ${T.green}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{c.country}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{c.name}</div>
                <div style={{ fontSize:11, color:T.text3 }}>ID #{c.id}</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:T.text2, fontFamily:T.mono }}>{c.phone}</div>
            <div><Pill c={tagColor[c.tag]||T.text2} sm>{c.tag}</Pill></div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}><Dot on={c.status==="active"} /><span style={{ fontSize:11, color: c.status==="active" ? T.green : T.text3 }}>{c.status==="active" ? "Actif" : "Inactif"}</span></div>
            <div style={{ fontSize:12, color:T.text2 }}>{c.msgs}</div>
            <div style={{ fontSize:12, color:T.text2 }}>{c.conv}</div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn variant="ghost" small>💬 Chat</Btn>
              <Btn variant="outline" small>···</Btn>
            </div>
          </div>
        ))}
      </Card>
    </Section>
  );
};

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────
const Campaigns = () => {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name:"", message:"", numbers:"" });
  const st = { running:T.green, scheduled:T.blue, completed:T.text3 };
  const sl = { running:"En cours", scheduled:"Planifiée", completed:"Terminée" };

  return (
    <Section title="Campagnes Broadcast" sub="Envoi de masse WhatsApp · Templates HSM"
      action={<Btn onClick={() => setCreating(true)}>+ Nouvelle campagne</Btn>}>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14 }}>
        <KPI icon="📣" label="Campagnes actives"  value="2"      sub="sur 4 totales"   />
        <KPI icon="📨" label="Messages envoyés"   value="4 980"  sub="Ce mois"         color={T.teal}   />
        <KPI icon="👆" label="Taux d'ouverture"   value="79.4%"  sub="+12% vs email"   color={T.blue}   />
        <KPI icon="🎯" label="Conversions"        value="757"    sub="31.4% conv rate" color={T.orange} />
      </div>

      {creating && (
        <Card style={{ padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:16 }}>➕ Nouvelle Campagne</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <label style={{ fontSize:11, color:T.text2, textTransform:"uppercase", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>Nom de la campagne</label>
              <Input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Promo Eid 2026" />
            </div>
            <div>
              <label style={{ fontSize:11, color:T.text2, textTransform:"uppercase", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>Numéros cibles (un par ligne)</label>
              <Input value={form.numbers} onChange={e => setForm(p=>({...p,numbers:e.target.value}))} placeholder="+212600000001&#10;+212600000002" multiline rows={3} />
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:11, color:T.text2, textTransform:"uppercase", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>Message template</label>
              <Input value={form.message} onChange={e => setForm(p=>({...p,message:e.target.value}))} placeholder="Bonjour {{prénom}} ! 🎉 Profitez de -30% jusqu'à dimanche ..." multiline rows={3} />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
            <Btn variant="outline" onClick={() => setCreating(false)}>Annuler</Btn>
            <Btn>🚀 Lancer la campagne</Btn>
          </div>
        </Card>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {MOCK_CAMPAIGNS.map(c => (
          <Card key={c.id} style={{ padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <Dot on={c.status==="running"} />
                  <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{c.name}</span>
                  <Pill c={st[c.status]} sm>{sl[c.status]}</Pill>
                </div>
                <div style={{ height:4, background:T.border, borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width: c.sent>0 ? `${(c.opened/c.sent*100).toFixed(0)}%` : "0%", background:c.color, borderRadius:2, transition:"width 0.5s" }} />
                </div>
              </div>
              {[["Envoyés",c.sent],["Ouverts",c.opened],["Convertis",c.conv],["Taux",c.sent>0 ? `${(c.opened/c.sent*100).toFixed(0)}%` : "—"]].map(([l,v]) => (
                <div key={l} style={{ textAlign:"center", minWidth:60 }}>
                  <div style={{ fontSize:17, fontWeight:700, color:c.color }}>{typeof v === "number" ? v.toLocaleString() : v}</div>
                  <div style={{ fontSize:11, color:T.text3 }}>{l}</div>
                </div>
              ))}
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="ghost" color={c.color} small>Détails</Btn>
                {c.status!=="completed" && <Btn variant="outline" small>{c.status==="running" ? "⏸ Pause" : "▶ Lancer"}</Btn>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
const Analytics = () => (
  <Section title="Analytics Avancées" sub="Performance IA · Conversions · ROI temps réel">
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14 }}>
      <KPI icon="🤖" label="Sessions IA"       value="12 847" sub="Ce mois" />
      <KPI icon="⚡" label="Temps réponse"     value="0.8s"   sub="Médiane"          color={T.teal}   />
      <KPI icon="😊" label="CSAT Score"        value="4.8/5"  sub="1 240 avis"        color={T.yellow} />
      <KPI icon="👤" label="Escalades humain"  value="3.2%"   sub="↓ -1.1 pt"        color={T.orange} />
      <KPI icon="💰" label="Revenu / contact"  value="15.9€"  sub="↑ +2.3€ ce mois"  color={T.purple} />
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
      <Card style={{ padding:24 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>Croissance contacts</div>
        <div style={{ fontSize:12, color:T.text2, marginBottom:20 }}>Nouveaux contacts / mois</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={T.teal} stopOpacity={0.3} />
                <stop offset="95%" stopColor={T.teal} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="m" tick={{ fill:T.text3, fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:T.text3, fontSize:11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }} />
            <Area type="monotone" dataKey="c" stroke={T.teal} strokeWidth={2} fill="url(#cg)" name="Contacts" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ padding:24 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:20 }}>ROI par canal marketing</div>
        {[
          { label:"WhatsApp Bot IA",   roi:"847%", pct:90, c:T.green  },
          { label:"Broadcast Campaign",roi:"312%", pct:65, c:T.teal   },
          { label:"Email Marketing",   roi:"124%", pct:35, c:T.blue   },
          { label:"SMS classique",     roi:"89%",  pct:22, c:T.text3  },
        ].map(r => (
          <div key={r.label} style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:12, color:T.text2 }}>{r.label}</span>
              <span style={{ fontSize:12, color:r.c, fontWeight:700 }}>{r.roi}</span>
            </div>
            <div style={{ height:6, background:T.border, borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:`${r.pct}%`, height:"100%", background:r.c, borderRadius:3 }} />
            </div>
          </div>
        ))}
      </Card>
    </div>

    <Card style={{ padding:24 }}>
      <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:20 }}>🔥 Heatmap · Meilleurs horaires d'envoi</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:5 }}>
        {["8h","10h","12h","14h","16h","18h","20h","22h"].map(h => (
          <div key={h} style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, color:T.text3, marginBottom:6 }}>{h}</div>
            {["L","M","M","J","V","S","D"].map((j,ji) => {
              const seed = (h.charCodeAt(0) + ji * 31) % 100;
              const intensity = (seed % 80 + 20) / 100;
              return <div key={j+ji} title={`${j} ${h}`} style={{ height:20, marginBottom:3, borderRadius:3, background:`rgba(0,232,122,${intensity*0.85})`, border:`1px solid rgba(0,232,122,${intensity*0.2})` }} />;
            })}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:12 }}>
        <span style={{ fontSize:11, color:T.text3 }}>Faible activité</span>
        <div style={{ flex:1, height:5, borderRadius:3, background:`linear-gradient(90deg,transparent,rgba(0,232,122,0.9))` }} />
        <span style={{ fontSize:11, color:T.green }}>Forte activité</span>
      </div>
    </Card>
  </Section>
);

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const SettingsPage = ({ user }) => {
  const [currentPlan, setCurrentPlan] = useState("growth");

  return (
    <Section title="Paramètres & Facturation" sub="Compte · Intégrations API · Abonnement">
      {/* Account */}
      <Card style={{ padding:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:16 }}>👤 Mon compte</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div>
            <label style={{ fontSize:11, color:T.text2, textTransform:"uppercase", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>Email</label>
            <Input value={user?.email || "yass@nexabot.com"} onChange={() => {}} />
          </div>
          <div>
            <label style={{ fontSize:11, color:T.text2, textTransform:"uppercase", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>Entreprise</label>
            <Input value={user?.company || "Mon Entreprise"} onChange={() => {}} />
          </div>
          <div>
            <label style={{ fontSize:11, color:T.text2, textTransform:"uppercase", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>Webhook URL (WhatsApp)</label>
            <Input value="https://nexabot-api.railway.app/webhook/whatsapp" onChange={() => {}} style={{ fontFamily:T.mono, fontSize:11 }} />
          </div>
          <div>
            <label style={{ fontSize:11, color:T.text2, textTransform:"uppercase", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>Verify Token</label>
            <Input value="nexabot_verify_2026" onChange={() => {}} style={{ fontFamily:T.mono, fontSize:11 }} />
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
          <Btn>💾 Sauvegarder</Btn>
        </div>
      </Card>

      {/* Plans */}
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14 }}>💎 Plans tarifaires</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:14 }}>
          {PLANS.map(p => (
            <Card key={p.key} style={{ padding:24, border:`2px solid ${currentPlan===p.key ? p.color : T.border}`, position:"relative" }}>
              {p.badge && <div style={{ position:"absolute", top:-1, right:18, background:p.color, color:"#000", fontSize:9, fontWeight:800, padding:"3px 9px", borderRadius:"0 0 8px 8px", letterSpacing:"0.12em" }}>{p.badge}</div>}
              <div style={{ fontSize:13, fontWeight:700, color:p.color, marginBottom:8 }}>{p.name}</div>
              <div style={{ fontSize:30, fontWeight:800, color:T.text, letterSpacing:"-0.03em", marginBottom:4 }}>{p.price}<span style={{ fontSize:13, color:T.text2, fontWeight:400 }}>/mois</span></div>
              <div style={{ fontSize:11, color:T.text3, marginBottom:18 }}>Par workspace</div>
              {[`${p.contacts} contacts`,`${p.bots} chatbot(s)`,`${p.campaigns} campagnes/mois`,`${p.users} utilisateur(s)`].map(f => (
                <div key={f} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, color:T.text2, marginBottom:8 }}>
                  <span style={{ color:p.color }}>✓</span>{f}
                </div>
              ))}
              <Btn variant={currentPlan===p.key ? "ghost" : "primary"} color={p.color} style={{ width:"100%", marginTop:16 }} onClick={() => setCurrentPlan(p.key)}>
                {currentPlan===p.key ? "✓ Plan actuel" : "Choisir ce plan"}
              </Btn>
            </Card>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14 }}>🔌 Intégrations API</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10 }}>
          {INTEGRATIONS.map(a => (
            <Card key={a.name} style={{ padding:16, border:`1px solid ${a.status==="connected" ? a.color+"25" : T.border}`, display:"flex", gap:12, alignItems:"center" }}>
              <span style={{ fontSize:22 }}>{a.logo}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name}</div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <Dot on={a.status==="connected"} />
                  <span style={{ fontSize:11, color: a.status==="connected" ? T.green : T.text3 }}>
                    {a.status==="connected" ? "Connecté" : "Déconnecté"}
                  </span>
                </div>
              </div>
              <Btn variant={a.status==="connected" ? "outline" : "ghost"} color={a.status==="connected" ? T.text2 : T.green} small>
                {a.status==="connected" ? "Config" : "Lier"}
              </Btn>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
};

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",  icon:"⬡", label:"Dashboard"     },
  { id:"chatbot",    icon:"◈", label:"Chatbot Builder"},
  { id:"crm",        icon:"◉", label:"CRM"            },
  { id:"campaigns",  icon:"◆", label:"Campagnes"      },
  { id:"analytics",  icon:"◎", label:"Analytics"      },
  { id:"settings",   icon:"◐", label:"Paramètres"     },
];

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]     = useState(null);
  const [user,  setUser]      = useState(null);
  const [page,  setPage]      = useState("dashboard");
  const [mini,  setMini]      = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const handleLogin = (t, u) => { setToken(t); setUser(u); };
  const handleLogout = () => { setToken(null); setUser(null); setPage("dashboard"); };

  if (!token) return <AuthScreen onLogin={handleLogin} />;

  const pages = { dashboard:<Dashboard />, chatbot:<ChatbotBuilder token={token} />, crm:<CRM />, campaigns:<Campaigns />, analytics:<Analytics />, settings:<SettingsPage user={user} /> };

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:T.font, overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width: mini ? 60 : 216, background:T.panel, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", transition:"width 0.2s ease", flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding: mini ? "18px 12px" : "18px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, justifyContent: mini ? "center" : "space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${T.green},${T.teal})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>◈</div>
            {!mini && (
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:T.text, lineHeight:1.1 }}>NexaBot</div>
                <div style={{ fontSize:9, color:T.green, letterSpacing:"0.15em" }}>WA AI SUITE</div>
              </div>
            )}
          </div>
          {!mini && <button onClick={() => setMini(true)} style={{ background:"none", border:"none", color:T.text3, cursor:"pointer", fontSize:16, padding:4 }}>‹</button>}
        </div>
        {mini && <button onClick={() => setMini(false)} style={{ background:"none", border:"none", color:T.text3, cursor:"pointer", fontSize:16, padding:"8px 0", alignSelf:"center" }}>›</button>}

        {/* Nav items */}
        <nav style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:3 }}>
          {NAV.map(n => {
            const active = page === n.id;
            return (
              <button key={n.id} onClick={() => setPage(n.id)} title={mini ? n.label : ""}
                style={{ display:"flex", alignItems:"center", gap:10, padding: mini ? "10px 0" : "10px 10px", borderRadius:9, cursor:"pointer", width:"100%", textAlign:"left", border:`1px solid ${active ? T.green+"30" : "transparent"}`, background: active ? `${T.green}14` : "transparent", color: active ? T.green : T.text2, justifyContent: mini ? "center" : "flex-start" }}>
                <span style={{ fontSize:17, flexShrink:0 }}>{n.icon}</span>
                {!mini && <span style={{ fontSize:13, fontWeight: active ? 700 : 400 }}>{n.label}</span>}
                {!mini && active && <div style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%", background:T.green }} />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        {!mini && (
          <div style={{ padding:"14px 16px", borderTop:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:`${T.green}25`, border:`1px solid ${T.green}45`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
                {(user?.email || "Y")[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email?.split("@")[0] || "Yass"}</div>
                <div style={{ fontSize:10, color:T.green }}>Plan Growth</div>
              </div>
              <button onClick={handleLogout} title="Déconnexion" style={{ background:"none", border:"none", color:T.text3, cursor:"pointer", fontSize:14 }}>⇥</button>
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ height:54, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 26px", gap:16, background:T.panel, flexShrink:0 }}>
          <div style={{ flex:1, fontSize:13, color:T.text2 }}>
            Bonjour <span style={{ color:T.text, fontWeight:700 }}>{user?.email?.split("@")[0] || "Yass"} 👋</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ padding:"4px 12px", borderRadius:20, background:`${T.green}14`, border:`1px solid ${T.green}28`, fontSize:11, color:T.green, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
              <Dot on /><span>1 247 contacts actifs</span>
            </div>
            <div style={{ width:30, height:30, borderRadius:"50%", background:T.card, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>🔔</div>
          </div>
        </div>

        {/* Page */}
        <div style={{ flex:1, overflowY:"auto", padding:26 }}>
          {pages[page] || pages.dashboard}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${T.border2}; border-radius:3px; }
        input, select, textarea, button { outline:none; font-family:inherit; }
      `}</style>
    </div>
  );
}
