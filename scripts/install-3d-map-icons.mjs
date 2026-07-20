import fs from "node:fs";
import path from "node:path";

const root=process.cwd(),apply=process.argv.includes("--apply");
const ignored=new Set(["node_modules",".next",".git","archives","reports"]);
function walk(directory,out=[]){for(const item of fs.readdirSync(directory,{withFileTypes:true})){if(ignored.has(item.name))continue;const full=path.join(directory,item.name);if(item.isDirectory())walk(full,out);else if(/\.(?:ts|tsx)$/.test(item.name))out.push(full);}return out;}
const candidates=walk(root).filter((file)=>{const text=fs.readFileSync(file,"utf8");return text.includes("const PLACE_GLYPHS")&&text.includes("makePlaceIcon")&&text.includes('from "leaflet"');});
if(candidates.length!==1){console.error(`Expected exactly one current marker module; found ${candidates.length}.`);for(const file of candidates)console.error(path.relative(root,file));process.exit(1);}
const target=candidates[0],template=path.join(root,"templates/territory-map-icons.ts");
if(!fs.existsSync(template)){console.error("Missing templates/territory-map-icons.ts");process.exit(1);}
console.log(`${apply?"Replacing":"Would replace"} ${path.relative(root,target)}`);
if(apply){fs.copyFileSync(template,target);console.log("Installed dimensional SVG Leaflet markers.");}
