export default {
  fetch(request){
    const url=new URL(request.url);
    return new Response(null,{status:302,headers:{
      Location:'https://app.sensoutrack.pages.dev'+url.pathname+url.search,
      'Cache-Control':'no-store',
      'Referrer-Policy':'no-referrer',
    }});
  },
};
