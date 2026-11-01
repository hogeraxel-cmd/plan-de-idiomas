// Fake Firebase compat (app/auth/firestore) backed by localStorage 'FAKE_FS' (simulates the server)
(function(){
  function db(){ return JSON.parse(localStorage.getItem('FAKE_FS')||'{}'); }
  function save(d){ localStorage.setItem('FAKE_FS', JSON.stringify(d)); }
  window.__calls = [];
  var listeners = [];
  function cur(){ var s=localStorage.getItem('FAKE_AUTH'); return s?JSON.parse(s):null; }
  function off(){ return !navigator.onLine ? Promise.reject({code:'unavailable'}) : null; }
  function docRef(path){ return {
    get: function(){ return off() || Promise.resolve({exists: path in db(), data: function(){ return db()[path]; }}); },
    set: function(v,o){ return off() || (window.__calls.push(['set',path]), (function(){ var d=db(); if(o&&o.merge){ var cur=d[path]||{}; (function m(a,b){ Object.keys(b).forEach(function(k){ if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){ a[k]=a[k]&&typeof a[k]==='object'?a[k]:{}; m(a[k],b[k]); } else a[k]=b[k]; }); })(cur,v); d[path]=cur; } else d[path]=v; save(d); })(), Promise.resolve()); }
  }; }
  var auth = {
    onAuthStateChanged: function(cb){ setTimeout(function(){ cb(cur()); }, 10); return function(){}; },
    signInWithEmailAndPassword: function(e,p){ if(p!=='clave123') return Promise.reject({code:'auth/invalid-credential'}); var u={uid:'u1',email:e}; localStorage.setItem('FAKE_AUTH',JSON.stringify(u)); return Promise.resolve({user:u}); },
    signOut: function(){ localStorage.removeItem('FAKE_AUTH'); return Promise.resolve(); }
  };
  var fs = {
    doc: docRef,
    collection: function(p){ return { where: function(f,op,v){ return { get: function(){ return off() || Promise.resolve({docs: Object.keys(db()).filter(k=>k.startsWith(p+'/') && db()[k][f]>=v).map(k=>({data:()=>db()[k]}))}); } }; } }; },
    batch: function(){ var ops=[]; return { set: function(ref,v){ ops.push([ref,v]); }, commit: function(){ if(!navigator.onLine) return Promise.reject({code:'unavailable'}); window.__calls.push(['batch',ops.length]); ops.forEach(function(o){ var d=db(); d[o[0].__p]=o[1]; save(d); }); return Promise.resolve(); } }; }
  };
  var _doc = fs.doc; fs.doc = function(p){ var r=_doc(p); r.__p=p; return r; };
  window.firebase = { initializeApp: function(){ return { auth: function(){ return auth; }, firestore: function(){ return fs; } }; } };
})();
