UPDATE siebel.s_table tab SET tab.obj_locked_flg = 'Y', tab.obj_locked_date = '12-MAY-23 02:17:22', tab.obj_locked_by = '2-7A0UWMS', tab.obj_locked_lang = null
WHERE tab.name = 'CX_OFFER_RFM';

UPDATE siebel.s_table tab SET tab.obj_locked_flg = 'N', tab.obj_locked_date = null, tab.obj_locked_by = null, tab.obj_locked_lang = null 
WHERE tab.name = 'CX_OFFER_RFM';

select * from siebel.s_user where login = 'EIBM90178150';