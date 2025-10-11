// goc-ultrasafe-plus.js — WSH JScript (legacy-safe)
var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);

function readAll(p){ var t=fso.OpenTextFile(p,1); var s=t.ReadAll(); t.Close(); return s; }
function writeAll(p,s){ var t=fso.OpenTextFile(p,2,true); t.Write(s); t.Close(); }
function esc(s){ return s.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'); }

var html = readAll(filePath);
var orig = html;
var changes = [];

// 1) Inline any external no-srcset.js
html = html.replace(/<script\b([^>]*?)src\s*=\s*"([^"]*no-srcset\.js[^"]*)"(.*?)><\/script>/gi, function(m){
  changes.push("inlined no-srcset.js");
  return '<script>!function(){try{Object.defineProperty(HTMLImageElement.prototype,"srcset",{set:function(v){},get:function(){return""}})}catch(e){}}();</script>';
});

// 2) Preload EVERY stylesheet (max 8), keep existing links, avoid duplicates
var cssHrefs = [];
var re = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, m;
while ((m = re.exec(html)) !== null){
  cssHrefs.push(m[1]);
}
// unique
var seen = {}, hrefs = [];
for (var i=0;i<cssHrefs.length;i++){ if(!seen[cssHrefs[i]]){ seen[cssHrefs[i]]=1; hrefs.push(cssHrefs[i]); } }
var inserts = "", added = 0;
for (var j=0;j<hrefs.length && added<8;j++){
  var href = hrefs[j];
  var exists = new RegExp('<link[^>]+rel=["\\\']preload["\\\'][^>]+as=["\\\']style["\\\'][^>]+href=["\\\']'+esc(href)+'["\\\']','i').test(html);
  if (exists) continue;
  inserts += '  <link rel="preload" as="style" href="'+href+'">\\r\\n';
  added++;
}
if (inserts){
  if (/<head[^>]*>/i.test(html)){
    html = html.replace(/<head[^>]*>/i, function(head){ return head + "\\r\\n" + inserts; });
  } else {
    html = inserts + html;
  }
  changes.push("preloaded "+added+" stylesheet(s)");
}

// Trace comment
if (!/GOC UltraSafe\+/i.test(html)){
  html = html.replace(/<head[^>]*>/i, function(m){ return m + "\\r\\n  <!-- GOC UltraSafe+ v1: inlined no-srcset + preload all CSS -->"; });
}

if (html !== orig){
  writeAll(filePath, html);
  WScript.Echo("  Changes: " + (changes.length ? changes.join("; ") : "none"));
} else {
  WScript.Echo("  Changes: none");
}
