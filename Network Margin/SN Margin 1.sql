--1) Verify that the Transport zone value is available for the Dealer Code
SELECT
dlr.integration_id,dlr.x_cust_grp_sales TRANSPORT_ZONE
from  
siebel.s_org_ext dlr
where
dlr.integration_id 
in 
('10936') 
--and dlr.x_cust_grp_sales is null
;

--2) Update Transport Zone for the Dealer from the Price List Value.
  --Price List will be obtained from Dealer -> Price List View (HHML Dealer Price List View)
  --Get Transport Zone Value from the *R Vehicles Price List from all Price Lists
update siebel.s_org_ext set x_cust_grp_sales = 'B2' where 
integration_id  in ('10203')
;



update siebel.s_org_ext A set A.x_cust_grp_sales = ( select distinct B.TRANSPORT_ZONE from SIEBELEXT.CX_NETWORK_MARGIN B where A.integration_id  = B.DLR_CODE)
where A.integration_id  in (select distinct c.DLR_CODE from SIEBELEXT.CX_NETWORK_MARGIN c, siebel.s_org_ext dlr where dlr.integration_id  = c.DLR_CODE and dlr.x_cust_grp_sales is null)
;


SELECT dlr.integration_id,   dlr.x_cust_grp_sales 
from  siebel.s_org_ext dlr
where dlr.integration_id in (select distinct DLR_CODE from SIEBELEXT.CX_NETWORK_MARGIN) and dlr.x_cust_grp_sales is null
;




select distinct DLR_CODE,TRANSPORT_ZONE  from SIEBELEXT.CX_NETWORK_MARGIN;


SELECT ps.row_id,
ps.X_PAID_STOCK_MARGIN 
from
siebel.s_org_ext ntw
, siebel.s_org_ext dlr
, siebel.s_org_ext ps
where
 PS.CUST_STAT_CD = 'Active'
and dlr.row_id = ps.integration_id(+)
and ntw.row_id = ps.x_account_dealer_code(+) and
dlr.integration_id = '10221' and ntw.integration_id in ('24191');


update siebel.s_org_ext set X_PAID_STOCK_MARGIN = 'Y' where row_id in ('2-RN5XPO2','2-RZ7A4A0','2-RN531T3','2-17HYZBD5','2-16KQTAS1','2-12M22QX5','1-2IYCVJ1J');