--0) create blank table
create table CX_NET_MAR_24MAY14 as (select * from siebelext.CX_NETWORK_MARGIN where 1=2);

select * from CX_NET_MAR_24MAY14;
truncate table CX_NET_MAR_24MAY14;

--1) Verify that the values for network margin is calculated for the new Dealers/Networks
INSERT INTO
CX_NET_MAR_24MAY14(VARIANT,ROW_ID,TRANSPORT_ZONE,DLR_CODE,NTW_CODE,PRICE_LIST,MRP,DLP,DEALER_MARGIN,BASE_MARGIN,MYSCORE_MARGIN,STOCK_MARGIN,PDI_CHARGES,TOTAL_MARGIN, CREATED, UPDATED,HANDLING_CHARGES)

SELECT distinct
prdx.ATTRIB_42 VARIANT,
dlr.integration_id||'-'||ntw.integration_id||'-'||prdx.ATTRIB_42 ROW_ID, 
dlr.x_cust_grp_sales TRANSPORT_ZONE,
dlr.integration_id DLR_CODE,
ntw.integration_id NTW_CODE,
p.name PRICE_LIST,
pi.MSRP_PRI_UNIT MRP,
pi.PURCH_PRI_UNIT DLP,
((pi.MSRP_PRI_UNIT - pi.PURCH_PRI_UNIT)/1.28 - nvl(pdi.HIGH, 0.0)-nvl(csv.HANDLING_CHARGES, 0.0)) DEALER_MARGIN,
0.35 * ((pi.MSRP_PRI_UNIT - pi.PURCH_PRI_UNIT)/1.28 - nvl(pdi.HIGH, 0.0)-nvl(csv.HANDLING_CHARGES, 0.0)) BASE_MARGIN,
nvl(mar.MYSCORE_VALUE * ((pi.MSRP_PRI_UNIT - pi.PURCH_PRI_UNIT)/1.28 - nvl(pdi.HIGH, 0.0)-nvl(csv.HANDLING_CHARGES, 0.0)), 0.0) MYSCORE_MARGIN
, CASE
    WHEN ps.X_PAID_STOCK_MARGIN = 'Y'
    THEN       0.075 * ((pi.MSRP_PRI_UNIT - pi.PURCH_PRI_UNIT)/1.28 - nvl(pdi.HIGH, 0.0)-nvl(csv.HANDLING_CHARGES, 0.0))
    ELSE       0.0
  END STOCK_MARGIN,
  
nvl(pdi.HIGH,0.0) PDI_CHARGES,

(0.35 * ((pi.MSRP_PRI_UNIT - pi.PURCH_PRI_UNIT)/1.28 - nvl(pdi.HIGH, 0.0)-nvl(csv.HANDLING_CHARGES, 0.0)) 
+ nvl(mar.MYSCORE_VALUE * ((pi.MSRP_PRI_UNIT - pi.PURCH_PRI_UNIT)/1.28 - nvl(pdi.HIGH, 0.0)-nvl(csv.HANDLING_CHARGES, 0.0)), 0.0)
+  ( CASE
      WHEN ps.X_PAID_STOCK_MARGIN = 'Y'
      THEN       0.075 * ((pi.MSRP_PRI_UNIT - pi.PURCH_PRI_UNIT)/1.28 - nvl(pdi.HIGH, 0.0)-nvl(csv.HANDLING_CHARGES, 0.0))
      ELSE       0.0
     END )
+ nvl(pdi.HIGH, 0.0)
) 
TOTAL_MARGIN,
sysdate - 0.22917,
sysdate - 0.22917,
nvl(csv.HANDLING_CHARGES, 0.0) HANDLING_CHARGES

FROM
siebel.s_org_ext ntw
, siebel.s_org_ext dlr
, siebel.s_org_ext ps
, siebel.S_ORG_EXT_CSX glb
, siebel.S_PRI_LST p
, SIEBEL.S_PRI_LST_ITEM pi
, siebel.S_PRI_LST_BU pli
, siebel.s_prod_int prd
, siebel.s_prod_int_x prdx
, SIEBELEXT.CX_NTW_MARGIN_UPL mar
, siebel.s_lst_of_val pdi,
NMM_HANDLING_CHARGE csv
where
 PS.CUST_STAT_CD = 'Active'
