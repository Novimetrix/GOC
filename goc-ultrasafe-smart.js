// goc-ultrasafe-smart.js — WSH JScript (legacy-safe)
var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);

function readAll(p){ var t=fso.OpenTextFile(p,1); var s=t.ReadAll(); t.Close(); return s; }
function writeAll(p,s){ var t=fso.OpenTextFile(p,2,true); t.Write(s); t.Close(); }
function esc(s){ return s.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'); }

var html = readAll(filePath);
var orig = html;
var changes = [];

// 0) Remove any global no-srcset prototype-override (external or inline)
html = html.replace(/<script\b[^>]*src\s*=\s*"[^"]*no-srcset\.js[^"]*"\s*><\/script>/gi, function(){ changes.push("removed external no-srcset"); return ""; });
html = html.replace(/<script>[^<]*HTMLImageElement\.prototype[^<]*srcset[^<]*<\/script>/gi, function(){ changes.push("removed inline no-srcset"); return ""; });

// 1) Inject SMART inline fixer (idempotent)
if (!/GOC UltraSafe SMART v1/i.test(html)){
  if (/<\/head>/i.test(html)){
    html = html.replace(/<\/head>/i, function(m){ changes.push("injected SMART fixer"); return "<script>\n/* GOC UltraSafe SMART v1 -- repair-only */\n(function(){\n  function firstFromSet(str){\n    if(!str) return null;\n    var parts = str.split(',');\n    for (var i=0;i<parts.length;i++){\n      var u = parts[i].replace(/^\\s+|\\s+$/g,'').split(/\\s+/)[0];\n      if (u) return u;\n    }\n    return null;\n  }\n  function fixImg(img){\n    try{\n      var src = img.getAttribute('src')||'';\n      var ss  = img.getAttribute('srcset')||'';\n      // only intervene if src is empty/placeholder and srcset exists\n      if ((src==='' || /^\\s*$/.test(src) || /placeholder|transparent\\.png|\\.svg$/i.test(src)) && ss){\n        var u = firstFromSet(ss);\n        if (u){\n          img.setAttribute('src', u);\n          img.removeAttribute('srcset');\n          img.removeAttribute('sizes');\n        }\n      }\n    }catch(e){}\n  }\n  function fixPicture(pic){\n    try{\n      var img = pic.getElementsByTagName('img')[0];\n      if (!img) return;\n      var hasSrc = (img.getAttribute('src')||'').replace(/^\\s+|\\s+$/g,'') !== '';\n      if (hasSrc && !/placeholder|transparent\\.png|\\.svg$/i.test(img.getAttribute('src'))) return;\n      var sources = pic.getElementsByTagName('source');\n      for (var i=0;i<sources.length;i++){\n        var u = firstFromSet(sources[i].getAttribute('srcset'));\n        if (u){\n          img.setAttribute('src', u);\n          img.removeAttribute('srcset'); img.removeAttribute('sizes');\n          for (var j=0;j<sources.length;j++){\n            sources[j].removeAttribute('srcset');\n            sources[j].removeAttribute('sizes');\n          }\n          return;\n        }\n      }\n      // fallback to img's own srcset, if present\n      var uu = firstFromSet(img.getAttribute('srcset'));\n      if (uu){\n        img.setAttribute('src', uu);\n        img.removeAttribute('srcset'); img.removeAttribute('sizes');\n      }\n    }catch(e){}\n  }\n  function run(){\n    var pics = document.getElementsByTagName('picture');\n    for (var i=0;i<pics.length;i++){ fixPicture(pics[i]); }\n    var imgs = document.getElementsByTagName('img');\n    for (var j=0;j<imgs.length;j++){ fixImg(imgs[j]); }\n  }\n  if (document.readyState === 'loading'){\n    document.addEventListener('DOMContentLoaded', run);\n  } else {\n    run();\n  }\n})();\n</script>" + "\\r\\n" + m; });
  } else if (/<head[^>]*>/i.test(html)){
    html = html.replace(/<head[^>]*>/i, function(m){ changes.push("injected SMART fixer"); return m + "\\r\\n" + "<script>\n/* GOC UltraSafe SMART v1 -- repair-only */\n(function(){\n  function firstFromSet(str){\n    if(!str) return null;\n    var parts = str.split(',');\n    for (var i=0;i<parts.length;i++){\n      var u = parts[i].replace(/^\\s+|\\s+$/g,'').split(/\\s+/)[0];\n      if (u) return u;\n    }\n    return null;\n  }\n  function fixImg(img){\n    try{\n      var src = img.getAttribute('src')||'';\n      var ss  = img.getAttribute('srcset')||'';\n      // only intervene if src is empty/placeholder and srcset exists\n      if ((src==='' || /^\\s*$/.test(src) || /placeholder|transparent\\.png|\\.svg$/i.test(src)) && ss){\n        var u = firstFromSet(ss);\n        if (u){\n          img.setAttribute('src', u);\n          img.removeAttribute('srcset');\n          img.removeAttribute('sizes');\n        }\n      }\n    }catch(e){}\n  }\n  function fixPicture(pic){\n    try{\n      var img = pic.getElementsByTagName('img')[0];\n      if (!img) return;\n      var hasSrc = (img.getAttribute('src')||'').replace(/^\\s+|\\s+$/g,'') !== '';\n      if (hasSrc && !/placeholder|transparent\\.png|\\.svg$/i.test(img.getAttribute('src'))) return;\n      var sources = pic.getElementsByTagName('source');\n      for (var i=0;i<sources.length;i++){\n        var u = firstFromSet(sources[i].getAttribute('srcset'));\n        if (u){\n          img.setAttribute('src', u);\n          img.removeAttribute('srcset'); img.removeAttribute('sizes');\n          for (var j=0;j<sources.length;j++){\n            sources[j].removeAttribute('srcset');\n            sources[j].removeAttribute('sizes');\n          }\n          return;\n        }\n      }\n      // fallback to img's own srcset, if present\n      var uu = firstFromSet(img.getAttribute('srcset'));\n      if (uu){\n        img.setAttribute('src', uu);\n        img.removeAttribute('srcset'); img.removeAttribute('sizes');\n      }\n    }catch(e){}\n  }\n  function run(){\n    var pics = document.getElementsByTagName('picture');\n    for (var i=0;i<pics.length;i++){ fixPicture(pics[i]); }\n    var imgs = document.getElementsByTagName('img');\n    for (var j=0;j<imgs.length;j++){ fixImg(imgs[j]); }\n  }\n  if (document.readyState === 'loading'){\n    document.addEventListener('DOMContentLoaded', run);\n  } else {\n    run();\n  }\n})();\n</script>"; });
  } else {
    html = "<script>\n/* GOC UltraSafe SMART v1 -- repair-only */\n(function(){\n  function firstFromSet(str){\n    if(!str) return null;\n    var parts = str.split(',');\n    for (var i=0;i<parts.length;i++){\n      var u = parts[i].replace(/^\\s+|\\s+$/g,'').split(/\\s+/)[0];\n      if (u) return u;\n    }\n    return null;\n  }\n  function fixImg(img){\n    try{\n      var src = img.getAttribute('src')||'';\n      var ss  = img.getAttribute('srcset')||'';\n      // only intervene if src is empty/placeholder and srcset exists\n      if ((src==='' || /^\\s*$/.test(src) || /placeholder|transparent\\.png|\\.svg$/i.test(src)) && ss){\n        var u = firstFromSet(ss);\n        if (u){\n          img.setAttribute('src', u);\n          img.removeAttribute('srcset');\n          img.removeAttribute('sizes');\n        }\n      }\n    }catch(e){}\n  }\n  function fixPicture(pic){\n    try{\n      var img = pic.getElementsByTagName('img')[0];\n      if (!img) return;\n      var hasSrc = (img.getAttribute('src')||'').replace(/^\\s+|\\s+$/g,'') !== '';\n      if (hasSrc && !/placeholder|transparent\\.png|\\.svg$/i.test(img.getAttribute('src'))) return;\n      var sources = pic.getElementsByTagName('source');\n      for (var i=0;i<sources.length;i++){\n        var u = firstFromSet(sources[i].getAttribute('srcset'));\n        if (u){\n          img.setAttribute('src', u);\n          img.removeAttribute('srcset'); img.removeAttribute('sizes');\n          for (var j=0;j<sources.length;j++){\n            sources[j].removeAttribute('srcset');\n            sources[j].removeAttribute('sizes');\n          }\n          return;\n        }\n      }\n      // fallback to img's own srcset, if present\n      var uu = firstFromSet(img.getAttribute('srcset'));\n      if (uu){\n        img.setAttribute('src', uu);\n        img.removeAttribute('srcset'); img.removeAttribute('sizes');\n      }\n    }catch(e){}\n  }\n  function run(){\n    var pics = document.getElementsByTagName('picture');\n    for (var i=0;i<pics.length;i++){ fixPicture(pics[i]); }\n    var imgs = document.getElementsByTagName('img');\n    for (var j=0;j<imgs.length;j++){ fixImg(imgs[j]); }\n  }\n  if (document.readyState === 'loading'){\n    document.addEventListener('DOMContentLoaded', run);\n  } else {\n    run();\n  }\n})();\n</script>" + "\\r\\n" + html; changes.push("injected SMART fixer (top)");
  }
}

// 2) Preload EVERY stylesheet (max 8), keep existing links
var cssHrefs = [];
var re = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, m;
while ((m = re.exec(html)) !== null){ cssHrefs.push(m[1]); }
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
  if (added>0) changes.push("preloaded "+added+" stylesheet(s)");
}

if (html !== orig){
  writeAll(filePath, html);
  WScript.Echo("  Changes: " + (changes.length ? changes.join("; ") : "none"));
} else {
  WScript.Echo("  Changes: none");
}
