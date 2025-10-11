// goc-seo-perf-wsh.js — performance-preserving SEO patch (WSH, no PowerShell/Node)
// Keeps srcset/sizes intact. Adds lazy-loading/decoding, fixes localhost links,
// converts data-src->src when needed, and injects canonical + meta description.
// Skips the backup_html_before_scrub folder if present.
//
// Run with:  cscript //nologo goc-seo-perf-wsh.js

(function () {
  var fso   = new ActiveXObject("Scripting.FileSystemObject");
  var root  = fso.GetAbsolutePathName(".");
  var domain = "https://greenoceanconsultants.com";
  var desc = "GOC provides businesses with exceptional customer experiences through reliable, efficient, and human-centered phone and chat support.";

  function log(s){ WScript.Echo(s); }

  // UTF-8 load/save helpers
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

  // Fix href/src pointing to localhost to be root-relative
  function fixLocalhostUrls(html){
    return html.replace(reLocalHost, function(_, path){ return path ? path : "/"; });
  }

  // Add/update canonical and meta description
  function patchHead(html, absPath){
    var canonLine = '  <link rel="canonical" href="' + canonicalFor(absPath) + '" />';
    if (reCanonFind.test(html)) html = html.replace(reCanonFind, canonLine);
    else html = html.replace(reHeadOpen, function(m,g1){ return "<head"+g1+">\r\n"+canonLine; });

    var descLine = '  <meta name="description" content="' + desc.replace(/"/g,'&quot;') + '" />';
    if (reDescFind.test(html)) html = html.replace(reDescFind, descLine);
    else html = html.replace(reHeadOpen, function(m,g1){ return "<head"+g1+">\r\n"+descLine; });

    return html;
  }

  // Add lazy-loading/decoding to <img>; treat the first <img> as hero (eager/high)
  function patchImages(html){
    var imgRe = /<img\b[^>]*>/ig;
    var idx = 0;
    return html.replace(imgRe, function(tag){
      var t = tag;

      // Convert data-src to src when src missing
      if (!/src\s*=/i.test(t) && /data-src\s*=/i.test(t)) {
        var m = t.match(/data-src\s*=\s*("([^"]+)"|'([^']+)')/i);
        if (m) {
          var val = m[2] || m[3] || "";
          t = t.replace(/data-src\s*=\s*("([^"]+)"|'([^']+)')/i, "");
          if (/\s>$/.test(t)) t = t.replace(/\s>$/, " >");
          t = t.replace(/^<img/i, '<img src="'+val+'"');
        }
      }

      // Ensure only the first IMG is eager/high; others lazy/async
      if (idx === 0) {
        // hero
        if (!/loading\s*=/i.test(t)) t = t.replace(/^<img/i, '<img loading="eager"');
        else t = t.replace(/loading\s*=\s*(".*?"|'.*?'|\w+)/i, 'loading="eager"');
        if (!/fetchpriority\s*=/i.test(t)) t = t.replace(/^<img/i, '<img fetchpriority="high"');
        else t = t.replace(/fetchpriority\s*=\s*(".*?"|'.*?'|\w+)/i, 'fetchpriority="high"');
      } else {
        // below-the-fold
        if (!/loading\s*=/i.test(t)) t = t.replace(/^<img/i, '<img loading="lazy"');
        else t = t.replace(/loading\s*=\s*(".*?"|'.*?'|\w+)/i, 'loading="lazy"');
      }
      if (!/decoding\s*=/i.test(t)) t = t.replace(/^<img/i, '<img decoding="async"');

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
    // files
    var e = new Enumerator(folder.Files);
    for (; !e.atEnd(); e.moveNext()){
      var file = e.item();
      if (/\.html?$/i.test(file.Name)){
        patchHtml(file.Path);
      }
    }
    // subfolders
    var sf = new Enumerator(folder.SubFolders);
    for (; !sf.atEnd(); sf.moveNext()){
      var sub = sf.item();
      if (/\\backup_html_before_scrub(\\|$)/i.test("\\"+sub.Path.replace(/\//g,"\\"))) continue;
      walkAndPatch(sub.Path);
    }
  }

  // robots.txt + sitemap.xml (simple and safe)
  var robotsPath = fso.BuildPath(root, "robots.txt");
  var robotsTxt = "User-agent: *\r\nAllow: /\r\n\r\nSitemap: " + domain + "/sitemap.xml\r\n";
  (function(){ var existing = ""; if (fso.FileExists(robotsPath)) try { existing = loadUtf8(robotsPath); } catch(e){}; saveUtf8(robotsPath, robotsTxt); })();

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

  WScript.Echo("Patching HTML (perf-preserving)...");
  walkAndPatch(root);
  WScript.Echo("Done.");
})();