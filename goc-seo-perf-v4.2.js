// goc-seo-perf-v4.2.js — standalone WSH version
var fso = new ActiveXObject("Scripting.FileSystemObject");
var filePath = WScript.Arguments(0);
var html = fso.OpenTextFile(filePath, 1).ReadAll();

function firstUrlFromSrcset(srcset) {
  if (!srcset) return null;
  var first = srcset.split(',')[0].trim().split(/\s+/)[0];
  return first || null;
}

function fixPicturesAndLazy(html) {
  html = html
    .replace(/<img\b([^>]*?)>/gi, function(m, a) {
      var x = a
        .replace(/\sdata-(?:lazy-)?srcset=/gi, ' srcset=')
        .replace(/\simagesrcset=/gi, ' srcset=')
        .replace(/\sdata-(?:lazy-)?sizes=/gi, ' sizes=')
        .replace(/\sdata-(?:lazy-)?src=/gi, ' src=')
        .replace(/\ssrc\s*=\s*"data:image\/[^"]+"/gi, '')
        .replace(/\sstyle="[^"]*?(?:opacity\s*:\s*0|visibility\s*:\s*hidden|display\s*:\s*none|width\s*:\s*0\s*[^;"]*|height\s*:\s*0\s*[^;"]*)[^"]*"/gi, '')
        .replace(/\sclass="([^"]*)"/gi, function(_, cls) {
          var cleaned = cls
            .replace(/\b(?:lazyload|lazy-loading|is-lazy|lazy|js-lazy|lozad|b-lazy|ls-is-cached|ls-is-cached-lazyloaded|lazyloaded)\b/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
          return cleaned ? ' class="' + cleaned + '"' : '';
        });
      if (!/\bdecoding=/.test(x)) x += ' decoding="async"';
      if (!/\bloading=/.test(x)) x += ' loading="lazy"';
      if (!/\bfetchpriority=/.test(x)) x += ' fetchpriority="auto"';
      if (!/\bwidth=/.test(x))  x += ' width="0"';
      if (!/\bheight=/.test(x)) x += ' height="0"';
      return '<img' + x + '>';
    })
    .replace(/<source\b([^>]*?)>/gi, function(m, a) {
      var x = a
        .replace(/\sdata-(?:lazy-)?srcset=/gi, ' srcset=')
        .replace(/\simagesrcset=/gi, ' srcset=')
        .replace(/\sdata-(?:lazy-)?sizes=/gi, ' sizes=');
      return '<source' + x + '>';
    });

  html = html.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, function(pic) {
    var imgMatch = pic.match(/<img\b[^>]*>/i);
    if (!imgMatch) return pic;

    var img = imgMatch[0];
    var hasSrc = /\ssrc\s*=\s*"(?!")([^"]+)"/i.test(img);
    var imgSrcset = (img.match(/\ssrcset\s*=\s*"([^"]+)"/i) || [,''])[1];

    var sourceAll = pic.match(/<source\b[^>]*\ssrcset\s*=\s*"([^"]+)"[^>]*>/gi) || [];
    var nonAvif = null, anySource = null;
    for (var i = 0; i < sourceAll.length; i++) {
      var tag = sourceAll[i];
      var set = (tag.match(/\ssrcset\s*=\s*"([^"]+)"/i) || [,''])[1];
      var type = (tag.match(/\stype\s*=\s*"([^"]+)"/i) || [,''])[1];
      var candidate = firstUrlFromSrcset(set);
      if (!anySource && candidate) anySource = candidate;
      if (candidate && (!type || !/avif/i.test(type))) { nonAvif = candidate; break; }
    }

    var fallback = null;
    if (!hasSrc) {
      fallback = nonAvif || anySource || firstUrlFromSrcset(imgSrcset);
      if (fallback) {
        img = img.replace(/<img\b/i, '<img src="' + fallback + '"');
        pic = pic.replace(imgMatch[0], img);
      }
    }
    return pic;
  });

  html = html.replace(/<img\b([^>]*?)>/gi, function(m, a) {
    var hasSrc = /\ssrc\s*=\s*"([^"]+)"/i.test(a);
    var srcIsData = /\ssrc\s*=\s*"data:image\/[^"]+"/i.test(a);
    if (hasSrc && !srcIsData) return m;
    var imgSrcset = (a.match(/\ssrcset\s*=\s*"([^"]+)"/i) || [,''])[1];
    var fb = firstUrlFromSrcset(imgSrcset);
    if (fb) {
      var out = m.replace(/\s+src\s*=\s*"data:image\/[^"]+"/i, '');
      if (!/\ssrc\s*=/.test(out)) out = out.replace(/<img\b/i, '<img src="' + fb + '"');
      return out;
    }
    return m;
  });

  html = html.replace(/(src|href|srcset)\s*=\s*"([^"]*)"/gi, function(_, k, v) {
    var nv = v
      .replace(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/gi, '')
      .replace(/https?%3A%2F%2F(?:localhost|127\.0\.0\.1)(?::\d+)?/gi, '');
    return k + '="' + nv + '"';
  });

  html = html.replace(/\sdata-(?:lazy|lazied|litespeed|swiper|bg|bgset|nopin|noscript|placeholder|orig-src|orig-srcset|src|srcset|sizes)="[^"]*"/gi, '');

  return html;
}

var output = fixPicturesAndLazy(html);
var file = fso.OpenTextFile(filePath, 2, true);
file.Write(output);
file.Close();
