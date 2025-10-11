// goc-seo-perf-wsh-v3.js — PERF + MOBILE FIX (WSH, safer regex)
// Run: cscript //nologo goc-seo-perf-wsh-v3.js

(function () {
  var fso   = new ActiveXObject("Scripting.FileSystemObject");
  var root  = fso.GetAbsolutePathName(".");
  var domain = "https://greenoceanconsultants.com";
  var desc = "GOC provides businesses with exceptional customer experiences through reliable, efficient, and human-centered phone and chat support.";

  function log(s){ WScript.Echo(s); }

  // UTF-8 load/save
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

  var reLocalHost = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/[^"' \t>]*?)?/gi;
  var reHeadOpen  = /<head\b([^>]*)>/i;
  var reCanonFind = /<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i;
  var reDescFind  = /<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i;
  var reImgTag    = /<img\b[^>]*>/ig;

  function fixLocalhostUrls(html){
    return html.replace(reLocalHost, function(_, path){ return path ? path : "/"; });
  }

  // Attribute helpers (avoid nested-quote regex pitfalls)
  function hasAttr(tag, name){
    var re = new RegExp('\\b' + name + '\\s*=', 'i');
    return re.test(tag);
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
    tag = tag.replace(re1, '').replace(re2, '').replace(re3, '');
    return tag;
  }
  function setAttr(tag, name, value){
    tag = removeAttr(tag, name);
    return tag.replace(/^<img\b/i, '<img ' + name + '="' + value + '"');
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
    var idx = 0;
    return html.replace(reImgTag, function(tag){
      var t = tag;

      // Convert lazy data-* to real responsive attributes
      if (!hasAttr(t, 'src') && hasAttr(t, 'data-src')) {
        var v = getAttr(t, 'data-src');
        t = setAttr(t, 'src', v);
      } else if (hasAttr(t, 'data-src')) {
        // if both present, prefer explicit src; just drop data-src
        t = removeAttr(t, 'data-src');
      }
      if (hasAttr(t, 'data-srcset')) {
        var v2 = getAttr(t, 'data-srcset');
        t = setAttr(t, 'srcset', v2);
      }
      if (hasAttr(t, 'imagesrcset') && !hasAttr(t, 'srcset')) {
        var v3 = getAttr(t, 'imagesrcset');
        t = setAttr(t, 'srcset', v3);
      }
      if (hasAttr(t, 'data-sizes')) {
        var v4 = getAttr(t, 'data-sizes');
        t = setAttr(t, 'sizes', v4);
      }
      // Clean leftover lazy attrs
      t = removeAttr(t, 'imagesrcset');
      t = removeAttr(t, 'data-srcset');
      t = removeAttr(t, 'data-sizes');

      // Hero vs below-the-fold
      if (idx === 0) {
        t = setAttr(t, 'loading', 'eager');
        t = setAttr(t, 'fetchpriority', 'high');
      } else {
        t = setAttr(t, 'loading', 'lazy');
      }
      t = setAttr(t, 'decoding', 'async');

      idx++;
      return t;
    });
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

  WScript.Echo("Patching HTML (perf + mobile fix v3)...");
  walkAndPatch(root);
  WScript.Echo("Done.");
})();