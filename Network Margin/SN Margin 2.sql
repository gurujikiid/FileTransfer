--1) Verify all networks for the Dealer
SELECT
distinct
 ps.row_id,dlr.integration_id, ntw.integration_id
  from
siebel.s_org_ext ntw
, siebel.s_org_ext dlr  
, siebel.s_org_ext ps
, siebel.S_ORG_EXT_CSX glb
where
glb.GLOBAL_LOC_NUM = dlr.par_row_id
and glb.par_row_id = ntw.PAR_ROW_ID
and dlr.row_id = ps.integration_id(+)
and ntw.row_id = ps.x_account_dealer_code(+)
and ntw.integration_id 
IN 
('22725')
--('18080','12204','12196','12184','11195','10805','10415','10237','10235','10234','10233','10232','10230','10227','10225','10223','10222')
;

--2) Update Paid Stock Margin flag to Y only for new dealers, or for a new network for the existing dealer.
update siebel.s_org_ext set X_PAID_STOCK_MARGIN = 'Y'
where row_id in (SELECT
distinct
 ps.row_id
  from
siebel.s_org_ext ntw
, siebel.s_org_ext dlr
, siebel.s_org_ext ps
, siebel.S_ORG_EXT_CSX glb
where
glb.GLOBAL_LOC_NUM = dlr.par_row_id
and glb.par_row_id = ntw.PAR_ROW_ID
and dlr.row_id = ps.integration_id(+)
and ntw.row_id = ps.x_account_dealer_code(+)
--For new dealers
  and dlr.integration_id 
  in ('11091','11296','12195')
--For New Networks
  --and ntw.integration_id 
  --in ('64569')
);

--3) Verify that the Network Margin Category Score is available for all Networks associated with the Dealer.
select * from siebelext.cx_ntw_margin_upl
WHERE NETWORK_CODE IN
('25044','25043','25040')
order by network_code;

--Either 4a) Insert the data for the missing Networks
  --Set MYSCORE_VALUE = 0.075, MYSCORE_CATEGORY = Diamond as default if network score is not provided by the functional team.
    INSERT INTO
  SIEBELEXT.cx_ntw_margin_upl(NETWORK_CODE,MYSCORE_CATEGORY,MYSCORE_VALUE,CREATED,OLD_MYSCORE_CATEGORY,OLD_MYSCORE_VALUE,LAST_UPDATED)
  values
  ('25040','Silver','0.035',sysdate - 0.22917,'','',sysdate - 0.22917)
  ;

--or 4b) Update Data for the Existing Networks as provided by the functional team.
  --update SIEBELEXT.cx_ntw_margin_upl set old_myscore_category = MYSCORE_CATEGORY, OLD_MYSCORE_VALUE = MYSCORE_VALUE, LAST_UPDATED = sysdate - 0.22917;
  --update SIEBELEXT.cx_ntw_margin_upl set myscore_category = 'from sheet', MYSCORE_VALUE = 'from sheet';