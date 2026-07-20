import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apply = process.argv.includes("--apply");
const catalogPaths = {
  place: "data/travel-knowledge/places.json",
  beach: "data/travel-knowledge/beaches.json",
  historic: "data/travel-knowledge/historic-sites.json",
};

const approved = [
  ["place","coral-bay","stj","https://upload.wikimedia.org/wikipedia/commons/f/f5/Coral_Bay_Saint_John_Virgin_Islands_2022-04-20.jpg","https://commons.wikimedia.org/w/index.php?curid=117932859","Eoghanacht","CC0 1.0"],
  ["place","fortsberg","stj","https://upload.wikimedia.org/wikipedia/commons/8/85/HABS_Frederiks_Fort_St_John_USVI.jpg","https://commons.wikimedia.org/wiki/File:HABS_Frederiks_Fort_St_John_USVI.jpg","Jack Boucher","Public domain"],
  ["beach","teague-bay","stx","https://upload.wikimedia.org/wikipedia/commons/9/99/2008-01-27_Teague_Bay_Beach_St._Croix_USVI.jpg","https://commons.wikimedia.org/wiki/File:2008-01-27_Teague_Bay_Beach_St._Croix_USVI.jpg","Jason P. Heym / Seascape Pool Center Inc.","CC BY-SA 3.0"],
  ["historic","bordeaux","stt","https://upload.wikimedia.org/wikipedia/commons/5/5f/Bordeaux_Great_House%2C_St_Thomas.png","https://commons.wikimedia.org/wiki/File:Bordeaux_Great_House,_St_Thomas.png","Douglas Richards","Public domain"],
  ["historic","cinnamon-bay-plantation","stj","https://upload.wikimedia.org/wikipedia/commons/7/7e/Cinnamon_Bay_Plantation_ruins.JPG","https://commons.wikimedia.org/wiki/File:Cinnamon_Bay_Plantation_ruins.JPG","Farragutful","CC BY-SA 4.0"],
  ["historic","cruz-bay-town-historic-district","stj","https://upload.wikimedia.org/wikipedia/commons/c/c1/Cruz_Bay%2C_Saint_John%3B_United_States_Virgin_Islands.jpg","https://commons.wikimedia.org/w/index.php?curid=4381123","Sydney Poore and Russell Poore","CC BY-SA 3.0"],
  ["historic","dennis-bay-historic-district","stj","https://upload.wikimedia.org/wikipedia/commons/9/91/Dennis_Bay_windmill.jpg","https://commons.wikimedia.org/wiki/File:Dennis_Bay_windmill.jpg","John Milner for HABS","Public domain"],
  ["historic","enighed","stj","https://upload.wikimedia.org/wikipedia/commons/0/01/Enighed%2C_Saint_John%2C_U.S._Virgin_Islands.jpg","https://commons.wikimedia.org/w/index.php?curid=147540881","LittleT889","CC BY 4.0"],
  ["historic","estate-botany-bay","stt","https://upload.wikimedia.org/wikipedia/commons/4/41/Estate_Botany_Bay_02.jpg","https://commons.wikimedia.org/wiki/File:Estate_Botany_Bay_02.jpg","Samuel N. Stokes","Public domain"],
  ["historic","estate-carolina-sugar-plantation","stj","https://upload.wikimedia.org/wikipedia/commons/9/92/ESTATE_CAROLINA_SUGAR_PLANTATION.jpg","https://commons.wikimedia.org/wiki/File:ESTATE_CAROLINA_SUGAR_PLANTATION.jpg","Jerry Roy Klotz, MD","CC BY-SA 3.0"],
  ["historic","estate-grove-place","stx","https://upload.wikimedia.org/wikipedia/commons/a/ab/GroveRuins20230926_101042.jpg","https://commons.wikimedia.org/wiki/File:GroveRuins20230926_101042.jpg","CaptJayRuffins","CC BY-SA 4.0"],
  ["historic","estate-little-princess","stx","https://upload.wikimedia.org/wikipedia/commons/e/e9/Plantation_ruins_estate_little_princess.jpg","https://commons.wikimedia.org/wiki/File:Plantation_ruins_estate_little_princess.jpg","Jack Delano","Public domain"],
  ["historic","fortsberg","stj","https://upload.wikimedia.org/wikipedia/commons/8/85/HABS_Frederiks_Fort_St_John_USVI.jpg","https://commons.wikimedia.org/wiki/File:HABS_Frederiks_Fort_St_John_USVI.jpg","Jack Boucher","Public domain"],
  ["historic","frederick-lutheran-church","stt","https://live.staticflickr.com/1542/23853962999_d718b899ec_b.jpg","https://www.flickr.com/photos/44768401@N07/23853962999","ThatMattWade","CC BY-SA 2.0"],
  ["historic","mafolie-great-house","stt","https://upload.wikimedia.org/wikipedia/commons/b/b5/Mafolie_Great_House%2C_St_Thomas.png","https://commons.wikimedia.org/wiki/File:Mafolie_Great_House,_St_Thomas.png","Russell Wright","Public domain"],
  ["historic","new-herrnhut-moravian-church","stt","https://upload.wikimedia.org/wikipedia/commons/7/78/New_Herrnhut_Moravian_Church%2C_St._Thomas.png","https://commons.wikimedia.org/wiki/File:New_Herrnhut_Moravian_Church,_St._Thomas.png","Samuel N. Stokes","Public domain"],
  ["historic","peace-hill-ruins","stj","https://upload.wikimedia.org/wikipedia/commons/a/af/Denis_Bay_Historic_District_Peace_Hill_Ruins_sunrise.jpg","https://commons.wikimedia.org/wiki/File:Denis_Bay_Historic_District_Peace_Hill_Ruins_sunrise.jpg","Anonnymock5","CC BY-SA 4.0"],
  ["historic","reformed-dutch-church-stt","stt","https://upload.wikimedia.org/wikipedia/commons/d/db/St_Tom_USVI_Reformed_Church.JPG","https://commons.wikimedia.org/wiki/File:St_Tom_USVI_Reformed_Church.JPG","Smallbones","CC0"],
  ["historic","slob-historic-district","stx","https://upload.wikimedia.org/wikipedia/commons/b/b5/Slob_%28Danish_West_Indies%29.jpg","https://commons.wikimedia.org/wiki/File:Slob_(Danish_West_Indies).jpg","Unknown","Public domain"],
].map(([kind,id,island,url,sourceUrl,creator,license])=>({kind,id,island,url,sourceUrl,creator,license}));

