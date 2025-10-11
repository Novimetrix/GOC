// goc-seo-minimal-wsh.js — HTML-only SEO patch using Windows Script Host (no PowerShell, no Node)
// - Removes srcset/sizes/imagesrcset/data-srcset/data-src
// - Strips http(s)://localhost and 127.0.0.1 to root-relative
// - Adds/updates canonical and meta description
// - Writes robots.txt and sitemap.xml if missing
// Run with: cscript //nologo goc-seo-minimal-wsh.js

(function () {
  var shell = WScript.CreateObject("WScript.Shell");
  var fso   = new ActiveXObject("Scripting.FileSystemObject");
  var root  = fso.GetAbsolutePathName(".");
  var domain = "https://greenoceanconsultants.com";
  var desc = "GOC provides businesses with exceptional customer experiences through reliable, efficient, and human-centered phone and chat support.";

  function log(s){ WScript.Echo(s); }

  // UTF-8 text load/save via ADODB.Stream
  function loadUtf8(path){
    var s = new ActiveXObject("ADODB.Stream");
    s.Type = 2; // text
    s.Charset = "utf-8";
    s.Open();
    s.LoadFromFile(path);
    var txt = s.ReadText();
    s.Close();
    return txt;
  }
  function saveUtf8(path, txt){
    var s = new ActiveXObject("ADODB.Stream");
    s.Type = 2; s.Charset = "utf-8"; s.Open();
    s.WriteText(txt);
    s.Position = 0;
    var bin = new ActiveXObject("ADODB.Stream");
    bin.Type = 1; bin.Open();
    s.CopyTo(bin);
    bin.SaveToFile(path, 2);
    bin.Close(); s.Close();
  }

  function relWebPath(absPath){
    var p = absPath.replace(/\//g,"\\"); // normalize
    if (p.indexOf(root) === 0) p = p.substring(root.length);
    p = p.replace(/^\\+/, "");
    p = p.replace(/\\/g,"/");
    if (/\/index\.html$/i.test(p)) p = p.replace(/\/index\.html$/i, "/");
    if (p.charAt(0) !== "/") p = "/" + p;
    return p;
  }

  function canonicalFor(absPath){
    return domain + relWebPath(absPath);
  }

  // Replacements
  var reLocalHost = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/[^"' \t>]*?)?/gi;
  var reAttrs    = /\s(?:srcset|sizes|imagesrcset|data-srcset|data-src)=(".*?"|'.*?')/gi;
  var reHeadOpen = /<head\b([^>]*)>/i;
  var reCanonFind= /<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i;
  var reDescFind = /<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i;

  function patchHtml(absPath){
    var html = loadUtf8(absPath);

    // Strip host, keep path ($1) or "/" if missing
    html = html.replace(reLocalHost, function(_, path){ return path ? path : "/"; });

    // Remove heavy attrs
    html = html.replace(reAttrs, "");

    // Inject/update canonical
    var canonLine = '  <link rel="canonical" href="' + canonicalFor(absPath) + '" />';
    if (reCanonFind.test(html)){
      html = html.replace(reCanonFind, canonLine);
    } else {
      html = html.replace(reHeadOpen, function(m, g1){ return "<head" + g1 + ">\r\n" + canonLine; });
    }

    // Inject/update description
    var descLine = '  <meta name="description" content="' + desc.replace(/"/g,'&quot;') + '" />';
    if (reDescFind.test(html)){
      html = html.replace(reDescFind, descLine);
    } else {
      html = html.replace(reHeadOpen, function(m, g1){ return "<head" + g1 + ">\r\n" + descLine; });
    }

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
      walkAndPatch(sf.item().Path);
    }
  }

  // robots.txt
  var robotsPath = fso.BuildPath(root, "robots.txt");
  var robotsTxt = "User-agent: *\r\nAllow: /\r\n\r\nSitemap: " + domain + "/sitemap.xml\r\n";
  saveUtf8(robotsPath, robotsTxt);

  // sitemap.xml (create if missing)
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

  log("Patching HTML...");
  walkAndPatch(root);
  log("Done.");
})();