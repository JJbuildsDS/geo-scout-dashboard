import { useState, useEffect, useCallback, useMemo } from "react";
const STAGES = ["new","contacted","replied","meeting","closed_won","closed_lost"];
const STAGE_LABELS = {new:"New",contacted:"Contacted",replied:"Replied",meeting:"Meeting",closed_won:"Won",closed_lost:"Lost"};
const STAGE_COLORS = {new:"#00d4ff",contacted:"#ffaa00",replied:"#00ff88",meeting:"#c9a84c",closed_won:"#28c840",closed_lost:"#ff4444"};
const genId = () => Math.random().toString(36).substr(2, 9);
const now = () => new Date().toISOString();
const storage = {
  get(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error(e); } },
  remove(key) { localStorage.removeItem(key); }
};
const DEMO = [
  {id:genId(),name:"Sarah Chen",title:"VP of Digital Marketing",company:"Meridian Hotels",website:"meridianhotels.com",linkedin:"",email:"s.chen@meridianhotels.com",source:"sales_nav",stage:"new",score:88,region:"GCC",industry:"Hospitality",notes:"Posted about AI search concerns",tags:["hot"],isYC:false,createdAt:now(),updatedAt:now(),outreach:[]},
  {id:genId(),name:"Amira Al-Rashid",title:"Director of Marketing",company:"Damac Properties",website:"damacproperties.com",linkedin:"",email:"",source:"sales_nav",stage:"replied",score:95,region:"GCC",industry:"Real Estate",notes:"Very interested. Asked for audit.",tags:["hot","gcc"],isYC:false,createdAt:now(),updatedAt:now(),outreach:[]},
  {id:genId(),name:"Tom Whitfield",title:"Marketing Manager",company:"CloudBase",website:"cloudbase.dev",linkedin:"",email:"tom@cloudbase.dev",source:"sales_nav",stage:"meeting",score:65,region:"UK",industry:"SaaS",notes:"Meeting Thursday.",tags:["saas"],isYC:false,createdAt:now(),updatedAt:now(),outreach:[]},
  {id:genId(),name:"Ravi Menon",title:"Director of Digital",company:"Aldar Properties",website:"aldar.com",linkedin:"",email:"",source:"sales_nav",stage:"new",score:91,region:"GCC",industry:"Real Estate",notes:"Major Abu Dhabi developer.",tags:["hot","gcc"],isYC:false,createdAt:now(),updatedAt:now(),outreach:[]},
];

