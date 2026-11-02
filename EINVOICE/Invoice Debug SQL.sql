Get IRN button Enable Condition : [HMCL B2B Parts BIP Flg] = 'Y' AND [HMCL EINV IRN] IS NULL AND ([HHML Order Invoice Type] = 'Cash' OR [HHML Order Invoice Type] = 'Credit' OR [HHML Order Invoice Type] IS NULL)

HMCL B2B Parts BIP Flg = IIf([HMCL EINV Dlr B2B Flg]='Y' and ([Invoice Date]>=[HMCL EINV Dlr B2B Date]) and ([Account] is not null) and ([HMCL GST Reg No] is not null),'Y','N')

select X_HMCL_EINV_B2B_DT,X_HMCL_EINV_B2B_FLG from siebel.s_org_ext where row_id='1-9ACNU1';

select * from siebel.s_org_ext where integration_id='11165';

select X_NAME,accnt_id,X_HMCL_EINV_IRN from siebel.s_invoice where row_id='2-JGKGWSJ';

select VAT_REGN_NUM from siebel.s_org_ext where row_id='1-20M2A3IW';

select ATTRIB_01 from siebel.s_order_x where row_id='2-JGKGW5U';

==============================================================================================================================


select type, name, val, desc_text, active_flg, high, low, order_by, par_row_id from siebel.s_lst_of_val where ws_id = (select ws.row_id from siebel.s_workspace ws, siebel.s_repository rep where rep.row_id = ws.repository_id and ws.name = 'MAIN' and rep.name = 'Siebel Repository')
and type = 'FS_ORDER_STATUS' and name = 'Closed'

--SOAP service used as Filter service in Outbound Web Service:
BS = HMCL Test SOAP Msg
Method = InpMsg
PT Path = /siebelfs/siebelfs/rahul_test.txt
PROD Path = /siebelfs/PartSaleOrders/Neeraj1.txt

--Endpoint URL:
Testing / PT / BoltOn Sandbox: https://botestsoapapi.deloitteanalytics.in/EInvoiceService.svc
PROD: https://boltoncsoapapi.deloitteanalytics.in/EInvoiceService.svc

--Update eInvoice License post EVERY MIGRATION that brings LOV from PT
--1. Check the current license value
select row_id, type, name, val, desc_text, high, low from siebel.s_lst_of_val where type = 'HMCL_EINV_TOKEN' 
and ws_id = (select row_id from siebel.s_workspace where repository_id = (select row_id from siebel.s_repository where name = 'Siebel Repository'))

--2a. Update the PROD license value as Development / Testing license in LOVs is different
update siebel.s_lst_of_val set val = 'RHH_fqmGQXureTdZAHSrv', last_upd = sysdate-0.22917, modification_num = modification_num + 1
where row_id = '2-HCX7-1HO0'    --Get the updated ROW_ID after every release

--2b.
update siebel.s_lst_of_val set val = 'cmbp90xCYRXXaDHsBrvUsM', last_upd = sysdate-0.22917, modification_num = modification_num + 1
where row_id = '2-HCX7-1HO1'    --Get the updated ROW_ID after every release

--2c. Clear Cache in application

--Find the Dealer enability for eInvoice generation in Hero DMS:
select adr.row_id, dlr.par_row_id dlr_row_id, dlr.integration_id, DLR.X_HMCL_EINV_B2B_DT, DLR.X_HMCL_EINV_B2B_FLG, DLR.VAT_REGN_NUM dlr_gstin, div.name, div.vat_regn_num div_gstin, adr.addr, adr.state, ADR.X_STATE_CODE, adr.city, adr.zipcode 
from siebel.s_org_ext dlr, siebel.s_org_ext div, siebel.s_addr_per adr where div.par_divn_id = dlr.par_row_id 
and adr.row_id = div.pr_addr_id and dlr.integration_id = '30161'


