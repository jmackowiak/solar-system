import {expect,test,type Page} from "@playwright/test";
const scene=(page:Page)=>page.getByTestId("scene");
async function ready(page:Page){await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");await expect(scene(page)).toHaveAttribute("data-ready","true");}
async function tool(page:Page,name:string){await page.getByRole("button",{name:"Explore tools",exact:true}).click();await page.getByRole("navigation",{name:"Discovery tools",exact:true}).getByRole("button",{name,exact:true}).click();}
async function link(page:Page){await tool(page,"Share view");const url=await page.getByRole("textbox",{name:"View link",exact:true}).inputValue();await page.goto(url);await expect(scene(page)).toHaveAttribute("data-ready","true");}
const errors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const list:string[]=[];errors.set(page,list);page.on("pageerror",e=>list.push(e.message));});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
test("restored object views keep focus and phase zoom stays outside the Earth",async({page})=>{
 test.setTimeout(75000);await ready(page);
 await page.getByRole("button",{name:"Select Earth",exact:true}).click();await link(page);
 await page.getByRole("button",{name:"Close information",exact:true}).click();await expect(page.getByRole("button",{name:"Select Earth",exact:true})).toBeFocused();
 await page.getByRole("button",{name:"Select Jupiter",exact:true}).click();await page.getByRole("button",{name:"Explore moons",exact:true}).click();await page.getByRole("button",{name:"Select Ganymede",exact:true}).click();await link(page);
 await page.getByRole("button",{name:"Close information",exact:true}).click();await expect(page.getByRole("button",{name:"Select Jupiter",exact:true})).toBeFocused();
 await tool(page,"Moon phases & eclipses");await link(page);
 const camera=async()=>Math.hypot(...(await scene(page).getAttribute("data-camera"))!.split(",").map(Number));
 const before=await camera(),box=(await scene(page).locator("canvas").boundingBox())!;
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.45);await page.mouse.wheel(0,-10000);
 await expect.poll(camera).toBeLessThan(before-1);expect(await camera()).toBeGreaterThan(17);
 await page.getByRole("button",{name:"Back to exploration",exact:true}).click();await expect(page.getByRole("button",{name:"Explore tools",exact:true})).toBeFocused();
});
for(const mode of ["compare","phases"] as const){
 test(`retries a failed local texture in ${mode} and attaches it to the rendered material`,async({page})=>{
  let fail=false,attempts=0;
  const file=mode==="compare"?"jupiter-low.webp":"earth-low.webp";
  await page.route(`**/textures/${file}*`,async route=>{if(fail){fail=false;attempts++;await route.abort("failed");}else {attempts++;await route.continue();}});
  await ready(page);fail=true;
  await tool(page,mode==="compare"?"Size comparison":"Moon phases & eclipses");
  const notice=page.locator(".texture-notice");await expect(notice).toBeVisible();
  await expect.poll(()=>scene(page).getAttribute("data-draws").then(Number)).toBeGreaterThan(0);
  const firstAttempts=attempts;
  await notice.getByRole("button",{name:"Retry",exact:true}).click();
  await expect(notice).toHaveCount(0);await expect.poll(()=>attempts).toBeGreaterThan(firstAttempts);
  if(mode==="phases")await expect(scene(page)).toHaveAttribute("data-earth-texture",/earth-low\.webp\?v=1$/);
  else await expect.poll(async()=>JSON.parse((await scene(page).getAttribute("data-comparison-textures"))||"{}").jupiter).toMatch(/jupiter(?:-low)?\.webp\?v=1$/);
  await expect(scene(page)).toHaveAttribute("data-mode",mode);await expect(scene(page).locator("canvas")).toHaveCount(1);
 });
}