function extension(url){const match=new URL(url).pathname.match(/\.(jpe?g|png|webp)$/i);return (match?.[1]??"jpg").toLowerCase().replace("jpeg","jpg");}
function publicPath(item){return `/images/sourced/${item.kind}/${item.island}/${item.id}.${extension(item.url)}`;}
function locate(node,id,key=""){
  if(!node||typeof node!=="object")return null;
  if(!Array.isArray(node)&&(node.id===id||node.slug===id||key===id))return node;
  for(const [childKey,value] of Object.entries(node)){const found=locate(value,id,childKey);if(found)return found;}
  return null;
}
async function download(item,destination){
  for(let attempt=0;attempt<5;attempt++){
    const response=await fetch(item.url,{headers:{"User-Agent":"VI-Guide-photo-catalog/1.0"}});
    if(response.ok){fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,Buffer.from(await response.arrayBuffer()));return;}
    if(response.status!==429&&response.status<500)throw new Error(`${response.status} downloading ${item.id}`);
    await new Promise((resolve)=>setTimeout(resolve,1500*(attempt+1)));
  }
  throw new Error(`rate-limited downloading ${item.id}; run --apply again to resume`);
}

const catalogs={};
for(const [kind,relative] of Object.entries(catalogPaths)){
  const absolute=path.join(root,relative);if(!fs.existsSync(absolute))throw new Error(`Missing ${relative}`);
  catalogs[kind]={relative,absolute,data:JSON.parse(fs.readFileSync(absolute,"utf8"))};
}
const results=[];
for(const item of approved){
  const target=locate(catalogs[item.kind].data,item.id);
  if(!target){results.push({...item,status:"catalog-entry-not-found"});continue;}
  const image=publicPath(item);
  if(apply){
    const destination=path.join(root,"public",image);
    try{if(!fs.existsSync(destination))await download(item,destination);}
    catch(error){results.push({...item,image,status:"download-failed",error:String(error.message??error)});continue;}
    target.image=image;
    if(Array.isArray(target.images))target.images=[image,...target.images.filter((x)=>x!==image&&!/placeholder|fallback/i.test(x))];
    if("imageUrl" in target)target.imageUrl=image;
    if("heroImage" in target)target.heroImage=image;
    await new Promise((resolve)=>setTimeout(resolve,750));
  }
  results.push({...item,image,status:apply?"applied":"ready"});
}
if(apply){
  for(const {absolute,data} of Object.values(catalogs))fs.writeFileSync(absolute,`${JSON.stringify(data,null,2)}\n`);
  const attributionPath=path.join(root,"public/data/photo-attributions.json");
  fs.mkdirSync(path.dirname(attributionPath),{recursive:true});
  const prior=fs.existsSync(attributionPath)?JSON.parse(fs.readFileSync(attributionPath,"utf8")):{};
  for(const item of results.filter((x)=>x.status==="applied"))prior[item.image]={title:item.id,creator:item.creator,license:item.license,sourceUrl:item.sourceUrl};
  fs.writeFileSync(attributionPath,`${JSON.stringify(prior,null,2)}\n`);
}
const reportPath=path.join(root,"reports/reviewed-photo-matches.json");
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
fs.writeFileSync(reportPath,`${JSON.stringify({generatedAt:new Date().toISOString(),mode:apply?"apply":"dry-run",results},null,2)}\n`);
console.table({mode:apply?"apply":"dry-run",approved:approved.length,ready:results.filter((x)=>/ready|applied/.test(x.status)).length,missingEntries:results.filter((x)=>x.status==="catalog-entry-not-found").length,downloadFailed:results.filter((x)=>x.status==="download-failed").length});
console.log("Wrote reports/reviewed-photo-matches.json");
