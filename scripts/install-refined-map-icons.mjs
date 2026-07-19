import fs from "node:fs";
import path from "node:path";
const root=process.cwd(),apply=process.argv.includes("--apply");
const target=path.join(root,"lib/territory/icons.ts");
const template=path.join(root,"templates/territory-map-icons.ts");
if(!fs.existsSync(target)){console.error("Missing lib/territory/icons.ts");process.exit(1);}
if(!fs.existsSync(template)){console.error("Missing templates/territory-map-icons.ts");process.exit(1);}
console.log(`${apply?"Replacing":"Would replace"} lib/territory/icons.ts with refined jewel markers`);
if(apply){fs.copyFileSync(template,target);console.log("Installed refined map markers.");}
