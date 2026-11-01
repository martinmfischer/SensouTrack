// Draft persistence is optional: blocked browser storage must not interrupt a save.
export const draftStorage={
  read(){try{return JSON.parse(sessionStorage.getItem('sensou-draft')||'{}');}catch{return {}; }},
  write(value){try{sessionStorage.setItem('sensou-draft',JSON.stringify(value));}catch{}},
  clear(){try{sessionStorage.removeItem('sensou-draft');}catch{}},
};