--Get the Invoice details and generate SOAP if needed using: "....SOAP..." filter BS hitting from application
--Cancellation = HMCL Cancel EINV Workflow
--Cancellation = HMCL Cancel EINV Workflow
--CRN = HMCL Gen CRN EINV Workflow
select distinct nvl(INV.X_HMCL_EINV_IRN,'NOT GEN. YET') irn1, inv.x_hmcl_einv_irn_stat_cd irn1_status, INV.X_HMCL_EINV_CRN crn, INV.X_HMCL_EINV_IRN_GD irn2, INV.X_HMCL_EINV_IRN_STAT_GD irn2_status,
inv.status_cd inv_status, replace(replace(err.err_desc,Chr(10),' | '),'Error invoking service ''IEInvoiceService'', method ''GenerateEInvoice'' at step ''Proxy Business Service''.(SBL-BPR-00162) | -- | Operation ''GenerateEInvoice'' of Web Service ''http://tempuri.org/.IEInvoiceService'' at port ''BasicHttpBinding'' failed with the following explanation: ','') err_desc, 
sot.name ordeR_type, inv.row_id invoice_id, order_id, 'HMCL Gen EINV Debug WF' Process_Name, ord.order_num, inv.invc_num, inv.invc_dt+0.22917 invoice_dt, inv.posted_dt cancellation_dt, nvl(inv.X_INVOICE_CANCEL_REASON,'N/A') cancel_rem, 
inv.last_upd+0.22917 inv_last_upd, dlr.vat_regn_num, dlr.x_hmcl_einv_b2b_flg, DLR.X_HMCL_EINV_B2B_DT from siebel.s_invoice inv, siebel.s_order_type sot, siebel.s_order ord, siebel.s_org_ext dlr, 
(select err_object, err_object_id, err_desc from siebel.cx_error_log union all select err_object, err_object_id, err_desc from siebel.cx_error_log_bkp) err 
where ord.row_id = inv.order_id and dlr.par_row_id = ord.bu_id and sot.row_id = ord.order_type_id and err.err_object_id(+) = inv.row_id
and err.err_object(+) = 'HMCL Gen EINV Workflow'
and inv.invc_type_cd in ('Service', 'Receivable')   --MIGHT BE SOMETHING ELSE for HMCL Invoice
--and ord.order_num in ('11845-02-SVSO-1021-3070')
and inv.invc_num in ('30161CK21P14513') 

--ORDER_ID    INVOICE_ID    ORDER_TYPE    INV_STATUS    PROCESS_NAME    ORDER_NUM    INVC_NUM    INVOICE_DT    POSTED_DT    IRN1    INVC_TYPE_CD
2-AM756UB    2-B5DRX7X    Service Order    Open    HMCL Gen EINV Workflow    10730-05-RJC-1220-13505    10730EA21V14762    12-01-2021 16:29:03        NOT GEN. YET    Service

--For completed Sales Invoices where completion(receival) has been done before IRN generation
--then IRN number not getting stamped as FS Invoice BC getting readonly
update siebel.s_invoice set x_hmcl_einv_irn = 'd282b9b8a486a37d97890a701d76e457251999c3b307f71b5b96e06e9a0574ad',
X_HMCL_EINV_IRN_STAT_CD = 'ACT', 
X_HMCL_EINV_ACK_DT  = to_date('2021-04-09 17:37:00','YYYY-MM-DD HH24:MI:SS'),
X_HMCL_EINV_ACK_NO = '142110335167338',
X_HMCL_EINV_SIGN_QR = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ0NDQwNUM3ODFFNDgyNTA3MkIzNENBNEY4QkRDNjA2Qzg2QjU3MjAiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJSRVFGeDRIa2dsQnlzMHlrLUwzR0JzaHJWeUEifQ.eyJkYXRhIjoie1wiU2VsbGVyR3N0aW5cIjpcIjIwQUFERkg2MzUxRzFaVVwiLFwiQnV5ZXJHc3RpblwiOlwiMjBBQVhGUDI2NjJFMVo4XCIsXCJEb2NOb1wiOlwiMzAxNjBDRDIxUDM1MVwiLFwiRG9jVHlwXCI6XCJJTlZcIixcIkRvY0R0XCI6XCIwOS8wNC8yMDIxXCIsXCJUb3RJbnZWYWxcIjo4Njk2LjAsXCJJdGVtQ250XCI6NixcIk1haW5Ic25Db2RlXCI6XCI4NzE0MTA5MFwiLFwiSXJuXCI6XCJkMjgyYjliOGE0ODZhMzdkOTc4OTBhNzAxZDc2ZTQ1NzI1MTk5OWMzYjMwN2Y3MWI1Yjk2ZTA2ZTlhMDU3NGFkXCIsXCJJcm5EdFwiOlwiMjAyMS0wNC0wOSAxNzozNzowMFwifSIsImlzcyI6Ik5JQyJ9.CNz_Lu8GlBZyAJCrTkhVUiZQrv5KI8nOuEY0tbJL2Xh4DI9CN7iGyEeqRvSsf_iHn-_f47NA9CkUBHdCE5ucgtOK4BQ6ZVd_CdbYWrCPACn5O88XJwjOWyhiaFnSuv-EWicsXfFJ5afWqhrnAWxrk41nIrXgQLFvM19hJ00CS8fwPplyAjn6yl1tcF1W_qyS_BE6pjUU8661hazJR6DEQL9Vp5Und7EhfpizXjmMQr44xebwwcvZvDN7aVraXBD2VZLX1dXprYmzE4uAQGpjTohOB26X0dWIwhIa0wQ38D9YhTH9PlrdLogHdQuvVrQxKh5nKovMM5fLRkpll5Aosg',
last_upd = sysdate-0.22917,
modification_num = modification_num + 1
where --row_id = '2-B1QN0I1'
invc_num = '30160CD21P351'

