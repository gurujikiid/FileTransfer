@echo off
mode con: cols=45 lines=20
color 0F
set /p emp_id="Enter PROD Id: "
cls
color 0A
set /p pass="Enter Password: "
cls
color 0F
set /p invc_num="Enter Invoice Number: "
break>GenEINV.sql

echo.set echo off>>GenEINV.sql
echo.set headsep off>>GenEINV.sql
echo.set feedback off>>GenEINV.sql
echo.set linesize 2000>>GenEINV.sql
echo.set termout off>>GenEINV.sql
echo.set HEADING OFF>>GenEINV.sql
echo.set TRIMSPOOL ON>>GenEINV.sql

echo spool "Req Gen eInv IP1.xml">>GenEINV.sql

echo select '^<?xml version="1.0" encoding="UTF-8"?^>^<?Siebel-Property-Set EscapeNames="true"?^>^<PropertySet Order_spcType="' || sot.name || '" Invoice_spcId="' || inv.row_id || '" Order_spcId="' || ord.row_id || '" ProcessName="HMCL Gen EINV Debug WF"^>^</PropertySet^>' from siebel.s_order ord, siebel.s_invoice inv, siebel.s_order_type sot where sot.row_id = ord.order_type_id and ord.row_id = inv.order_id and inv.invc_type_cd in ('Service', 'Receivable') and inv.invc_num in ('%invc_num%') and inv.status_cd ^<^> 'Cancelled';>>GenEINV.sql

echo spool off;>>GenEINV.sql

echo quit>>GenEINV.sql

sqlplus -s %emp_id%/%pass%@PROD @GenEINV.sql
more +1 "Req Gen eInv IP1.xml" > "C:\Users\G0004836\Desktop\einvoice\Req Gen eInv IP.xml"
del "Req Gen eInv IP1.xml"
cls
cd C:\Users\G0004836\Desktop\einvoice
find /c /v "" "Req Gen eInv IP.xml"
set /p wow="Hit ENTER to open Automotive....."

break>prim_pos_auto.sql

echo update siebel.s_contact set PR_HELD_POSTN_ID = '1-1WFA62WN' where row_id in (select row_id from siebel.s_user where login = '%emp_id%');>>prim_pos_auto.sql

echo commit;>>prim_pos_auto.sql

echo quit>>prim_pos_auto.sql

sqlplus -s %emp_id%/%pass%@PROD @prim_pos_auto.sql

::start Microsoft-Edge:https://172.20.4.100/eautomotive_enu
::exit
