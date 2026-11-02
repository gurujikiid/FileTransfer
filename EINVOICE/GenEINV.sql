set echo off
set headsep off
set feedback off
set linesize 2000
set termout off
set HEADING OFF
set TRIMSPOOL ON
spool "Req Gen eInv IP1.xml"
select '<?xml version="1.0" encoding="UTF-8"?><?Siebel-Property-Set EscapeNames="true"?><PropertySet Order_spcType="' || sot.name || '" Invoice_spcId="' || inv.row_id || '" Order_spcId="' || ord.row_id || '" ProcessName="HMCL Gen EINV Debug WF"></PropertySet>' from siebel.s_order ord, siebel.s_invoice inv, siebel.s_order_type sot where sot.row_id = ord.order_type_id and ord.row_id = inv.order_id and inv.invc_type_cd in ('Service', 'Receivable') and inv.invc_num in ('21545BB24V9509') and inv.status_cd <> 'Cancelled';
spool off;
quit
