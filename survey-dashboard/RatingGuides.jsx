import React from 'react';

// Histograms position scores at bar centres; continuous tracks use the 1 and 7 endpoints.
export default function RatingGuides({baseline=null,histogram=false}){
  const left=histogram?`calc(${(baseline-.5)/7*100}% + ${(baseline-4)/7} * var(--rating-gap, 8px))`:`${(baseline-1)/6*100}%`;
  return <span className="rating-guides" aria-hidden="true"><i className="rating-midpoint"/>{baseline!==null&&<i className="rating-baseline" style={{left}}/>}</span>;
}
export function RatingGuideCaption({baseline,median}){
  return <div className="rating-guide-caption">{baseline&&<span><i className="baseline-key"/> Average faction {baseline.value===null?'—':baseline.value.toFixed(2)} · {baseline.factionCount}/15 rated</span>}{median!==undefined&&<span>Median {median===null?'—':median}</span>}<span><i className="midpoint-key"/> Scale midpoint 4</span></div>;
}
