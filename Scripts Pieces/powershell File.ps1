$downloaddloc="$($PWD)"
$isfile=Test-Path -Path $PWD"\pwdfile.txt"
if ($isfile)
{
}
else{
Set-Content -Path $PWD"\pwdfile.txt" -Value "devpass
ptpass
prodpass
$downloaddloc" -Encoding UTF8
}


$envn = Read-Host "enter Environment (1-DEV,2-PT,3-PROD)"
Switch($envn)
{
    1 {$env = "10.0.14.107:9004";Break}
    2 {$env = "10.0.14.210:9003";Break}
    3 {$env = "172.20.4.100";}
}


if($envn -eq 1)
{
$alog_pass=(Get-Content -Path $PWD"\pwdfile.txt"  -TotalCount 4)[0]
$newpass= Read-Host "Want to change your password?
Current download password is << $($alog_pass) >>"
if ($newpass)
{
    $file = Get-Content -Path $PWD"\pwdfile.txt" 
 $file | ForEach-Object {
    if ($_.ReadCount -eq 1) { 
      $_ -replace '\w+',$($newpass) 
    } else { 
      $_ 
    } 
   } | 
   Set-Content -Path $PWD"\pwdfile.txt" -Encoding UTF8
   $alog_pass=(Get-Content -Path $PWD"\pwdfile.txt"  -TotalCount 4)[0]
}
}
if($envn -eq 2)
{
$alog_pass=(Get-Content -Path $PWD"\pwdfile.txt"  -TotalCount 4)[1]
$newpass= Read-Host "Want to change your password?
Current download password is << $($alog_pass) >>"

if ($newpass)
{
    $file = Get-Content -Path $PWD"\pwdfile.txt"
 $file | ForEach-Object {
    if ($_.ReadCount -eq 2) { 
      $_ -replace '\w+',$($newpass)
    } else { 
      $_ 
    } 
   } | 
   Set-Content -Path $PWD"\pwdfile.txt" -Encoding UTF8
   $alog_pass=(Get-Content -Path $PWD"\pwdfile.txt"  -TotalCount 4)[1]
}

}
if($envn -eq 3)
{
$alog_pass=(Get-Content -Path $PWD"\pwdfile.txt"  -TotalCount 4)[2]
$newpass= Read-Host "Want to change your password?
Current download password is << $($alog_pass) >>"

if ($newpass)
{
    $file = Get-Content -Path $PWD"\pwdfile.txt"
 $file | ForEach-Object {
    if ($_.ReadCount -eq 3) { 
      $_ -replace '\w+',$($newpass)
    } else { 
      $_ 
    } 
   } | 
   Set-Content -Path $PWD"\pwdfile.txt" -Encoding UTF8
   $alog_pass=(Get-Content -Path $PWD"\pwdfile.txt"  -TotalCount 4)[2]
}
}
