// goc-perf-only-v2.1.js — Performance-only tweaks, IMAGE LOGIC UNTOUCHED
// Safe for legacy WSH (no ES6).
// Actions:
//  1) Add <meta name="viewport"> if missing.
//  2) Add decoding="async" to <img> when missing (don't change loading/src/srcset/sizes).
//  3) Add defer to external <script src> that don't already have async/defer/type=module and aren't marked data-critical="true".
//  4) Add <link rel="preconnect"> + <link rel="dns-prefetch"> for up to 4 external origins discovered in src/href/srcset.
// Note: We DO NOT add/remove lazy-loading or touch src/srcset/sizes at all.

var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);
var html = fso.OpenTextFile(filePath, 1).ReadAll();

function unique(arr) {
  var o = {}, out = [], i;
  for (i=0;i<arr.length;i++) {
    if (!o[arr[i]]) { o[arr[i]]=1; out.push(arr[i]); }
  }
  return out;
}

function extractOrigins(s) {
  var out = [];
  var re = /(?:src|href|content)\s*=\s*"([^"]+)"/gi, m;
  while ((m = re.exec(s)) !== null) {
    var url = m[1];
    if (/^https?:\/\//i.test(url)) {
      var match = url.match(/^(https?:\/\/[^\/]+)/i);
      if (match) out.push(match[1]);
    }
  }
  var rs = /srcset\s*=\s*"([^"]+)"/gi, ms;
  while ((ms = rs.exec(s)) !== null) {
    var list = ms[1].split(',');
    for (var i=0;i<list.length;i++) {
      var part = list[i].replace(/^\s+|\s+$/g, '');
      var u = part.split(/\s+/)[0];
      if (/^https?:\/\//i.test(u)) {
        var m2 = u.match(/^(https?:\/\/[^\/]+)/i);
        if (m2) out.push(m2[1]);
      }
    }
  }
  return unique(out);
}

function hasViewport(h) {
  return /<meta\s+name=["']viewport["'][^>]*>/i.test(h);
}

function injectViewport(h) {
  var tag = '<meta name="viewport" content="width=device-width, initial-scale=1">';
  if (/<head[^>]*>/i.test(h)) {
    return h.replace(/<head[^>]*>/i, function(m){ return m + "\n  " + tag; });
  } else {
    return tag + "\n" + h;
  }
}

function addImgDecoding(h) {
  return h.replace(/<img\b([^>]*?)>/gi, function(m, a){
    if (/\bdecoding\s*=/.test(a)) return m;
    return "<img" + a + ' decoding="async">';
  });
}

function addDeferToScripts(h) {
  return h.replace(/<script\b([^>]*?)><\/script>/gi, function(m, a){
    if (!/\ssrc\s*=/.test(a)) return m;
    if (/\b(async|defer)\b/i.test(a)) return m;
    if (/\btype\s*=\s*["']module["']/i.test(a)) return m;
    if (/\bdata-critical\s*=\s*["']true["']/i.test(a)) return m;
    return "<script" + a + " defer></script>";
  });
}

function addResourceHints(h) {
  var origins = extractOrigins(h);
  var headAdded = "";
  var count = 0;
  for (var i=0; i<origins.length && count < 4; i++) {
    var o = origins[i];
    var exists = new RegExp('<link[^>]+(preconnect|dns-prefetch)[^>]+href=[\"\\']'+o.replace(/[-/\\^$*+?.()|[\\]{}]/g,'\\$&')+'[\"\\']', 'i').test(h);
    if (exists) continue;
    headAdded += '  <link rel="preconnect" href="'+o+'" crossorigin>\n';
    headAdded += '  <link rel="dns-prefetch" href="'+o+'">\n';
    count++;
  }
  if (!headAdded) return h;
  if (/<head[^>]*>/i.test(h)) {
    return h.replace(/<head[^>]*>/i, function(m){ return m + "\n" + headAdded; });
  } else {
    return headAdded + h;
  }
}

function patch(html) {
  var out = html;
  if (!hasViewport(out)) out = injectViewport(out);
  out = addImgDecoding(out);
  out = addDeferToScripts(out);
  out = addResourceHints(out);
  return out;
}

var output = patch(html);
var file = fso.OpenTextFile(filePath, 2, true);
file.Write(output);
file.Close();
