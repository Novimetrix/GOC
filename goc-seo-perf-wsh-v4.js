// goc-seo-perf-wsh-v4.js — PERF + MOBILE/TABLET IMAGE FIX (WSH, no PowerShell/Node)
// - Preserves srcset/sizes
// - Converts lazy attrs to real: data-src -> src, data-srcset/imagesrcset -> srcset, data-sizes -> sizes
// - Handles <picture><source ...> too (mobile/tablet fix)
// - If <img> has srcset but no src, set src to first candidate from srcset for fallback
// - Adds loading/decoding (hero eager/high; others lazy/async)
// - Fixes localhost/127 URLs, injects canonical + description, writes robots/sitemap
// Run: cscript //nologo goc-seo-perf-wsh-v4.js

(function () {
  var fso   = new ActiveXObject("Scripting.FileSystemObject");
  var root  = fso.GetAbsolutePathName(".");
  var domain = "https://greenoceanconsultants.com";
  var desc = "GOC provides businesses with exceptional customer experiences through reliable, efficient, and human-centered phone and chat support.";

  function log(s){ WScript.Echo(s); }

  // UTF-8 helpers
  function loadUtf8(path){
    var s = new ActiveXObject("ADODB.Stream");
    s.Type = 2; s.Charset = "utf-8"; s.Open(); s.LoadFromFile(path);
    var txt = s.ReadText(); s.Close(); return txt;
  }
  function saveUtf8(path, txt){
    var s = new ActiveXObject("ADODB.Stream"); s.Type = 2; s.Charset = "utf-8"; s.Open();
    s.WriteText(txt); s.Position = 0;
    var b = new ActiveXObject("ADODB.Stream"); b.Type = 1; b.Open(); s.CopyTo(b);
    b.SaveToFile(path, 2); b.Close(); s.Close();
  }

  function relWebPath(absPath){
    var p = absPath.replace(/\//g,"\\"); if (p.indexOf(root)===0) p = p.substring(root.length);
    p = p.replace(/^\\+/, "").replace(/\\/g,"/");
    if (/\/index\.html$/i.test(p)) p = p.replace(/\/index\.html$/i, "/");
    if (p.charAt(0) !== "/") p = "/" + p;
    return p;
  }
  function canonicalFor(absPath){ return domain + relWebPath(absPath); }

  // Patterns
  var reLocalHost = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/[^"' \t>]*?)?/gi;
  var reHeadOpen  = /<head\b([^>]*)>/i;
  var reCanonFind = /<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i;
  var reDescFind  = /<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i;
  var reImgTag    = /<img\b[^>]*>/ig;
  var reSourceTag = /<source\b[^>]*>/ig;

  function fixLocalhostUrls(html){
    return html.replace(reLocalHost, function(_, path){ return path ? path : "/"; });
  }

  // Attribute helpers (generic for img/source)
  function hasAttr(tag, name){
    return new RegExp('\\b' + name + '\\s*=', 'i').test(tag);
  }
  function getAttr(tag, name){
    var m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"', 'i'));
    if (m) return m[1];
    m = tag.match(new RegExp(name + "\\s*=\\s*'([^']*)'", 'i'));
    if (m) return m[1];
    m = tag.match(new RegExp(name + '\\s*=\\s*([^\\s>]+)', 'i'));
    return m ? m[1] : "";
  }
  function removeAttr(tag, name){
    var re1 = new RegExp('\\s+' + name + '\\s*=\\s*"[^"]*"', 'ig');
    var re2 = new RegExp("\\s+" + name + "\\s*=\\s*'[^']*'", 'ig');
    var re3 = new RegExp('\\s+' + name + '\\s*=\\s*[^\\s>]+', 'ig');
    return tag.replace(re1, '').replace(re2, '').replace(re3, '');
  }
  function setAttrGeneric(tag, tagName, name, value){
    var reHas = new RegExp('\\b' + name + '\\s*=', 'i');
    if (reHas.test(tag)){
      // replace value
      var reVal1 = new RegExp(name + '\\s*=\\s*"[^"]*"', 'i');
      var reVal2 = new RegExp(name + "\\s*=\\s*'[^']*'", 'i');
      var reVal3 = new RegExp(name + '\\s*=\\s*[^\\s>]+', 'i');
      if (reVal1.test(tag)) return tag.replace(reVal1, name + '="' + value + '"');
      if (reVal2.test(tag)) return tag.replace(reVal2, name + '="' + value + '"');
      return tag.replace(reVal3, name + '="' + value + '"');
    } else {
      // insert after tag name
      return tag.replace(new RegExp('^<' + tagName + '\\b', 'i'), '<' + tagName + ' ' + name + '="' + value + '"');
    }
  }
  function setImgAttr(tag, name, value){ return setAttrGeneric(tag, 'img', name, value); }
  function setSourceAttr(tag, name, value){ return setAttrGeneric(tag, 'source', name, value); }

  function firstSrcFromSrcset(srcset){
    // pick first URL (before first comma), then first token before whitespace
    if (!srcset) return "";
    var first = srcset.split(',')[0] || "";
    var url = first.trim().split(/\s+/)[0] || "";
    return url;
  }

  function patchHead(html, absPath){
    var canonLine = '  <link rel="canonical" href="' + canonicalFor(absPath) + '" />';
    if (reCanonFind.test(html)) html = html.replace(reCanonFind, canonLine);
    else html = html.replace(reHeadOpen, function(m,g1){ return "<head"+g1+">\r\n"+canonLine; });

    var descLine = '  <meta name="description" content="' + desc.replace(/"/g,'&quot;') + '" />';
    if (reDescFind.test(html)) html = html.replace(reDescFind, descLine);
    else html = html.replace(reHeadOpen, function(m,g1){ return "<head"+g1+">\r\n"+descLine; });

    return html;
  }

  function patchImages(html){
    // First, fix <source> tags inside <picture>
    html = html.replace(reSourceTag, function(tag){
      var t = tag;
      if (hasAttr(t, 'data-srcset')) {
        var v = getAttr(t, 'data-srcset');
        t = removeAttr(t, 'data-srcset');
        t = setSourceAttr(t, 'srcset', v);
      }
      if (hasAttr(t, 'imagesrcset') && !hasAttr(t, 'srcset')) {
        var v2 = getAttr(t, 'imagesrcset');
        t = removeAttr(t, 'imagesrcset');
        t = setSourceAttr(t, 'srcset', v2);
      } else {
        t = removeAttr(t, 'imagesrcset');
      }
      if (hasAttr(t, 'data-sizes')) {
        var v3 = getAttr(t, 'data-sizes');
        t = removeAttr(t, 'data-sizes');
        t = setSourceAttr(t, 'sizes', v3);
      }
      return t;
    });

    // Then, fix <img> tags
    var idx = 0;
    html = html.replace(reImgTag, function(tag){
      var t = tag;

      // Convert lazy data-* to real
      if (!hasAttr(t, 'src') && hasAttr(t, 'data-src')) {
        var v = getAttr(t, 'data-src');
        t = removeAttr(t, 'data-src');
        t = setImgAttr(t, 'src', v);
      } else if (hasAttr(t, 'data-src')) {
        t = removeAttr(t, 'data-src');
      }
      if (hasAttr(t, 'data-srcset')) {
        var v2 = getAttr(t, 'data-srcset');
        t = removeAttr(t, 'data-srcset');
        t = setImgAttr(t, 'srcset', v2);
      }
      if (hasAttr(t, 'imagesrcset') && !hasAttr(t, 'srcset')) {
        var v3 = getAttr(t, 'imagesrcset');
        t = removeAttr(t, 'imagesrcset');
        t = setImgAttr(t, 'srcset', v3);
      } else {
        t = removeAttr(t, 'imagesrcset');
      }
      if (hasAttr(t, 'data-sizes')) {
        var v4 = getAttr(t, 'data-sizes');
        t = removeAttr(t, 'data-sizes');
        t = setImgAttr(t, 'sizes', v4);
      }

      // If img has srcset but no src, set src from first srcset candidate (fallback)
      if (!hasAttr(t, 'src') && hasAttr(t, 'srcset')) {
        var ss = getAttr(t, 'srcset');
        var url = firstSrcFromSrcset(ss);
        if (url) t = setImgAttr(t, 'src', url);
      }

      // Perf hints
      if (idx === 0) {
        t = setImgAttr(t, 'loading', 'eager');
        t = setImgAttr(t, 'fetchpriority', 'high');
      } else {
        t = setImgAttr(t, 'loading', 'lazy');
      }
      t = setImgAttr(t, 'decoding', 'async');

      idx++;
      return t;
    });

    return html;
  }

  function patchHtml(absPath){
    var html = loadUtf8(absPath);
    html = fixLocalhostUrls(html);
    html = patchHead(html, absPath);
    html = patchImages(html);
    saveUtf8(absPath, html);
    log("Patched: " + absPath);
  }

  function walkAndPatch(folderPath){
    var folder = fso.GetFolder(folderPath);
    var e = new Enumerator(folder.Files);
    for (; !e.atEnd(); e.moveNext()){
      var file = e.item();
      if (/\.html?$/i.test(file.Name)){
        patchHtml(file.Path);
      }
    }
    var sf = new Enumerator(folder.SubFolders);
    for (; !sf.atEnd(); sf.moveNext()){
      var sub = sf.item();
      if (/\\backup_html_before_scrub(\\|$)/i.test("\\"+sub.Path.replace(/\//g,"\\"))) continue;
      walkAndPatch(sub.Path);
    }
  }

  // robots + sitemap
  var robotsPath = fso.BuildPath(root, "robots.txt");
  var robotsTxt = "User-agent: *\r\nAllow: /\r\n\r\nSitemap: " + domain + "/sitemap.xml\r\n";
  saveUtf8(robotsPath, robotsTxt);

  var sitemapPath = fso.BuildPath(root, "sitemap.xml");
  if (!fso.FileExists(sitemapPath)){
    var sm = '<?xml version="1.0" encoding="UTF-8"?>\r\n' +
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\r\n' +
             '  <url>\r\n' +
             '    <loc>' + domain + '/</loc>\r\n' +
             '    <priority>1.00</priority>\r\n' +
             '    <changefreq>weekly</changefreq>\r\n' +
             '  </url>\r\n' +
             '</urlset>\r\n';
    saveUtf8(sitemapPath, sm);
  }

  WScript.Echo("Patching HTML (perf + mobile fix v4)...");
  walkAndPatch(root);
  WScript.Echo("Done.");
})();