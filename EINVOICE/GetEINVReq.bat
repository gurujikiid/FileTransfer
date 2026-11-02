@echo off
mode con: cols=45 lines=20
color 0A
set /p invc_num="Enter Invoice Number: "
C:\Users\G0004836\Desktop\einvoice\WinSCP\WinSCP.com /ini=nul /script="C:\Users\G0004836\Desktop\einvoice\WinSCP\cmd_script.txt"
move Neeraj1.txt "C:\Users\G0004836\Desktop\einvoice\TEMP\Request__%invc_num%.txt"
"c:\Program Files\Notepad++\notepad++.exe" "C:\Users\G0004836\Desktop\einvoice\TEMP\Request__%invc_num%.txt"