--Generate eInvoice Errors Reports
--Today
select ord.order_num, sot.name, inv.invc_num, err.created+0.22917, ERR.ERR_CODE, replace(replace(ERR.ERR_DESC,chr(10), '|'),'Error invoking service ''IEInvoiceService'', method ''GenerateEInvoice'' at step ''Proxy Business Service''.(SBL-BPR-00162)|--|Operation ''GenerateEInvoice'' of Web Service ''http://tempuri.org/.IEInvoiceService'' at port ''BasicHttpBinding'' failed with the following explanation: ','') err_msg from siebel.cx_error_log err, siebel.s_invoice inv, siebel.s_order ord, siebel.s_order_type sot 
where ord.row_id = inv.ordeR_id and err.err_object_id = inv.row_id and ord.order_type_id = sot.row_id and err.err_object = 'HMCL Gen EINV Workflow'
order by err.created desc

--Last week
select ord.order_num, sot.name, inv.invc_num, err.created+0.22917, ERR.ERR_CODE, replace(ERR.ERR_DESC,chr(10), '|') err_msg from siebel.cx_error_log_bkp err, siebel.s_invoice inv, siebel.s_order ord, siebel.s_order_type sot 
where ord.row_id = inv.ordeR_id and err.err_object_id = inv.row_id and ord.order_type_id = sot.row_id and err.err_object = 'HMCL Gen EINV Workflow'
--and err.created > to_date('29-03-2021','DD-MM-YYYY') - 0.22917
order by err.created desc

--Find HSN related errors in jobcard line iitems: Length of HSN   OR   NULL HSN
select ord.order_num, inv.status_cd inv_status, inv.invc_dt+0.22917 invoice_dt, pro.last_upd+0.22917 prod_last_upd,
nvl(length(PRO.X_HMCL_HSN_NUMBER),length(PRO.X_HMCL_SAC_NUMBER)) einv_hsn_len, 
PRO.X_HMCL_HSN_NUMBER hsn_num, PRO.X_HMCL_SAC_NUMBER sac_num, PRO.CATEGORY_CD, 
pro.part_num, pro.desc_text,  soi.row_id soi_id from siebel.s_order_item soi, siebel.s_order ord,siebel.s_invoice inv,siebel.s_prod_int pro
where inv.order_id = ord.row_id and soi.order_id = ord.row_id and soi.prod_id = pro.row_id and inv.invc_type_cd in ('Service', 'Receivable')
and inv.status_cd = 'Open'
--and ord.order_num = '10446-03-RJC-0721-6831'
and inv.invc_num in ('10213CK21P4955')
order by nvl(length(PRO.X_HMCL_SAC_NUMBER), length(PRO.X_HMCL_HSN_NUMBER)) desc

--If Jobcard / JC Buyer details like State Code / POS / applicable tax are showing too short despite the address being already assigned then check following;
--a.
select inv.x_org_id, ord.order_num, inv.invc_num, inv.invc_dt+0.22917 invc_date, inv.status_cd, decode(substr(dlr.vat_regn_num,1,2), substr(accnt.vat_regn_num,1,2),'Local Taxes','IGST') applicable_inv_tax, 
accnt.par_row_id accnt_id, accnt.ou_num, accnt.name accnt_name, accnt.vat_regn_num gstin, accnt.ou_type_cd, accnt.pr_addr_id, accnt.pr_bl_addr_id, adr.created+0.22917 adr_created, 
adr.last_upd+0.22917 adr_last_upd, adr.addr, ADR.ADDR_LINE_2, adr.state, adr.city, adr.district, adr.x_state_code, adr.zipcode 
from siebel.s_org_ext accnt, siebel.s_invoice inv, siebel.s_order ord, siebel.s_addr_per adr, siebel.s_org_ext dlr 
where inv.accnt_id = accnt.par_row_id
and inv.x_org_id = dlr.par_row_id
and adr.row_id(+) = accnt.pr_addr_id
and ord.row_id = inv.order_id
and inv.invc_type_cd = 'Service'
--and ord.order_num in ('11920-03-RJC-0221-12608')
and inv.invc_num in ('11036CH21V3643') 

