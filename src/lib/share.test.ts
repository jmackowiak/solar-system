import { describe, expect, it } from "vitest";
import { parseSharedView, shareUrl, type SharedView } from "./share";
const view: SharedView = {v:1,mode:"solar",system:"solar",selected:"moon",days:123.5,speed:.1,paused:true,language:"en",orbits:true,labels:false,camera:{position:[10,4,2],target:[1,0,0]},pair:["earth","jupiter"],light:499,phase:90,range:100,eclipse:"phases"};
describe("shareable views",()=>{
  it("round trips an exact camera, moon, time and settings, removing unrelated parameters",()=>{
    const url=new URL(shareUrl("https://orbita.example/?fallback=1#old",view));
    expect(url.searchParams.has("fallback")).toBe(false);
    expect(url.hash).toBe("");
    expect(parseSharedView(url.search)).toEqual(view);
  });
  it("supports every discovery mode",()=>{
    for(const mode of ["solar","galaxy","compare","light","neighborhood","phases"] as const)
      expect(parseSharedView(new URL(shareUrl("https://example.test",{...view,mode})).search)?.mode).toBe(mode);
  });
  it("rejects unknown objects, incompatible systems, malformed or oversized input",()=>{
    for(const change of [{selected:"unknown"},{system:"trappist-1"},{pair:["sun","earth"]},{mode:"invalid"},{v:2},{days:-1},{speed:Infinity},{phase:361},{range:200},{light:19000},{lightSpeed:30},{lightTarget:"unknown"},{moonParent:"jupiter"},{camera:{position:[0,0,0],target:[0,0,0]}}])
      expect(parseSharedView(`?view=${encodeURIComponent(JSON.stringify({...view,...change}))}`)).toBeNull();
    expect(parseSharedView("?view=%7Bbad")).toBeNull();
    expect(parseSharedView(`?view=${"a".repeat(4000)}`)).toBeNull();
    expect(parseSharedView("")).toBeNull();
  });
});