function App() {
  const [leads, setLeads] = useState([]);
  const [view, setView] = useState("pipeline");
  const [sel, setSel] = useState(null);
  const [search, setSearch] = useState("");
  const [fStage, setFStage] = useState("all");
  const [fSource, setFSource] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [dragged, setDragged] = useState(null);
  const [toast, setToast] = useState(null);
  useEffect(() => { const s = storage.get("geoscout:leads"); setLeads(s && s.length > 0 ? s : DEMO); }, []);
  useEffect(() => { if (leads.length > 0) storage.set("geoscout:leads", leads); }, [leads]);
  const showT = (m,t="ok") => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };
  const updLead = useCallback((id, u) => { setLeads(p => p.map(l => l.id===id ? {...l,...u,updatedAt:now()} : l)); if(sel?.id===id) setSel(p=>p?{...p,...u}:null); },[sel]);
  const addLead = useCallback((l) => { setLeads(p => [{...l,id:genId(),createdAt:now(),updatedAt:now(),outreach:[],stage:"new"},...p]); setShowAdd(false); showT("Added "+l.name); },[]);
  const delLead = useCallback((id) => { const n=leads.find(l=>l.id===id)?.name; setLeads(p=>p.filter(l=>l.id!==id)); if(sel?.id===id) setSel(null); showT("Removed "+n,"w"); },[sel,leads]);
  const filtered = useMemo(() => leads.filter(l => {
    if(fStage!=="all" && l.stage!==fStage) return false;
    if(fSource!=="all" && l.source!==fSource) return false;
    if(search){const q=search.toLowerCase();return l.name.toLowerCase().includes(q)||l.company.toLowerCase().includes(q)||(l.email||"").toLowerCase().includes(q);}
    return true;
  }),[leads,fStage,fSource,search]);
  const stats = useMemo(() => {
    const t=leads.length,byS={};STAGES.forEach(s=>byS[s]=leads.filter(l=>l.stage===s).length);
    const avg=t>0?Math.round(leads.reduce((a,l)=>a+(l.score||0),0)/t):0;
    const hot=leads.filter(l=>l.score>=80).length,ctd=leads.filter(l=>l.stage!=="new").length;
    const rr=ctd>0?Math.round((byS.replied+byS.meeting+byS.closed_won)/ctd*100):0;
    const yc=leads.filter(l=>l.isYC).length;
    return {t,byS,avg,hot,ctd,rr,yc};
  },[leads]);
  const onDrop = (stage) => { if(dragged){updLead(dragged.id,{stage});setDragged(null);showT("Moved to "+STAGE_LABELS[stage]);} };
  const exportCSV = () => {
    const h=["Name","Title","Company","Website","Email","Score","Stage","Region","Industry","Source","Notes"];
    const r=leads.map(l=>[l.name,l.title,l.company,l.website,l.email||"",l.score,STAGE_LABELS[l.stage],l.region,l.industry,l.source,'"'+(l.notes||"").replace(/"/g,'""')+'"']);
    const csv=[h.join(","),...r.map(r=>r.join(","))].join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="geo-scout-"+new Date().toISOString().slice(0,10)+".csv";a.click();
  };
  const S={fontFamily:"'JetBrains Mono',monospace",background:"#0a0a0f",color:"#e0e0e8",minHeight:"100vh"};
  const btn=(active,c)=>({padding:"6px 16px",fontSize:11,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",cursor:"pointer",border:"1px solid",borderRadius:0,background:active?c:"transparent",color:active?"#0a0a0f":"#8888aa",borderColor:active?c:"#2a2a3a",fontWeight:active?700:400});

  return (
    <div style={S}>
      {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:9999,padding:"10px 20px",background:toast.t==="w"?"#ffaa00":"#00ff88",color:"#0a0a0f",fontSize:12,fontFamily:"inherit",fontWeight:600}}>{toast.m}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid #1a1a28",background:"#0d0d14"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{color:"#00ff88",fontWeight:700,fontSize:16,letterSpacing:2}}>GEO SCOUT</span>
          <span style={{fontSize:10,color:"#555577"}}>{leads.length} leads</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          {["pipeline","leads","analytics"].map(v=><button key={v} onClick={()=>{setView(v);setSel(null);}} style={btn(view===v,"#00ff88")}>{v}</button>)}
        </div>
      </div>
      <div style={{display:"flex",gap:0,background:"#0d0d14",borderBottom:"1px solid #1a1a28"}}>
        {[{l:"Total",v:stats.t,c:"#e0e0e8"},{l:"Hot",v:stats.hot,c:"#ff4444"},{l:"Contacted",v:stats.ctd,c:"#ffaa00"},{l:"Response",v:stats.rr+"%",c:"#00ff88"},{l:"Avg Score",v:stats.avg,c:"#c9a84c"},{l:"YC",v:stats.yc,c:"#00d4ff"}].map((s,i)=>(
          <div key={i} style={{flex:1,padding:"10px 12px",textAlign:"center",borderRight:"1px solid #1a1a28"}}>
            <div style={{fontSize:9,color:"#555577",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{s.l}</div>
            <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderBottom:"1px solid #1a1a28",flexWrap:"wrap"}}>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:150,padding:"8px 12px",background:"#111119",border:"1px solid #2a2a3a",color:"#e0e0e8",fontFamily:"inherit",fontSize:12,outline:"none"}}/>
        <select value={fStage} onChange={e=>setFStage(e.target.value)} style={{padding:"8px",background:"#111119",border:"1px solid #2a2a3a",color:"#e0e0e8",fontFamily:"inherit",fontSize:11,outline:"none"}}><option value="all">All Stages</option>{STAGES.map(s=><option key={s} value={s}>{STAGE_LABELS[s]}</option>)}</select>
        <button onClick={()=>setShowAdd(true)} style={{padding:"8px 16px",background:"#00ff88",color:"#0a0a0f",border:"none",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ ADD</button>
        <button onClick={exportCSV} style={{padding:"8px 16px",background:"transparent",color:"#8888aa",border:"1px solid #2a2a3a",fontFamily:"inherit",fontSize:11,cursor:"pointer"}}>CSV</button>
        <button onClick={()=>{if(confirm("Reset?")){storage.remove("geoscout:leads");setLeads(DEMO);setSel(null);}}} style={{padding:"8px 16px",background:"transparent",color:"#ff444488",border:"1px solid #ff444422",fontFamily:"inherit",fontSize:11,cursor:"pointer"}}>RESET</button>
      </div>
      <div style={{display:"flex",height:"calc(100vh - 160px)"}}>
        <div style={{flex:1,overflow:"auto",padding:16}}>
          {view==="pipeline"&&<PipelineView leads={filtered} onDragStart={setDragged} onDrop={onDrop} onSelect={setSel}/>}
          {view==="leads"&&<LeadsTable leads={filtered} onSelect={setSel} onDelete={delLead}/>}
          {view==="analytics"&&<AnalyticsView leads={leads} stats={stats}/>}
        </div>
        {sel&&<LeadDetail lead={leads.find(l=>l.id===sel.id)||sel} onUpdate={updLead} onClose={()=>setSel(null)} onDelete={delLead} showT={showT}/>}
      </div>
      {showAdd&&<AddModal onAdd={addLead} onClose={()=>setShowAdd(false)}/>}
    </div>
  );
}

function PipelineView({leads,onDragStart,onDrop,onSelect}){
  return(<div style={{display:"flex",gap:8,height:"100%",overflow:"auto"}}>
    {STAGES.map(stage=>{const sl=leads.filter(l=>l.stage===stage);return(
      <div key={stage} style={{minWidth:170,flex:1,display:"flex",flexDirection:"column"}} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(stage)}>
        <div style={{padding:"8px 10px",borderBottom:"2px solid "+STAGE_COLORS[stage],marginBottom:8,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:10,fontWeight:600,color:STAGE_COLORS[stage],letterSpacing:1,textTransform:"uppercase"}}>{STAGE_LABELS[stage]}</span>
          <span style={{fontSize:10,color:"#555577",background:"#1a1a24",padding:"2px 8px"}}>{sl.length}</span>
        </div>
        <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:6}}>
          {sl.sort((a,b)=>b.score-a.score).map(l=>(
            <div key={l.id} draggable onDragStart={()=>onDragStart(l)} onClick={()=>onSelect(l)} style={{padding:10,background:"#111119",border:"1px solid #1a1a28",cursor:"pointer",borderLeft:"3px solid "+(l.score>=80?"#ff4444":l.score>=60?"#ffaa00":"#2a2a3a")}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:600}}>{l.name}</span>
                <span style={{fontSize:10,fontWeight:700,color:l.score>=80?"#ff4444":"#ffaa00",background:l.score>=80?"#ff444418":"#ffaa0018",padding:"1px 6px"}}>{l.score}</span>
              </div>
              <div style={{fontSize:10,color:"#8888aa"}}>{l.title}</div>
              <div style={{fontSize:10,color:"#555577"}}>{l.company}</div>
              <div style={{display:"flex",gap:3,marginTop:6}}>{l.isYC&&<span style={{fontSize:8,padding:"1px 5px",background:"#00d4ff22",color:"#00d4ff"}}>YC</span>}<span style={{fontSize:8,padding:"1px 5px",background:"#1a1a24",color:"#555577"}}>{l.region}</span></div>
            </div>))}
          {sl.length===0&&<div style={{padding:20,textAlign:"center",fontSize:10,color:"#2a2a3a"}}>Drop here</div>}
        </div>
      </div>);
    })}
  </div>);
}

function LeadsTable({leads,onSelect,onDelete}){
  return(<div style={{overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
    <thead><tr style={{borderBottom:"2px solid #1a1a28"}}>
      {["Score","Name","Title","Company","Region","Stage",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:"#555577",fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>{h}</th>)}
    </tr></thead>
    <tbody>{leads.map(l=>(
      <tr key={l.id} onClick={()=>onSelect(l)} style={{borderBottom:"1px solid #1a1a28",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#0d0d14"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <td style={{padding:"10px 12px"}}><span style={{fontWeight:700,color:l.score>=80?"#ff4444":l.score>=60?"#ffaa00":"#8888aa"}}>{l.score}</span></td>
        <td style={{padding:"10px 12px",fontWeight:600}}>{l.name}{l.isYC&&<span style={{fontSize:8,padding:"1px 5px",background:"#00d4ff22",color:"#00d4ff",marginLeft:4}}>YC</span>}</td>
        <td style={{padding:"10px 12px",color:"#8888aa"}}>{l.title}</td>
        <td style={{padding:"10px 12px",color:"#8888aa"}}>{l.company}</td>
        <td style={{padding:"10px 12px",color:"#555577"}}>{l.region}</td>
        <td style={{padding:"10px 12px"}}><span style={{fontSize:10,padding:"2px 8px",background:STAGE_COLORS[l.stage]+"15",color:STAGE_COLORS[l.stage]}}>{STAGE_LABELS[l.stage]}</span></td>
        <td style={{padding:"10px 12px"}}><button onClick={e=>{e.stopPropagation();onDelete(l.id);}} style={{background:"none",border:"none",color:"#ff444466",cursor:"pointer",fontSize:13}}>x</button></td>
      </tr>))}</tbody>
  </table></div>);
}

function AnalyticsView({leads,stats}){
  const byR={},byI={};leads.forEach(l=>{byR[l.region]=(byR[l.region]||0)+1;byI[l.industry]=(byI[l.industry]||0)+1;});
  const sb=[0,0,0,0,0];leads.forEach(l=>{const i=l.score>=80?4:l.score>=60?3:l.score>=40?2:l.score>=20?1:0;sb[i]++;});const mx=Math.max(...sb,1);
  const Card=({title,children,span})=>(<div style={{background:"#111119",border:"1px solid #1a1a28",padding:20,gridColumn:span?"span "+span:"auto"}}><div style={{fontSize:10,color:"#ffaa00",letterSpacing:2,textTransform:"uppercase",marginBottom:16,paddingBottom:8,borderBottom:"1px solid #1a1a28"}}>{title}</div>{children}</div>);
  const Bar=({label,value,max,color})=>(<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontSize:10,color:"#8888aa",width:70,textAlign:"right",flexShrink:0}}>{label}</span><div style={{flex:1,height:14,background:"#1a1a24"}}><div style={{height:"100%",width:Math.max((value/max)*100,2)+"%",background:color||"#00ff88"}}/></div><span style={{fontSize:11,fontWeight:600,width:24,textAlign:"right",flexShrink:0}}>{value}</span></div>);
  return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    <Card title="Key Metrics" span={2}><div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
      {[{l:"Pipeline",v:stats.t,c:"#e0e0e8"},{l:"Hot",v:stats.hot,c:"#ff4444"},{l:"Contacted",v:stats.ctd,c:"#ffaa00"},{l:"Replied",v:stats.byS.replied,c:"#00ff88"},{l:"Meetings",v:stats.byS.meeting,c:"#c9a84c"},{l:"Won",v:stats.byS.closed_won,c:"#28c840"}].map(m=>(<div key={m.l} style={{padding:12,background:"#0d0d14",border:"1px solid #1a1a28",textAlign:"center"}}><div style={{fontSize:8,color:"#555577",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{m.l}</div><div style={{fontSize:24,fontWeight:700,color:m.c}}>{m.v}</div></div>))}
    </div></Card>
    <Card title="Pipeline">{STAGES.map(s=><Bar key={s} label={STAGE_LABELS[s]} value={stats.byS[s]} max={Math.max(...Object.values(stats.byS),1)} color={STAGE_COLORS[s]}/>)}</Card>
    <Card title="Scores">{["0-19","20-39","40-59","60-79","80-100"].map((l,i)=><Bar key={l} label={l} value={sb[i]} max={mx} color={["#555577","#555577","#c9a84c","#ffaa00","#ff4444"][i]}/>)}</Card>
    <Card title="Region">{Object.entries(byR).sort((a,b)=>b[1]-a[1]).map(([r,v])=><Bar key={r} label={r} value={v} max={Math.max(...Object.values(byR),1)} color="#00d4ff"/>)}</Card>
    <Card title="Industry">{Object.entries(byI).sort((a,b)=>b[1]-a[1]).map(([r,v])=><Bar key={r} label={r} value={v} max={Math.max(...Object.values(byI),1)} color="#c9a84c"/>)}</Card>
  </div>);
}

function LeadDetail({lead,onUpdate,onClose,onDelete,showT}){
  const [note,setNote]=useState("");const [sc,setSc]=useState(lead.score);const [em,setEm]=useState(lead.email||"");
  useEffect(()=>{setSc(lead.score);setEm(lead.email||"");},[lead.id,lead.score,lead.email]);
  const addNote=()=>{if(!note.trim())return;const ts=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"});onUpdate(lead.id,{notes:(lead.notes||"")+"\n["+ts+"] "+note});setNote("");};
  const liMsg="Hi "+lead.name.split(" ")[0]+", noticed "+lead.company+" doing great work. Quick q - have you checked if your brand shows up when people ask ChatGPT or Perplexity for recommendations? I offer free audits if curious.";
  const emMsg="Subject: Quick question about "+lead.company+"\n\nHi "+lead.name.split(" ")[0]+",\n\nI help companies show up when people ask AI for recommendations.\n\nI checked your industry and noticed gaps - happy to share in a free audit.\n\nBest,\nJasraaj Puri\nwa.me/971569218855";
  const copy=(t)=>{navigator.clipboard.writeText(t).then(()=>showT("Copied"));};
  return(<div style={{width:360,borderLeft:"1px solid #1a1a28",background:"#0d0d14",overflow:"auto",display:"flex",flexDirection:"column",flexShrink:0}}>
    <div style={{padding:"14px 16px",borderBottom:"1px solid #1a1a28",display:"flex",justifyContent:"space-between",position:"sticky",top:0,background:"#0d0d14",zIndex:10}}>
      <span style={{fontSize:11,color:"#ffaa00",letterSpacing:2}}>LEAD DETAIL</span>
      <button onClick={onClose} style={{background:"none",border:"none",color:"#555577",cursor:"pointer",fontSize:18,fontFamily:"inherit"}}>x</button>
    </div>
    <div style={{padding:16,flex:1,overflow:"auto"}}>
      <div style={{marginBottom:16,paddingBottom:12,borderBottom:"1px solid #1a1a28"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><div><h3 style={{fontSize:16,fontWeight:700,margin:0}}>{lead.name}</h3><div style={{fontSize:12,color:"#8888aa",marginTop:4}}>{lead.title}</div><div style={{fontSize:12,color:"#555577"}}>{lead.company}</div></div>
        <span style={{fontSize:20,fontWeight:700,color:lead.score>=80?"#ff4444":"#ffaa00"}}>{lead.score}</span></div>
        <div style={{display:"flex",gap:4,marginTop:8}}><span style={{fontSize:9,padding:"2px 8px",background:STAGE_COLORS[lead.stage]+"22",color:STAGE_COLORS[lead.stage]}}>{STAGE_LABELS[lead.stage]}</span><span style={{fontSize:9,padding:"2px 8px",background:"#1a1a24",color:"#8888aa"}}>{lead.region}</span></div>
      </div>
      <div style={{marginBottom:16}}><div style={{fontSize:10,color:"#555577",letterSpacing:2,marginBottom:8}}>CONTACT</div>
        {lead.website&&<a href={"https://"+lead.website} target="_blank" rel="noopener" style={{fontSize:11,color:"#00d4ff",textDecoration:"none",display:"block",marginBottom:4}}>{"-> "+lead.website}</a>}
        <div style={{display:"flex",gap:6,marginTop:4}}><input value={em} onChange={e=>setEm(e.target.value)} placeholder="Email..." style={{flex:1,padding:"6px 8px",background:"#111119",border:"1px solid #2a2a3a",color:"#e0e0e8",fontFamily:"inherit",fontSize:11,outline:"none"}}/>
        {em!==(lead.email||"")&&<button onClick={()=>{onUpdate(lead.id,{email:em});showT("Saved");}} style={{padding:"6px 10px",background:"#00ff88",color:"#0a0a0f",border:"none",fontFamily:"inherit",fontSize:9,cursor:"pointer",fontWeight:700}}>Save</button>}</div>
      </div>
      <div style={{marginBottom:16}}><div style={{fontSize:10,color:"#555577",letterSpacing:2,marginBottom:8}}>STAGE</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{STAGES.map(s=><button key={s} onClick={()=>{onUpdate(lead.id,{stage:s});showT("-> "+STAGE_LABELS[s]);}} style={{padding:"5px 10px",fontSize:9,fontFamily:"inherit",cursor:"pointer",border:"1px solid",background:lead.stage===s?STAGE_COLORS[s]:"transparent",color:lead.stage===s?"#0a0a0f":STAGE_COLORS[s],borderColor:lead.stage===s?STAGE_COLORS[s]:STAGE_COLORS[s]+"44",fontWeight:lead.stage===s?700:400}}>{STAGE_LABELS[s]}</button>)}</div>
      </div>
      <div style={{marginBottom:16}}><div style={{fontSize:10,color:"#555577",letterSpacing:2,marginBottom:8}}>SCORE</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><input type="range" min="0" max="100" value={sc} onChange={e=>setSc(Number(e.target.value))} style={{flex:1,accentColor:"#00ff88"}}/><span style={{fontSize:14,fontWeight:700,color:sc>=80?"#ff4444":"#ffaa00",width:28,textAlign:"right"}}>{sc}</span>
        {sc!==lead.score&&<button onClick={()=>{onUpdate(lead.id,{score:sc});showT("Score set");}} style={{padding:"4px 10px",fontSize:9,background:"#00ff88",color:"#0a0a0f",border:"none",fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>Set</button>}</div>
      </div>
      <div style={{marginBottom:16}}><div style={{fontSize:10,color:"#555577",letterSpacing:2,marginBottom:8}}>NOTES</div>
        <div style={{fontSize:11,color:"#8888aa",lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:8,padding:10,background:"#111119",border:"1px solid #1a1a28",minHeight:50,maxHeight:120,overflow:"auto"}}>{lead.notes||"No notes."}</div>
        <div style={{display:"flex",gap:6}}><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Add note..." onKeyDown={e=>e.key==="Enter"&&addNote()} style={{flex:1,padding:"7px 10px",background:"#111119",border:"1px solid #2a2a3a",color:"#e0e0e8",fontFamily:"inherit",fontSize:11,outline:"none"}}/><button onClick={addNote} style={{padding:"7px 14px",background:"#00ff88",color:"#0a0a0f",border:"none",fontFamily:"inherit",fontSize:10,cursor:"pointer",fontWeight:700}}>Add</button></div>
      </div>
      <div style={{marginBottom:16}}><div style={{fontSize:10,color:"#555577",letterSpacing:2,marginBottom:8}}>OUTREACH</div>
        <div style={{background:"#111119",border:"1px solid #1a1a28",padding:10,marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:"#ffaa00"}}>LINKEDIN</span><button onClick={()=>copy(liMsg)} style={{fontSize:9,padding:"3px 10px",background:"#ffaa00",color:"#0a0a0f",border:"none",fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>COPY</button></div><div style={{fontSize:10,color:"#8888aa",lineHeight:1.5}}>{liMsg.substring(0,150)}...</div></div>
        <div style={{background:"#111119",border:"1px solid #1a1a28",padding:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:"#00d4ff"}}>EMAIL</span><button onClick={()=>copy(emMsg)} style={{fontSize:9,padding:"3px 10px",background:"#00d4ff",color:"#0a0a0f",border:"none",fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>COPY</button></div><div style={{fontSize:10,color:"#8888aa",lineHeight:1.5}}>{emMsg.substring(0,150)}...</div></div>
      </div>
      <button onClick={()=>{if(confirm("Delete "+lead.name+"?"))onDelete(lead.id);}} style={{width:"100%",padding:"10px",background:"transparent",border:"1px solid #ff444433",color:"#ff444488",fontFamily:"inherit",fontSize:11,cursor:"pointer"}}>Delete Lead</button>
    </div>
  </div>);
}

function AddModal({onAdd,onClose}){
  const [f,setF]=useState({name:"",title:"",company:"",website:"",linkedin:"",email:"",score:50,region:"GCC",industry:"",notes:"",source:"manual",tags:[],isYC:false});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));const ok=f.name&&f.company;
  const I=({k,l,ph,sp})=>(<div style={{gridColumn:sp===2?"span 2":"auto"}}><label style={{fontSize:9,color:"#555577",letterSpacing:1,display:"block",marginBottom:4,textTransform:"uppercase"}}>{l}</label><input value={f[k]} onChange={e=>s(k,e.target.value)} placeholder={ph} style={{width:"100%",padding:"8px 10px",background:"#0a0a0f",border:"1px solid #2a2a3a",color:"#e0e0e8",fontFamily:"inherit",fontSize:12,outline:"none",boxSizing:"border-box"}}/></div>);
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={onClose}>
    <div style={{background:"#111119",border:"1px solid #2a2a3a",padding:24,width:500,maxHeight:"85vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><span style={{fontSize:12,color:"#00ff88",letterSpacing:2,fontWeight:700}}>NEW LEAD</span><button onClick={onClose} style={{background:"none",border:"none",color:"#555577",cursor:"pointer",fontSize:16}}>x</button></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <I k="name" l="Name *" ph="Sarah Chen" sp={1}/><I k="title" l="Title" ph="VP Marketing" sp={1}/>
        <I k="company" l="Company *" ph="Acme" sp={1}/><I k="website" l="Website" ph="acme.com" sp={1}/>
        <I k="email" l="Email" ph="email" sp={2}/>
        <div><label style={{fontSize:9,color:"#555577",letterSpacing:1,display:"block",marginBottom:4,textTransform:"uppercase"}}>Region</label><select value={f.region} onChange={e=>s("region",e.target.value)} style={{width:"100%",padding:"8px",background:"#0a0a0f",border:"1px solid #2a2a3a",color:"#e0e0e8",fontFamily:"inherit",fontSize:12,outline:"none"}}>{["GCC","US","UK","Europe","India","Other"].map(r=><option key={r}>{r}</option>)}</select></div>
        <I k="industry" l="Industry" ph="SaaS" sp={1}/>
        <div style={{gridColumn:"span 2"}}><label style={{fontSize:9,color:"#555577",letterSpacing:1,display:"block",marginBottom:4}}>Score: {f.score}</label><input type="range" min="0" max="100" value={f.score} onChange={e=>s("score",Number(e.target.value))} style={{width:"100%",accentColor:"#00ff88"}}/></div>
        <div style={{gridColumn:"span 2"}}><label style={{fontSize:9,color:"#555577",letterSpacing:1,display:"block",marginBottom:4}}>Notes</label><textarea value={f.notes} onChange={e=>s("notes",e.target.value)} rows={2} style={{width:"100%",padding:"8px",background:"#0a0a0f",border:"1px solid #2a2a3a",color:"#e0e0e8",fontFamily:"inherit",fontSize:12,outline:"none",resize:"vertical",boxSizing:"border-box"}}/></div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <button onClick={()=>ok&&onAdd(f)} disabled={!ok} style={{flex:1,padding:"10px",background:ok?"#00ff88":"#2a2a3a",color:ok?"#0a0a0f":"#555577",border:"none",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:ok?"pointer":"not-allowed"}}>ADD LEAD</button>
        <button onClick={onClose} style={{flex:1,padding:"10px",background:"transparent",color:"#8888aa",border:"1px solid #2a2a3a",fontFamily:"inherit",fontSize:12,cursor:"pointer"}}>CANCEL</button>
      </div>
    </div>
  </div>);
}
export default App;
