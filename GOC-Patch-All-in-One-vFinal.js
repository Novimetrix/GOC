// GOC-Patch-All-in-One-vFinal.js
var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);

function readAll(p){
  var t = fso.OpenTextFile(p, 1);
  var s = t.ReadAll();
  t.Close();
  return s;
}
function writeAll(p, s){
  var t = fso.OpenTextFile(p, 2, true);
  t.Write(s);
  t.Close();
}
function unique(arr){ var o={},out=[],i; for(i=0;i<arr.length;i++){ if(!o[arr[i]]){ o[arr[i]]=1; out.push(arr[i]); } } return out; }
function escapeRegExp(s){ return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); }

var html = readAll(filePath);
var orig = html;
var changes = [];

// 1) localhost -> root-relative
html = html.replace(/(src|href)\s*=\s*"([^"]+)"/gi, function(m, k, v){
  var nv = v
    .replace(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/gi, '')
    .replace(/https?%3A%2F%2F(?:localhost|127\.0\.0\.1)(?::\d+)?/gi, '');
  if (nv !== v) { changes.push("fixed "+k+" localhost"); }
  return k+'="'+nv+'"';
});
html = html.replace(/srcset\s*=\s*"([^"]+)"/gi, function(m, list){
  var parts = list.split(',');
  for (var i=0;i<parts.length;i++){
    var p = parts[i].replace(/^\s+|\s+$/g, '');
    var bits = p.split(/\s+/);
    if (bits[0]){
      var u = bits[0]
        .replace(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/gi, '')
        .replace(/https?%3A%2F%2F(?:localhost|127\.0\.0\.1)(?::\d+)?/gi, '');
      bits[0] = u;
      parts[i] = bits.join(' ');
    }
  }
  var out = parts.join(', ');
  if (out !== list) { changes.push("fixed srcset localhost"); }
  return 'srcset="'+out+'"';
});

// 2) Remove srcset/sizes on <img> and <source>
html = html.replace(/<img\b([^>]*?)>/gi, function(m, a){
  var x = a, had = false;
  if (/\ssrcset\s*=/i.test(x)) { x = x.replace(/\s+srcset\s*=\s*"[^"]*"/gi, ''); had = true; }
  if (/\ssizes\s*=/i.test(x))  { x = x.replace(/\s+sizes\s*=\s*"[^"]*"/gi, ''); had = true; }
  if (had) changes.push("removed img srcset/sizes");
  return '<img'+x+'>';
});
html = html.replace(/<source\b([^>]*?)>/gi, function(m, a){
  var x = a, had = false;
  if (/\ssrcset\s*=/i.test(x)) { x = x.replace(/\s+srcset\s*=\s*"[^"]*"/gi, ''); had = true; }
  if (/\ssizes\s*=/i.test(x))  { x = x.replace(/\s+sizes\s*=\s*"[^"]*"/gi, ''); had = true; }
  if (had) changes.push("removed source srcset/sizes");
  return '<source'+x+'>';
});

// 3) Inline no-srcset.js
html = html.replace(/<script\b([^>]*?)src\s*=\s*"([^"]*no-srcset\.js[^"]*)"(.*?)><\/script>/gi, function(m, pre, src, post){
  changes.push("inlined no-srcset.js");
  var inline = '<script>!function(){try{Object.defineProperty(HTMLImageElement.prototype,"srcset",{set:function(v){},get:function(){return""}})}catch(e){}}();</script>';
  return inline;
});

// 4) Ensure viewport
if (!/<meta\s+name=["']viewport["'][^>]*>/i.test(html)){
  if (/<head[^>]*>/i.test(html)){
    html = html.replace(/<head[^>]*>/i, function(m){ changes.push("added viewport"); return m+'\r\n  <meta name="viewport" content="width=device-width, initial-scale=1">'; });
  } else {
    html = '<meta name="viewport" content="width=device-width, initial-scale=1">\r\n' + html;
    changes.push("prepended viewport");
  }
}

// 5) Preload first stylesheet
var firstCss = null;
var linkMatch = html.match(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/i);
if (linkMatch){
  firstCss = linkMatch[1];
  var esc = escapeRegExp(firstCss);
  if (!new RegExp('<link[^>]+rel=["\']preload["\'][^>]+as=["\']style["\'][^>]+href=["\']'+esc+'["\']','i').test(html)){
    var preloadTag = '  <link rel="preload" as="style" href="'+firstCss+'">';
    if (/<head[^>]*>/i.test(html)){
      html = html.replace(/<head[^>]*>/i, function(m){ changes.push("preload main css"); return m+'\r\n'+preloadTag; });
    } else {
      html = preloadTag + '\r\n' + html;
      changes.push("preload main css (no head)");
    }
  }
}

// 6) Preconnect origins (up to 4)
function collectOrigins(h){
  var arr = [], m;
  var re = /(?:src|href|content)\s*=\s*"([^"]+)"/gi;
  while ((m = re.exec(h)) !== null){
    var url = m[1];
    if (/^https?:\/\//i.test(url)){
      var mm = url.match(/^(https?:\/\/[^\/]+)/i);
      if (mm) arr.push(mm[1]);
    }
  }
  return unique(arr);
}
var origins = collectOrigins(html);
var addHints = "", added = 0;
for (var i=0;i<origins.length && added<4;i++){
  var o = origins[i];
  var escO = escapeRegExp(o);
  var exists = new RegExp('<link[^>]+(preconnect|dns-prefetch)[^>]+href=["\\']'+escO+'["\\']','i').test(html);
  if (exists) continue;
  addHints += '  <link rel="preconnect" href="'+o+'" crossorigin>\r\n';
  addHints += '  <link rel="dns-prefetch" href="'+o+'">\r\n';
  added++;
}
if (addHints){
  if (/<head[^>]*>/i.test(html)){
    html = html.replace(/<head[^>]*>/i, function(m){ changes.push("added preconnect/dns"); return m+'\r\n'+addHints; });
  } else {
    html = addHints + html;
    changes.push("added preconnect/dns (no head)");
  }
}

// trace comment
if (!/GOC All-in-One vFinal/i.test(html)){
  html = html.replace(/<head[^>]*>/i, function(m){ return m+'\r\n  <!-- GOC All-in-One vFinal: inline no-srcset, viewport, css preload, preconnect; srcset/sizes removed; localhost fixed -->'; });
}

if (html !== orig){
  writeAll(filePath, html);
  WScript.Echo("  Changes: " + (changes.length ? changes.join("; ") : "none"));
} else {
  WScript.Echo("  Changes: none");
}
