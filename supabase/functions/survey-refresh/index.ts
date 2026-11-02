// Survey data was frozen on 2 November 2026 and is bundled with the website.
Deno.serve(()=>new Response(JSON.stringify({error:'Survey closed. Data is frozen.'}),{
  status:410,
  headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
}));
