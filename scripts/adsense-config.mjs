export function adsenseVerification(env){
  const publisher=env.VITE_ADSENSE_PUBLISHER_ID?.trim();
  if(!publisher)return null;
  if(!/^ca-pub-\d{16}$/.test(publisher))throw new Error('Expected the public AdSense publisher ID: ca-pub- followed by 16 digits.');
  return {publisher,adsTxt:`google.com, ${publisher.slice(3)}, DIRECT, f08c47fec0942fa0\n`};
}
