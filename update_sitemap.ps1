$snippet = Get-Content -Raw sitemap_snippet.txt
$xml = Get-Content -Raw sitemap.xml
# Remove any trailing newlines from snippet to keep it clean
$snippet = $snippet.Trim()
# Replace closing tag with snippet + closing tag
$xml = $xml -replace '</urlset>', "$snippet`n</urlset>"
$xml | Set-Content sitemap.xml -Encoding UTF8
