$content = Get-ChildItem blog/*.html | Where-Object { $_.Name -ne 'article-template.html' } | ForEach-Object { 
"<url>
    <loc>https://aimustafa.online/blog/$($_.Name)</loc>
    <lastmod>$(Get-Date -Format 'yyyy-MM-dd')</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
</url>" 
}
$content | Out-File sitemap_snippet.txt -Encoding UTF8