--ORDER_NUM    INVC_NUM    STATUS_CD    ACCNT_ID    PR_ADDR_ID    PR_BL_ADDR_ID
10477-03-RJC-0321-14521    10477CC21V15181    Open    2-CGF40JS    2-CGF40JV        

--b. If taxation is not showing correct as per eInvoice error then run Kapil's BS once:
Destop: I/P Header = HMCL JC Price All After Invoiced With Invoice Update From Order_Input.xml
Desktop: I/P Child = BS_INPUT.xml

--Find the HSN related errors in Vehicle Sales Invoice
select ord.order_num, inv.invc_num, inv.status_cd, ast.asset_num, pro.part_num sku, pro.x_hmcl_hsn_number, pro.last_upd+0.22917 pro_last_upd from siebel.s_prod_int pro, siebel.s_order_item soi, siebel.s_order ord, siebel.s_invoice inv, siebel.s_asset ast
where ord.row_id = soi.order_id
and inv.order_id = ord.row_id
and ast.row_id = soi.asset_id
and pro.row_id = ast.prod_id
and inv.invc_num in ('10307BC21S7451')
--and ord.order_num = '' 

--Parts Sale Order: Packaging and Forwarding Charges and taxes
--In case, no Tax has been found that packaging and forwarding charges can be put as following:
--<OthChrg xmlns="http://schemas.datacontract.org/2004/07/Bolton.EinvoiceEwayBill.SOAP.DataModel">[PCK_FWD_CHRGS]</OthChrg>
--between "IgstVal"     and     "SgstVal"   elements under      "ValDtls" parent and hit the packet again 
select ord.order_num, inv.invc_num, inv.x_hmcl_einv_irn irn, inv.status_cd inv_status, ord.X_FREIGHT_CHRGS pck_fwd_chrgs, dlr.X_FREIGHT_SERVICETAX pck_fwd_svc_tax, dlrx.X_HMCL_CGST pck_fwd_cgst_sgst_tax, dlrx.X_HMCL_IGST pck_fwd_igst_tax 
from siebel.s_invoice inv, siebel.s_order ord, siebel.s_org_ext dlr, siebel.s_org_ext_x dlrx
where ord.bu_id= dlr.par_row_id
and inv.order_id = ord.row_id
and dlrx.par_row_id = dlr.par_row_id
and ord.order_type_id = '1-AMK8' 
--and ord.X_FREIGHT_CHRGS is not null
and dlrx.X_HMCL_CGST is null 
AND dlrx.X_HMCL_IGST is null 
--and inv.x_hmcl_einv_irn is null
--and ord.order_num in ('10213-03-PSAO-0421-105')
and inv.invc_num in ('30110FH21P12295')

--cancellation requests:
select inv.row_id invoice_id, nvl(INV.VOID_REASON_TEXT, INV.X_INVOICE_CANCEL_REASON) CanRem, inv.x_hmcl_einv_irn IRN, 
inv.invc_num, ord.order_num, 'HMCL Cancel EINV Workflow' processname, INV.X_HMCL_EINV_CRN, 
INV.X_HMCL_EINV_ACK_DT, posted_dt, INV.X_HMCL_EINV_IRN_GD 
from siebel.s_invoice inv, siebel.s_order ord where ord.row_id = inv.order_id and  invc_num in ('11718CD21P106','11718CD21P84') 
and inv.status_cd = 'Cancelled'

--Check if there is Price List issue for JC Invoices where error = Total Invoice value is less than sum of Total item value 
-- such that GROSS_AMT = 0: User will have to cancel the JC if created before 29-04-2021 
--and create fresh invoice using "MRP Master Parts Price List" in workshop Sales
select ord.order_num, ord.order_dt+0.22917 order_date, pri.name, pro.part_num, pro.category_cd, inv.x_hmcl_einv_irn, sii.GROSS_AMT 
from siebel.s_order_item soi, siebel.s_prod_int pro,
siebel.s_order ord, siebel.s_invoice inv, siebel.s_invoice_item sii, siebel.s_pri_lst pri
where ord.row_id = soi.order_id
and inv.order_id = ord.row_id
and pro.row_id = soi.prod_id
and sii.invoice_id = inv.row_id
and sii.order_item_id = soi.row_id
and pri.row_id = ord.pri_lst_id
and PRO.SALES_SRVC_FLG <> 'Y'
and inv.invc_type_cd = 'Service'
and sii.gross_amt = 0
and sii.gross_amt = 0
and ord.order_num in ('11930-04-RJC-0421-526',
'11930-03-RJC-0421-1285',
'11630-03-RJC-0421-1799',
'10027-03-RJC-0421-2376',
'10195-03-RJC-0421-716')
--and inv.invc_num = '11185CD21V1292'

