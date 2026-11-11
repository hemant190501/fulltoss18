(()=>{
const cfg=window.FULLTOSS_CONFIG||{},$=s=>document.querySelector(s);
let data=null,filter="all",category="all",query="";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sports=[
  ["all","ALL SPORTS"],["cricket","🏏 CRICKET"],["football","⚽ FOOTBALL"],
  ["basketball","🏀 BASKETBALL"],["hockey","🏒 HOCKEY"],["tennis","🎾 TENNIS"],
  ["motorsport","🏎️ MOTORSPORT"],["american-football","🏈 AMERICAN FOOTBALL"],["other","OTHER"]
];
const norm=v=>String(v||"").toLowerCase().trim().replace(/[_ ]/g,"-");
const categoryMatches=(item,wanted)=>{
  if(wanted==="all")return true;
  const c=norm(item.category);
  if(wanted==="football")return ["football","soccer"].includes(c);
  if(wanted==="cricket")return ["cricket"].includes(c);
  return c===wanted;
};
const allItems=()=>{
  const d=data?.data||{};
  return [...(d.live||[]),...(d.upcoming||[]),...(d.finished||[]),...(d.channels||[])];
};
// Ignore old events still marked LIVE by a stale provider feed.
const liveItems=()=>{
  const cutoff=Date.now()-36*60*60*1000;
  return (data?.data?.live||[]).filter(x=>{
    if(x.status!=="live")return false;
    const t=Date.parse(x.startTime||"");
    return !Number.isFinite(t)||t>=cutoff;
  });
};
function visible(){
  let a=filter==="channels"?(data?.data?.channels||[]):
    filter==="live"?liveItems():
    filter==="all"?allItems().filter(x=>x.status!=="channel"&&!(x.status==="live"&&!liveItems().some(y=>y.id===x.id))):
    (data?.data?.[filter]||[]);
  if(category!=="all")a=a.filter(x=>categoryMatches(x,category));
  if(query)a=a.filter(x=>[x.name,x.league,x.category].some(v=>String(v||"").toLowerCase().includes(query)));
  return a;
}
function draw(){
  $("#categories").innerHTML=sports.map(([c,label])=>'<button class="cat '+(category===c?"selected":"")+'" data-cat="'+esc(c)+'">'+esc(label)+"</button>").join("");
  $("#categories").querySelectorAll("button").forEach(b=>b.onclick=()=>{category=b.dataset.cat;draw()});
  let a=visible();
  $("#cards").innerHTML=a.map(x=>'<article class="card" data-id="'+esc(x.id)+'"><div class="cardtop"><small>'+esc(x.league||x.category||"SPORTS")+'</small><b class="'+(x.status==="live"?"red":"")+'">'+(x.status==="live"?"● LIVE":x.status==="channel"?"CHANNEL":esc((x.status||"event").toUpperCase()))+'</b></div><div class="cardmain">'+(x.poster||x.thumbnail?'<img src="'+esc(x.poster||x.thumbnail)+'">':'<i></i>')+'<div><h3>'+esc(x.name)+'</h3><small>'+(x.status==="channel"?"Sports channel":x.startTime?new Date(x.startTime).toLocaleString():"Schedule TBA")+'</small></div></div><div class="cardbottom"><span>'+(x.streams||[]).length+' STREAMS</span><b>WATCH NOW ↗</b></div></article>').join("");
  $("#empty").hidden=!!a.length;
  $("#empty").textContent=filter==="live"?"No current live matches in the feed.":"No matches found for this sport.";
  $("#cards").querySelectorAll(".card").forEach(c=>c.onclick=()=>select(a.find(x=>x.id===c.dataset.id)));
}
function stop(){let f=$("#streamFrame");f.src="about:blank";f.style.display="none";$("#placeholder").style.display="grid";$("#playerStatus").textContent="SELECT A MATCH"}
function play(s){if(!s?.url){toast("No stream URL is available.");return}let f=$("#streamFrame");$("#placeholder").style.display="none";f.style.display="block";$("#playerStatus").textContent="LOADING EMBED";f.src=s.url}
function select(x){$("#playing").textContent=x.name||"Selected event";let ss=(x.streams||[]).filter(s=>s.url);$("#streams").innerHTML=ss.map((s,i)=>'<button data-i="'+i+'" class="'+(!i?"selected":"")+'">'+esc(s.name||"Stream "+(i+1))+" · "+esc(s.quality||"AUTO")+"</button>").join("");$("#watch").scrollIntoView({behavior:"smooth"});if(!ss.length){stop();toast("No stream URL is available.");return}$("#streams").querySelectorAll("button").forEach(b=>b.onclick=()=>{play(ss[+b.dataset.i]);$("#streams").querySelectorAll("button").forEach(z=>z.classList.toggle("selected",z===b))});play(ss[0])}
function toast(t){let e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),3000)}
async function load(){
  if(!cfg.feedUrl){$("#notice").textContent="Feed not connected. Set the events API URL in config.js.";return}
  $("#notice").textContent="Refreshing feed…";
  try{
    let r=await fetch(cfg.feedUrl,{cache:"no-store"});
    if(!r.ok)throw Error("HTTP "+r.status);
    let d=await r.json();if(!d.data)throw Error("Invalid feed JSON structure");
    data=d;
    $("#lc").textContent=liveItems().length;
    $("#uc").textContent=(d.data.upcoming||[]).length;
    $("#cc").textContent=(d.data.channels||[]).length;
    $("#updated").textContent="UPDATED "+(d.updatedAt?new Date(d.updatedAt).toLocaleString():"NOW");
    draw();
    const stamp=Date.parse(d.updatedAt||"");
    const stale=Number.isFinite(stamp)&&Date.now()-stamp>12*60*60*1000;
    $("#notice").textContent="Feed connected · "+allItems().length+" items"+(stale?" · Provider data is older than 12 hours; waiting for its next sync.":"");
  }catch(e){$("#notice").textContent="Feed error: "+e.message+" — check API URL and CORS."}
}
$("#tabs").querySelectorAll("button").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$("#tabs").querySelectorAll("button").forEach(z=>z.classList.toggle("selected",z===b));draw()});
$("#search").oninput=e=>{query=e.target.value.toLowerCase().trim();draw()};
$("#streamFrame").addEventListener("load",()=>{$("#playerStatus").textContent="EMBED OPENED"});
load();if(cfg.feedUrl)setInterval(load,Math.max(15000,Number(cfg.refreshMs)||60000));
})();