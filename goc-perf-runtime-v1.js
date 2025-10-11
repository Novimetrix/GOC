// goc-perf-runtime-v1.js — Legacy WSH-safe (no ES6), HTML edit via cscript.
// Adds viewport if missing, preconnect/dns-prefetch (max 4), and hero image preload.
// DOES NOT touch <img>/<picture> attributes or any existing <script> tags.

var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);

function readAll(p){ var t=fso.OpenTextFile(p,1); var s=t.ReadAll(); t.Close(); return s; }
function writeAll(p,s){ var t=fso.OpenTextFile(p,2,true); t.Write(s); t.Close(); }

function hasViewport(h){ return /<meta\s+name=["']viewport["'][^>]*>/i.test(h); }
function injectViewport(h){
  var tag = '  <meta name="viewport" content="width=device-width, initial-scale=1">';
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, function(m){ return m + "\r\n" + tag; });
  return tag + "\r\n" + h;
}

function unique(arr){ var o={},out=[],i; for(i=0;i<arr.length;i++){ if(!o[arr[i]]){ o[arr[i]]=1; out.push(arr[i]); } } return out; }
function escapeRe(s){ return s.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'); }

function extractOrigins(h){
  var out=[], m;
  var re = /(?:src|href|content)\s*=\s*"([^"]+)"/gi;
  while ((m = re.exec(h)) !== null){
    var url = m[1];
    var mm = url.match(/^(https?:\/\/[^\/]+)/i);
    if (mm) out.push(mm[1]);
  }
  // also from srcset
  var r2 = /srcset\s*=\s*"([^"]+)"/gi, ms;
  while ((ms = r2.exec(h)) !== null){
    var list = ms[1].split(',');
    for (var i=0;i<list.length;i++){
      var part = list[i].replace(/^\s+|\s+$/g,'');
      var u = part.split(/\s+/)[0];
      var m3 = u.match(/^(https?:\/\/[^\/]+)/i);
      if (m3) out.push(m3[1]);
    }
  }
  return unique(out);
}

function addResourceHints(h){
  var origins = extractOrigins(h);
  var headAdded = "", count = 0;
  for (var i=0;i<origins.length && count<4;i++){
    var o = origins[i];
    var exists = new RegExp('<link[^>]+(preconnect|dns-prefetch)[^>]+href=["\\']'+escapeRe(o)+'["\\']','i').test(h);
    if (exists) continue;
    headAdded += '  <link rel="preconnect" href="'+o+'" crossorigin>\r\n';
    headAdded += '  <link rel="dns-prefetch" href="'+o+'">\r\n';
    count++;
  }
  if (!headAdded) return h;
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, function(m){ return m + "\r\n" + headAdded.replace(/\r\n$/,''); });
  return headAdded + h;
}

function preloadHeroImage(h){
  // Find first meaningful <img src="...">
  var m = h.match(/<img\b[^>]*src\s*=\s*"([^"?#]+)"/i);
  if (!m) return h;
  var src = m[1];
  if (/^data:image/i.test(src) || /\.svg$/i.test(src) || /\/favicon/i.test(src) || /wp-includes\/emoji/i.test(src)) return h;

  var esc = escapeRe(src);
  if (new RegExp('<link[^>]+rel=["\\']preload["\\'][^>]+as=["\\']image["\\'][^>]+href=["\\']'+esc+'["\\']','i').test(h)) return h;

  var tag = '  <link rel="preload" as="image" href="'+src+'">';
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, function(m){ return m + "\r\n" + tag; });
  return tag + "\r\n" + h;
}

function addTrace(h){
  if (/GOC Perf Runtime v1/i.test(h)) return h;
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, function(m){ return m + '\r\n  <!-- GOC Perf Runtime v1: viewport + preconnect + hero preload; images untouched -->'; });
  return '<!-- GOC Perf Runtime v1: viewport + preconnect + hero preload; images untouched -->\r\n' + h;
}

var html = readAll(filePath);
var out = html;
if (!hasViewport(out)) out = injectViewport(out);
out = addResourceHints(out);
out = preloadHeroImage(out);
out = addTrace(out);
if (out != html) writeAll(filePath, out);