AND glb.GLOBAL_LOC_NUM = dlr.par_row_id
and glb.par_row_id = ntw.PAR_ROW_ID
and dlr.par_row_id = pli.BU_ID
and dlr.row_id = ps.integration_id(+)
and ntw.row_id = ps.x_account_dealer_code(+)
and pli.PRI_LST_ID = p.row_id
and pi.PRI_LST_ID(+) = p.row_id
and pi.PROD_ID = prd.row_id(+)
and prd.row_id = prdx.par_row_id
and ntw.integration_id = mar.network_code(+)
and prd.model_cd = pdi.name (+)
and pdi.type = 'HMCL_PDI_DETAILS'
and csv.TRANSPORT_ZONE = dlr.x_cust_grp_sales
and pdi.ws_id = (SELECT row_id FROM siebel.s_workspace WHERE name = 'MAIN' AND repository_id = (SELECT row_id FROM siebel.s_repository WHERE name = 'Siebel Repository'))

--For New Dealers
  and dlr.integration_id 
--  = '10978'
 in ('10936')
--in ('10231','10470','10635','10722','10835','10836','11091','11100','11166','11250','11466','11470','11562','11578','11650','11659','11825','11887','11901','11951','11962','11990','12025')

--For New Networks associated with existing Dealer
 and ntw.integration_id 
 -- in ('66950','67018','63192','66953','65534','67183')
   in ('22725')
and dlr.status_cd = 'Active'
and dlr.PRTNR_FLG <> 'N' and ntw.PRTNR_FLG <> 'N'
and p.name like '%R Vehicles Price List'
and pi.EFF_END_DT is null
and prd.model_cd is not null
and prdx.ATTRIB_42 in  ('HSPSFDSSCFI')
--= 'HXTRBDDSCFI'
--like 'H%I'
--in ('HXTRMDDSCFI','HDLXNDRSCFI','HPLNRDRVCFI','HPPRNDSSCFI','HXPLZCDSSFI','HPPRTDSSCFI','HXTRMSDSCFI','HDLXADRKCFI','HDLXAIRSCFI','HEXTBADSCFI','HMAEFDSSCFI','HMASZDRZCFI','HSPSADSSCFI','HXPLAADSSFI','HXPLWCDSCFI','HXTRMCDSCFI','HDESDDRVCFI','HGLMWDRSCFI','HDESCDRLMFI','HDESCHRLMFI','HSPPCDRSCFI','HDLXCDRSCFI','HDLXEIRSCFI','HGLMWDSSCFI','HPLNSDRVCFI','HDESPDRLMFI','HDLXADRSCFI','HDESKDRVCFI','HGLAADSSCFI','HKAZCDSSCFI','HPLNBDRVCFI','HXPLWSDSCFI','HGLMLDRSCFI','HSPSRDRSCFI','HPPLYIRSCFI','HSPSADRSCFI','HXOMYDRLMFI','HMAELDRSCFI','HPLNPDRLMFI','HHNDPDRKCFI','HPLNPHRZCFI','HSPPYIRSCFI','HSPSMDRSCFI','HXOMYDSZCFI','HMASEDSSCFI','HSPPCIRSCFI','HSPSRDSSCFI','HSPSYDRSCFI','HDESDDRLMFI','HPPRVDRSCFI','HSPSYDSSCFI','HMAEMDSSCFI','HSPSMDSSCFI','HXPLKADSSFI','HXTRGHDSCFI','HKAZCTSSCFI','HPPRRDRSCFI','HSPPNIRSCFI','HSPPYDRKCFI','HXTRBDDSCFI','HDLHEDRSCFI','HMAECDSSCFI','HXOMPDRLMFI','HXTRGDDSCFI','HSPPPTRSCFI','HSPIFDSSCFI','HDLXMDRKCFI','HGLMLDSSCFI','HGLMNDRSCFI','HGLRYDSSCFI','HMAELCSSCFI','HPPTKDSSCFI','HSPPEIRSCFI','HPLNSDRZCFI','HPPRRDSSCFI','HXPLZSDSSFI','HGLMNDSSCFI','HPLNSHRZCFI','HPPRNDRSCFI','HXPLWTDSCFI')
and prd.part_num like 'H%'
and prd.ACTIVE_FLG = 'Y'
and dlr.x_cust_grp_sales is not null;


--2) Take Backup of the Existing Network Margin Data in a new Table based on Month
create table ECUB90176909.CX_NET_MAR_BKP_24MAY14
as
(SELECT * FROM SIEBELEXT.CX_NETWORK_MARGIN
);

--3) Verify that the newly created backup table has the same number of records
select count(row_id) from ECUB90176909.CX_NET_MAR_BKP_24MAY14;--208899
select count(row_id) from SIEBELEXT.CX_NETWORK_MARGIN;--208899



DELETE FROM CX_NET_MAR_24MAY14 WHERE ROWID NOT IN ( SELECT MIN(ROWID) FROM CX_NET_MAR_24MAY14 GROUP BY ROW_ID );