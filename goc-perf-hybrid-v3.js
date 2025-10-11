// goc-perf-hybrid-v3.js
// Goal: Keep existing image behavior 100% intact. Improve mobile Lighthouse by:
//  - Adding defer to non-critical external scripts (skip Google Maps & data-critical="true").
//  - Adding resource hints (preconnect/dns-prefetch) to up to 4 external origins.
//  - Ensuring viewport meta exists.
// Legacy WSH-safe (no ES6 features).

var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);

function readAll(p){ var t=fso.OpenTextFile(p,1); var s=t.ReadAll(); t.Close(); return s; }
function writeAll(p,s){ var t=fso.OpenTextFile(p,2,true); t.Write(s); t.Close(); }

var html = readAll(filePath);

function hasViewport(h){ return /<meta\s+name=["']viewport["'][^>]*>/i.test(h); }
function injectViewport(h){
  var tag = '<meta name="viewport" content="width=device-width, initial-scale=1">';
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, function(m){ return m + "\n  " + tag; });
  return tag + "\n" + h;
}

// Defer external scripts except Google Maps or data-critical="true"
function addDeferToScripts(h){
  // Skip inline scripts; only <script ... src="..."></script>
  return h.replace(/<script\b([^>]*)><\/script>/gi, function(m, a){
    if (!/\ssrc\s*=/i.test(a)) return m;
    if (/\b(async|defer)\b/i.test(a)) return m;
    if (/\btype\s*=\s*["']module["']/i.test(a)) return m;
    if (/\bdata-critical\s*=\s*["']true["']/i.test(a)) return m;
    // Skip Google Maps and gmap domains
    var src = (a.match(/\ssrc\s*=\s*"([^"]+)"/i) || ["",""])[1];
    if (/google\.(com|apis)\/*.*maps/i.test(src) || /maps\.google\.com/i.test(src)) return m;
    return "<script" + a + " defer></script>";
  });
}

function unique(arr){ var o={},out=[],i; for(i=0;i<arr.length;i++){ if(!o[arr[i]]){ o[arr[i]]=1; out.push(arr[i]); } } return out; }
function escapeForRegex(s){ return s.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'); }

function extractOrigins(h){
  var out=[], m;
  var re = /(?:src|href|content)\s*=\s*"([^"]+)"/gi;
  while ((m = re.exec(h)) !== null){
    var url = m[1];
    if (/^https?:\/\//i.test(url)){
      var mm = url.match(/^(https?:\/\/[^\/]+)/i);
      if (mm) out.push(mm[1]);
    }
  }
  // from srcset too
  var rs, r2 = /srcset\s*=\s*"([^"]+)"/gi;
  while ((rs = r2.exec(h)) !== null){
    var list = rs[1].split(',');
    for (var i=0;i<list.length;i++){
      var part = list[i].replace(/^\s+|\s+$/g,'');
      var u = part.split(/\s+/)[0];
      if (/^https?:\/\//i.test(u)){
        var m3 = u.match(/^(https?:\/\/[^\/]+)/i);
        if (m3) out.push(m3[1]);
      }
    }
  }
  return unique(out);
}

function addResourceHints(h){
  var origins = extractOrigins(h);
  var headAdded = "", count = 0;
  for (var i=0;i<origins.length && count<4;i++){
    var o = origins[i];
    // skip if already present
    var exists = new RegExp('<link[^>]+(preconnect|dns-prefetch)[^>]+href=["\\']'+escapeForRegex(o)+'["\\']','i').test(h);
    if (exists) continue;
    headAdded += '  <link rel="preconnect" href="'+o+'" crossorigin>\n';
    headAdded += '  <link rel="dns-prefetch" href="'+o+'">\n';
    count++;
  }
  if (!headAdded) return h;
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, function(m){ return m + "\n" + headAdded; });
  return headAdded + h;
}

function patch(h){
  var out = h;
  if (!hasViewport(out)) out = injectViewport(out);
  out = addDeferToScripts(out);    // safe defer
  out = addResourceHints(out);     // preconnect/dns-prefetch
  // IMPORTANT: We do not touch <img>, <picture>, src/srcset/sizes, classes, or styles.
  // Add a tiny comment for traceability:
  if (!/GOC Perf Hybrid v3/i.test(out)){
    out = out.replace(/<head[^>]*>/i, function(m){ return m + '\n  <!-- GOC Perf Hybrid v3: images untouched; safe script defer -->'; });
  }
  return out;
}

writeAll(filePath, patch(html));