--List of errors:
1. Regarding point : 1018 - Client Id is not mapped to this user, for that GSTIN deloitte is not selected as GSP provider or API user id is not even created for that GSTIN. 
The details provided to get passphrase would be portal login and not the API user id and password

2. Incorrect User id and Password: L1 has to followup with dealer.

3. Incorrect password: L1 has to followup with dealer to get this corrected.

------------------------------------------------------------------------------

For VOR automated orders

--Check current division Id for parts sales invoice created through VOR orders
select x_division_id, created_by from siebel.s_order where row_id = (select ordeR_id from siebel.s_invoice where invc_num = '30105BK21P18612')

--Stamp the division Id of the CREATED_BY employee in above query
update siebel.s_order set x_division_id = '1-2VKFZXD', last_upd = sysdate-0.22917, modification_num = modification_num + 1 where row_id in (select order_id from siebel.s_invoice where invc_num in ('30105BK21P18612',
'30105BK21P18613',
'30105BK21P18614',
'30105BK21P18615'))
and x_division_id = '0-5200';

select x_division_id ,bu_id,last_upd from siebel.s_order where row_id IN (select ordeR_id from siebel.s_invoice where invc_num IN ( '30196BK21P13014'));

select ordeR_id,created_by, status_cd from siebel.s_invoice where invc_num IN ('30196BK21P13014');

select * from siebel.s_postn where row_id='1-C1P1W5';

select pr_held_postn_id,row_id,bu_id from siebel.s_contact where row_id='1-2WZHNBG';

select row_id, name from siebel.s_org_ext where par_divn_id='1-17B5AO0'; 


--1-C1H7B6

update siebel.s_order set x_division_id = '1-2E7G1QP', last_upd = sysdate-0.22917, modification_num = modification_num + 1 where row_id in (select order_id from siebel.s_invoice where
 invc_num in ('30196BK21P13014')
and x_division_id = '0-5200');

=================================================================================================================================


If found that the line items in the parts sale order show Total GST = 0 OR if the CGST and SGST and IGST amount in line items = 0 then there is a BS to run pricing and taxation again on the Parts Sale order Invoice already created.
Making sure that Invoice Status = Open. 
If status = 'Closed' i.e. the invoice has been received by the destination network then first mark it Open from backend and then run below process and then revert the Invoice status = Closed. DONOT run for Cancelled invoice.

1. Load records in CX_ERROR_LOG table
Choose any imaginary ROW_ID below and make sure to enter last 3 columns as in below query as per the corresponding parts sale order

insert all
into siebel.cx_error_log(row_id, created, created_by, last_upd, last_upd_by, conflict_id, modification_num, db_last_upd, db_last_upd_src, ERR_DESC,ERR_OBJECT_TYPE,ERR_OBJECT) values('2-R-94',sysdate-0.22917,'0-1',sysdate-0.22917, '0-1', 0,0,sysdate-0.22917, 'User','ORD_PARTS_SALE_ORDER','N','30225-03-PSAO-1221-38776')
into siebel.cx_error_log(row_id, created, created_by, last_upd, last_upd_by, conflict_id, modification_num, db_last_upd, db_last_upd_src, ERR_DESC,ERR_OBJECT_TYPE,ERR_OBJECT) values('2-R-95',sysdate-0.22917,'0-1',sysdate-0.22917, '0-1', 0,0,sysdate-0.22917, 'User','ORD_PARTS_SALE_ORDER','N','30225-03-PSAO-1221-38819')
select * from dual

2. BS to simulate = HMCL PSAO Price All After Invoiced With Invoice Update FROM CX_ERROR_LOG
Method = PriceAll... (only method to choose)
Without any input arguments...simple Run on one input.

3. Verify the records by using following query:
select row_id, ERR_OBJECT_TYPE from siebel.cx_error_log where row_id in ('2-R-94',
'2-R-95',
'2-R-96',
'2-R-97',
'2-R-98')

The ERR_OBJECT_TYPE should show 'Y' after the execution.
Also, you can login into see the Taxation / Pricing in the Parts sale order that has been corrected.

