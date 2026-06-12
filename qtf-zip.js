(function(global){
  "use strict";
  const encoder=new TextEncoder();
  const table=new Uint32Array(256);
  for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xEDB88320^(c>>>1):c>>>1;table[n]=c>>>0}
  function crc32(data){let c=0xFFFFFFFF;for(const b of data)c=table[(c^b)&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
  function u16(out,v){out.push(v&255,(v>>>8)&255)}
  function u32(out,v){out.push(v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255)}
  function concat(parts,total){const out=new Uint8Array(total);let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length}return out}
  function makeZip(files){
    const local=[],central=[];let offset=0,localSize=0,centralSize=0;
    files.forEach(file=>{
      const name=encoder.encode(file.name),data=file.data,crc=crc32(data);
      const lh=[];u32(lh,0x04034b50);u16(lh,20);u16(lh,0x0800);u16(lh,0);u16(lh,0);u16(lh,0);
      u32(lh,crc);u32(lh,data.length);u32(lh,data.length);u16(lh,name.length);u16(lh,0);
      const localHeader=new Uint8Array(lh);local.push(localHeader,name,data);
      const ch=[];u32(ch,0x02014b50);u16(ch,20);u16(ch,20);u16(ch,0x0800);u16(ch,0);u16(ch,0);u16(ch,0);
      u32(ch,crc);u32(ch,data.length);u32(ch,data.length);u16(ch,name.length);u16(ch,0);u16(ch,0);
      u16(ch,0);u16(ch,0);u32(ch,0);u32(ch,offset);
      const centralHeader=new Uint8Array(ch);central.push(centralHeader,name);
      offset+=localHeader.length+name.length+data.length;localSize=offset;
      centralSize+=centralHeader.length+name.length;
    });
    const end=[];u32(end,0x06054b50);u16(end,0);u16(end,0);u16(end,files.length);u16(end,files.length);
    u32(end,centralSize);u32(end,localSize);u16(end,0);
    return concat([...local,...central,new Uint8Array(end)],localSize+centralSize+end.length);
  }
  global.QtfZip={makeZip};
})(window);
