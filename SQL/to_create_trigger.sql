CREATE OR REPLACE EDITIONABLE TRIGGER "ECUB90176909"."S_PROD_INV_T1" 
      after update ON SIEBEL.S_PROD_INV
      for each row
declare
      "upd_flag" boolean := FALSE;
       v_user varchar2(20);
begin
   --SELECT sys_context('USERENV', 'SESSION_USER') INTO v_user FROM DUAL;   
   if updating('QTY') then
      "upd_flag" := TRUE;
   end if;
   if updating('X_QTY_OIL') then
      "upd_flag" := TRUE;
   end if;
   if "upd_flag" = TRUE then
   insert into SIEBELEXT.S_PROD_INV_AUDIT (RECORD_ID, USER_ID, UPDATED_DT,  QTY_OLD_VAL, QTY_NEW_VAL, QTY_OIL_OLD_VAL, QTY_OIL_NEW_VAL, PROD_INV_CAT_ID, PROD_INVLOC_ID )
   values (:old.ROW_ID, 'KIO' , sysdate,:old.QTY ,:new.QTY,:old.X_QTY_OIL,:new.X_QTY_OIL , :old.PROD_INV_CAT_ID, :old.PROD_INVLOC_ID);
   
    UPDATE SIEBELEXT.S_PROD_INV_AUDIT A 
    SET (A.INV_NAME , A.PART_NUM, A.AVAIL_CD ,A.ORG_ID) = (select INV.NAME, P.PART_NUM, L.AVAIL_CD, INV.BU_ID
        from SIEBEL.S_INVLOC INV, siebel.S_PROD_INVLOC PINV, SIEBEL.S_PROD_INT P,  siebel.S_PROD_INV_CAT L
        where INV.ROW_ID = PINV.INVLOC_ID
        AND PINV.PROD_ID = P.ROW_ID
        AND PINV.ROW_ID = A.PROD_INVLOC_ID
        AND A.PROD_INV_CAT_ID = L.ROW_ID )
        where A.RECORD_ID = :old.ROW_ID
    ;
   end if;
end;

