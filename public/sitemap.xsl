<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"
    doctype-system="about:legacy-compat" />

  <xsl:template match="/">
    <html lang="en-AU">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, follow" />
        <title>XML Sitemap · Balga Designs</title>
        <style>
          :root {
            --green: #5a674e; --khaki: #b7b597; --ink: #1b1b1b;
            --line: #e6e6df; --muted: #6b6f63; --bg: #f7f6f1;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0; background: var(--bg); color: var(--ink);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
          }
          .head { background: var(--green); color: #fff; padding: 2.4rem 1.25rem; }
          .head .wrap { max-width: 1000px; margin: 0 auto; }
          .head h1 { margin: 0 0 .35rem; font-size: 1.6rem; letter-spacing: .01em; }
          .head p { margin: 0; color: rgba(255,255,255,.85); font-size: .95rem; }
          .wrap { max-width: 1000px; margin: 0 auto; padding: 0 1.25rem; }
          .meta { padding: 1.25rem; font-size: .9rem; color: var(--muted); }
          .meta strong { color: var(--ink); }
          .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; margin: 0 1.25rem 3rem; }
          @media (min-width: 1040px) { .card, .meta { margin-left: auto; margin-right: auto; max-width: 1000px; } }
          table { width: 100%; border-collapse: collapse; font-size: .92rem; }
          th, td { text-align: left; padding: .85rem 1.1rem; border-bottom: 1px solid var(--line); }
          th { background: #fbfbf8; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-size: .72rem; }
          tr:last-child td { border-bottom: 0; }
          tr:hover td { background: #fbfbf5; }
          td.url a { color: var(--green); text-decoration: none; word-break: break-word; }
          td.url a:hover { text-decoration: underline; }
          td.mod { color: var(--muted); white-space: nowrap; }
          .num { color: var(--muted); width: 3rem; }
          .foot { text-align: center; color: var(--muted); font-size: .82rem; padding: 0 1.25rem 2.5rem; }
        </style>
      </head>
      <body>
        <div class="head">
          <div class="wrap">
            <h1>XML Sitemap</h1>
            <p>Balga Designs — Sustainable Landscapes. This file lists the site's pages for search engines and is not a page for visitors.</p>
          </div>
        </div>
        <div class="meta">
          This sitemap contains <strong><xsl:value-of select="count(s:urlset/s:url)" /></strong> URLs.
        </div>
        <div class="card">
          <table>
            <tr>
              <th class="num">#</th>
              <th>URL</th>
              <th>Last modified</th>
            </tr>
            <xsl:for-each select="s:urlset/s:url">
              <tr>
                <td class="num"><xsl:value-of select="position()" /></td>
                <td class="url">
                  <a href="{s:loc}"><xsl:value-of select="s:loc" /></a>
                </td>
                <td class="mod"><xsl:value-of select="s:lastmod" /></td>
              </tr>
            </xsl:for-each>
          </table>
        </div>
        <p class="foot">Generated for Balga Designs · balgadesigns.com.au</p>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
