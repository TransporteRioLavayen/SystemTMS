$path = "c:\Users\Dell\Desktop\TransporteRioLavayen\frontend\src"
$items = Get-ChildItem -Path $path -Filter *.tsx -Recurse
foreach ($item in $items) {
    $content = Get-Content $item.FullName
    $newContent = $content -replace "indigo", "emerald" -replace "blue", "emerald" -replace "cyan", "emerald" -replace "teal", "emerald"
    if ($content -ne $newContent) {
        $newContent | Set-Content $item.FullName
    }
}
