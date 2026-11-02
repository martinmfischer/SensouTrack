// Drafts are scoped to an account; a fresh guest view cannot restore private notes.
const key=owner=>'sensou-draft:'+(owner||'guest');
export const draftStorage={
  read(owner){try{const value=JSON.parse(sessionStorage.getItem(key(owner))||(owner?sessionStorage.getItem(key()):null)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {}; }},
  write(value,owner){try{sessionStorage.setItem(key(owner),JSON.stringify(value));if(owner)sessionStorage.removeItem(key());}catch{}},
  clear(){try{sessionStorage.removeItem('sensou-draft');for(let i=sessionStorage.length-1;i>=0;i--){const name=sessionStorage.key(i);if(name?.startsWith('sensou-draft:'))sessionStorage.removeItem(name);}}catch{}},
};
