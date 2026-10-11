import {writeFile,mkdir} from 'node:fs/promises';
const base=new URL(process.argv[2]);
const result={url:base.href,scope:'HTTP response inspection only; no browser execution',pages:[]};
for(const pathname of ['/','/collections/all','/search?q=nova','/products.json?limit=10']){
 const url=new URL(pathname,base);url.searchParams.set('preview_theme_id',base.searchParams.get('preview_theme_id'));
 try{const response=await fetch(url,{signal:AbortSignal.timeout(20000)});const body=await response.text();const page={path:pathname,status:response.status,finalUrl:response.url,passwordGate:new URL(response.url).pathname==='/password',liquidError:/Liquid (?:error|syntax error):/i.test(body)};
 if(pathname.startsWith('/products.json')){try{const data=JSON.parse(body);page.products=(data.products||[]).map(p=>({handle:p.handle,title:p.title,images:p.images.length,variants:p.variants.map(v=>({id:v.id,available:v.available,price:v.price}))}));}catch{page.json=false;}}else{page.h1Count=(body.match(/<h1(?:\s|>)/g)||[]).length;page.hasMain=body.includes('id="MainContent"');page.hasCart=body.includes('NovaCartDialog');page.hasNovaHero=body.includes('Built for Everyday Movement');page.hasNativeFilters=body.includes('data-filter-section');page.hasPredictive=body.includes('nova-search');}result.pages.push(page);
 }catch(error){result.pages.push({path:pathname,error:error.message});}
}
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});await writeFile(new URL('../reports/preview-http.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
