import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "reports/final-photo-gaps.csv");
const output = path.join(root, "reports/final-photo-source-candidates-v2.json");
const limit = Number(process.argv.find((x) => x.startsWith("--limit="))?.split("=")[1] ?? 25);
const islandNames = { stt: "Saint Thomas", stj: "Saint John", stx: "Saint Croix" };
const stop = new Set("the and beach bay estate historic district plantation resort hotel villas saint st us virgin islands photo image".split(" "));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function csv(text) {
  const line = (s) => { const out=[]; let v="",q=false; for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(q&&s[i+1]==='"'){v+='"';i++;}else q=!q;}else if(c===","&&!q){out.push(v);v="";}else v+=c;}out.push(v);return out; };
  const lines=text.trim().split(/\r?\n/), head=line(lines.shift());
  return lines.map((s)=>Object.fromEntries(line(s).map((v,i)=>[head[i],v])));
}

function words(value="") {
  return new Set(value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").split(/\s+/).filter((x)=>x.length>2&&!stop.has(x)));
}
function overlap(a,b){const x=words(a),y=words(b);if(!x.size||!y.size)return 0;return [...x].filter((v)=>y.has(v)).length/x.size;}
function clean(value=""){return value.replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ");}
function queries(row){
  const island=islandNames[row.island], base=row.name.replace(/\bHistoric District\b/i,"").replace(/\bUS Virgin Islands\b/i,"").trim();
  const aliases=new Set([`${row.name} ${island} USVI`,`${base} ${island} Virgin Islands`,`${base} ${row.kind} ${island}`]);
  if(row.kind==="historic") aliases.add(`${base} NRHP Virgin Islands`);
  if(row.kind==="beach") aliases.add(`${base} shore ${island}`);
  return [...aliases];
}

async function json(url, headers={}) { for(let n=0;n<3;n++){const r=await fetch(url,{headers});if(r.ok)return r.json();if(r.status!==429&&r.status<500)break;await wait(900*(n+1));}return null; }

async function commons(query,row){
  const p=new URLSearchParams({action:"query",generator:"search",gsrsearch:query,gsrnamespace:"6",gsrlimit:"20",prop:"imageinfo",iiprop:"url|extmetadata",format:"json",origin:"*"});
  const data=await json(`https://commons.wikimedia.org/w/api.php?${p}`,{"User-Agent":"VI-Guide-photo-sourcing/2.0"});
  return Object.values(data?.query?.pages??{}).map((page)=>{const i=page.imageinfo?.[0]??{},m=i.extmetadata??{},context=clean(`${page.title} ${m.ImageDescription?.value??""} ${m.Categories?.value??""}`),license=m.LicenseShortName?.value??"";return {provider:"wikimedia",title:page.title,url:i.url,sourceUrl:i.descriptionurl,thumbnailUrl:i.thumburl,license,creator:clean(m.Artist?.value??""),context,score:overlap(row.name,context)};}).filter((x)=>x.url&&/CC|public domain|PD/i.test(x.license));
}

async function openverse(query,row){
  const p=new URLSearchParams({q:query,page_size:"20",license_type:"commercial,modification"});
  const data=await json(`https://api.openverse.org/v1/images/?${p}`,{"User-Agent":"VI-Guide-photo-sourcing/2.0"});
  return (data?.results??[]).map((x)=>{const context=`${x.title??""} ${x.tags?.map((t)=>t.name).join(" ")??""}`;return {provider:"openverse",title:x.title,url:x.url,sourceUrl:x.foreign_landing_url,thumbnailUrl:x.thumbnail,license:`${x.license??""} ${x.license_version??""}`.trim(),creator:x.creator??"",context,score:overlap(row.name,context)};});
}

function rank(items,row){
  const island=words(islandNames[row.island]);
  return [...new Map(items.filter((x)=>x.url&&/\.(?:jpe?g|png|webp)(?:$|\?)/i.test(x.url)).map((x)=>[x.url,x])).values()].map((x)=>{const ctx=words(x.context), islandWords=[...island].filter((w)=>ctx.has(w)).length, territory=/\b(?:usvi|virgin islands)\b/i.test(x.context), islandHit=islandWords>=2||(territory&&islandWords>=1), exact=x.score>=0.75;return {...x,islandConfirmed:islandHit,decision:exact&&islandHit?"review-high":"review",score:Number((x.score+(islandHit?.2:0)).toFixed(2))};}).filter((x)=>x.islandConfirmed&&x.score>=0.54).sort((a,b)=>b.score-a.score).slice(0,12);
}

if(!fs.existsSync(input)){console.error("Missing reports/final-photo-gaps.csv");process.exit(1);}
const prior=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,"utf8")):{rows:[]};
const done=new Set(prior.rows.map((x)=>`${x.kind}:${x.id}`));
const rows=csv(fs.readFileSync(input,"utf8")).filter((x)=>!done.has(`${x.kind}:${x.id}`)).slice(0,limit), sourced=[];
for(const [index,row] of rows.entries()){
  let found=[]; const searched=queries(row);
  for(const q of searched){const [a,b]=await Promise.all([commons(q,row),openverse(q,row)]);found.push(...a,...b);await wait(350);}
  const candidates=rank(found,row);sourced.push({...row,queries:searched,candidates});
  console.log(`[${index+1}/${rows.length}] ${row.kind}: ${row.name} — ${candidates.length} reviewable`);
}
const report={generatedAt:new Date().toISOString(),policy:{automaticApplication:false,minimumScore:0.34,requiresHumanReview:true},rows:[...prior.rows,...sourced]};
fs.writeFileSync(output,`${JSON.stringify(report,null,2)}\n`);
console.table({processed:sourced.length,withCandidates:sourced.filter((x)=>x.candidates.length).length,highConfidence:sourced.reduce((n,x)=>n+x.candidates.filter((c)=>c.decision==="review-high").length,0),remaining:csv(fs.readFileSync(input,"utf8")).length-report.rows.length});
console.log("Wrote reports/final-photo-source-candidates-v2.json");
