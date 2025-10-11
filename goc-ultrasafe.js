// goc-ultrasafe.js — WSH JScript (legacy‑safe)
// Does ONLY two things:
//  1) Inline any <script src="...no-srcset.js"> to avoid a render-blocking request
//  2) Preload the first <link rel="stylesheet" href="..."> as <link rel="preload" as="style" ...>
// No other changes.

var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);

function readAll(p){ var t=fso.OpenTextFile(p,1); var s=t.ReadAll(); t.Close(); return s; }
function writeAll(p,s){ var t=fso.OpenTextFile(p,2,true); t.Write(s); t.Close(); }
function esc(s){ return s.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'); }

var html = readAll(filePath);
var orig = html;
var changes = [];

// 1) Inline no-srcset.js (any path that ends with no-srcset.js)
html = html.replace(/<script\b([^>]*?)src\s*=\s*"([^"]*no-srcset\.js[^"]*)"(.*?)><\/script>/gi, function(m, pre, src, post){
  changes.push("inlined no-srcset.js");
  return '<script>!function(){try{Object.defineProperty(HTMLImageElement.prototype,"srcset",{set:function(v){},get:function(){return""}})}catch(e){}}();</script>';
});

// 2) Preload first stylesheet (idempotent)
var m = html.match(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/i);
if (m){
  var href = m[1];
  var exists = new RegExp('<link[^>]+rel=["\\\']preload["\\\'][^>]+as=["\\\']style["\\\'][^>]+href=["\\\']'+esc(href)+'["\\\']','i').test(html);
  if (!exists){
    var preloadTag = '  <link rel="preload" as="style" href="'+href+'">';
    if (/<head[^>]*>/i.test(html)){
      html = html.replace(/<head[^>]*>/i, function(head){ return head + "\r\n" + preloadTag; });
    } else {
      html = preloadTag + "\r\n" + html;
    }
    changes.push("preloaded first stylesheet");
  }
}

if (html !== orig){
  writeAll(filePath, html);
  WScript.Echo("  Changes: " + changes.join("; "));
} else {
  WScript.Echo("  Changes: none");
}
