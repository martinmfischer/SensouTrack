// Deviation keeps the target faction's overall valid-rating mean as reference.
export function ratingDeviation(cell,overall){return Number.isFinite(cell?.value)&&Number.isFinite(overall?.value)?cell.value-overall.value:null;}
export function deviationLimit(table,overall){
 const values=table.flatMap(row=>row.cells.map(cell=>ratingDeviation(cell,overall.find(c=>c.target===cell.target)))).filter(Number.isFinite).map(Math.abs).sort((a,b)=>a-b);
 // Use the 90th percentile so a few extreme cells do not flatten the whole table.
 return Math.max(.5,Math.ceil((values[Math.ceil(values.length*.9)-1]||0)*4)/4);
}
export function deviationColour(value,limit){
 if(!Number.isFinite(value))return {};
 const centre=[244,242,233],end=value<0?[159,63,47]:[23,102,78],strength=Math.min(1,Math.abs(value)/limit);
 const rgb=centre.map((c,i)=>Math.round(c+(end[i]-c)*strength));
 const luminance=rgb.map(c=>{const s=c/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
 return {background:`rgb(${rgb.join(',')})`,color:luminance>.179?'#000':'#fff'};
}
export function signedRating(value){return Number.isFinite(value)?new Intl.NumberFormat('en-GB',{minimumFractionDigits:1,maximumFractionDigits:1,signDisplay:'exceptZero'}).format(value):'—';}
