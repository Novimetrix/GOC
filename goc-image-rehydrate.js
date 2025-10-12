// goc-image-rehydrate.js — WSH JScript (legacy-safe)
var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);
function readAll(p){ var t=fso.OpenTextFile(p,1); var s=t.ReadAll(); t.Close(); return s; }
function writeAll(p,s){ var t=fso.OpenTextFile(p,2,true); t.Write(s); t.Close(); }

var html = readAll(filePath);
var orig = html;
var changed = false;

// Remove any global no-srcset guards (external or inline)
html = html.replace(/<script\b[^>]*src\s*=\s*"[^"]*no-srcset\.js[^"]*"\s*><\/script>/gi, function(){ changed = true; return ""; });
html = html.replace(/<script>[^<]*HTMLImageElement\.prototype[^<]*srcset[^<]*<\/script>/gi, function(){ changed = true; return ""; });

// Remove our previous "GOC Image Rehydrate Runtime" if present
html = html.replace(/<script>\s*\/\* GOC Image Rehydrate Runtime v1 \*\/[\s\S]*?<\/script>/gi, function(){ changed = true; return ""; });

// Inject runtime just before </head>, or after <head>, or at top
var block = "<script>\n/* GOC Image Rehydrate Runtime v1 */\n(function(){\n  function firstFromSet(s){\n    if(!s) return null;\n    var parts = s.split(',');\n    for (var i=0;i<parts.length;i++){\n      var u = parts[i].replace(/^\\s+|\\s+$/g,'').split(/\\s+/)[0];\n      if (u) return u;\n    }\n    return null;\n  }\n  function applyDataAttrsToImg(img){\n    var ds = img.getAttribute('data-src') || img.getAttribute('datasrc');\n    var dss = img.getAttribute('data-srcset') || img.getAttribute('imagesrcset') || img.getAttribute('data-src-set');\n    var dsz = img.getAttribute('data-sizes') || img.getAttribute('datasizes');\n    if (ds && !img.getAttribute('src')) img.setAttribute('src', ds);\n    if (dss && !img.getAttribute('srcset')) img.setAttribute('srcset', dss);\n    if (dsz && !img.getAttribute('sizes')) img.setAttribute('sizes', dsz);\n  }\n  function applyDataAttrsToSource(source){\n    var dss = source.getAttribute('data-srcset') || source.getAttribute('imagesrcset') || source.getAttribute('data-src-set');\n    var dsz = source.getAttribute('data-sizes') || source.getAttribute('datasizes');\n    if (dss && !source.getAttribute('srcset')) source.setAttribute('srcset', dss);\n    if (dsz && !source.getAttribute('sizes')) source.setAttribute('sizes', dsz);\n  }\n  function ensureImgSrcFromPicture(pic){\n    var img = pic.getElementsByTagName('img')[0];\n    if (!img) return;\n    var src = img.getAttribute('src');\n    if (src && !/^\\s*$/.test(src) && !/placeholder|transparent\\.png|\\.svg$/i.test(src)) return;\n    var sources = pic.getElementsByTagName('source');\n    for (var i=0;i<sources.length;i++){\n      var s = sources[i].getAttribute('srcset') || sources[i].getAttribute('data-srcset') || sources[i].getAttribute('imagesrcset');\n      var u = firstFromSet(s);\n      if (u){\n        img.setAttribute('src', u);\n        return;\n      }\n    }\n    // fallback: its own srcset\n    var uu = firstFromSet(img.getAttribute('srcset') || img.getAttribute('data-srcset') || img.getAttribute('imagesrcset'));\n    if (uu) img.setAttribute('src', uu);\n  }\n  function run(){\n    // 1) Promote data-* to real attrs\n    var imgs = document.getElementsByTagName('img');\n    for (var i=0;i<imgs.length;i++){ applyDataAttrsToImg(imgs[i]); }\n    var sources = document.getElementsByTagName('source');\n    for (var j=0;j<sources.length;j++){ applyDataAttrsToSource(sources[j]); }\n    // 2) Ensure picture has img src fallback\n    var pics = document.getElementsByTagName('picture');\n    for (var k=0;k<pics.length;k++){ ensureImgSrcFromPicture(pics[k]); }\n  }\n  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', run); }\n  else { run(); }\n})();\n</script>";
if (/<\/head>/i.test(html)){
  html = html.replace(/<\/head>/i, function(m){ changed = true; return block + "\\r\\n" + m; });
} else if (/<head[^>]*>/i.test(html)){
  html = html.replace(/<head[^>]*>/i, function(m){ changed = true; return m + "\\r\\n" + block; });
} else {
  html = block + "\\r\\n" + html; changed = true;
}

if (changed){
  writeAll(filePath, html);
  WScript.Echo("  Changes: injected image rehydrate runtime");
} else {
  WScript.Echo("  Changes: none");
}
