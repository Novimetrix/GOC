/ goc-perf-addons-v1d.js — legacy JScript (WSH), images untouched
/ Safe tweaks only: viewport, preconnect/dns-prefetch, and async analytics scripts.
/ DOES NOT touch <img>, <picture>, src/srcset/sizes, or lazy scripts.

var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);
var html = fso.OpenTextFile(filePath, 1).ReadAll();

function unique(arr){
  var o = {}, out = [], i;
  for(i=0;i<arr.length;i++){ if(!o[arr[i]]){ o[arr[i]]=1; out.push(arr[i]); } }
  return out;
}

function hasViewport(h){ return /<meta\s+name=["']viewport["'][^>]*>/i.test(h); }
function injectViewport(h){
  var tag = '<meta name="viewport" content="width=device-width, initial-scale=1">';
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, function(m){ return m + "\r\n  " + tag; });
  return tag + "\r\n" + h;
}

/ Add preconnect/dns-prefetch to up to 4 external origins already used
function addResourceHints(h){
  var origins = [];
  var m, re = /(?:src|href|content)\s*=\s*"([^"]+)"/gi;
  while ((m = re.exec(h)) !== null){
    var url = m[1];
    if (/^https?:\/\/i.test(url)){
      var mm = url.match(/^(https?:\/\/[^\/]+)/i);
      if (mm) origins.push(mm[1]);
    }
  }
  / also from srcset
  var rs, re2 = /srcset\s*=\s*"([^"]+)"/gi;
  while ((rs = re2.exec(h)) !== null){
    var parts = rs[1].split(',');
    for (var i=0;i<parts.length;i++){
      var p = parts[i].replace(/^\s+|\s+$/g,'');
      var u = p.split(/\s+/)[0];
      if (/^https?:\/\/i.test(u)){
        var m3 = u.match(/^(https?:\/\/[^\/]+)/i);
        if (m3) origins.push(m3[1]);
      }
    }
  }
  origins = unique(origins);
  var add = "", count=0;
  for (var j=0;j<origins.length && count<4;j++){
    var o = origins[j];
    var esc = o.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&');
    var exists = new RegExp('<link[^>]+(preconnect|dns-prefetch)[^>]+href=["\\']'+esc+'["\\']','i').test(h);
    if (exists) continue;
    add += '  <link rel="preconnect" href="'+o+'" crossorigin>\r\n';
    add += '  <link rel="dns-prefetch" href="'+o+'">\r\n';
    count++;
  }
  if (!add) return h;
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, function(m){ return m + "\r\n" + add; });
  return add + h;
}

/ Make known analytics/metrics scripts async (safe). Skip maps/lazy/jquery/custom guards.
function asyncAnalytics(h){
  return h.replace(/<script\b([^>]*)><\/script>/gi, function(m, a){
    if (!/\ssrc\s*=/i.test(a)) return m;
    if (/\b(async|defer)\b/i.test(a)) return m;
    if (/\btype\s*=\s*["']module["']/i.test(a)) return m;
    / get src
    var src = (a.match(/\ssrc\s*=\s*"([^"]+)"/i) || ["",""])[1];
    if (!src) return m;
    / skip risky ones
    if (/maps\.google|google\.(?:apis|com)\/maps/i.test(src)) return m;
    if (/lazy|lazysizes|no-srcset|jquery/i.test(src)) return m;
    / analytics list
    if (/(googletagmanager|google-analytics|gtag\/js|doubleclick|hotjar|clarity|plausible|segment|statcounter|umami|matomo|facebook|connect\.facebook|t\.co|adsystem)/i.test(src)){
      return "<script" + a + " async></script>";
    }
    return m;
  });
}

function trace(h){
  if (/GOC Perf Add-ons v1d/i.test(h)) return h;
  if (/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, function(m){ return m + '\r\n  <!-- GOC Perf Add-ons v1d: viewport + preconnect + async analytics; images untouched -->'; });
  return '<!-- GOC Perf Add-ons v1d: viewport + preconnect + async analytics; images untouched -->\r\n' + h;
}

function patch(h){
  var out = h;
  if (!hasViewport(out)) out = injectViewport(out);
  out = addResourceHints(out);
  out = asyncAnalytics(out);
  out = trace(out);
  return out;
}

var output = patch(html);
var f = fso.OpenTextFile(filePath, 2, true);
f.Write(output);
f.Close();
