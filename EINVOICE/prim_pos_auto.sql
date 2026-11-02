update siebel.s_contact set PR_HELD_POSTN_ID = '1-1WFA62WN' where row_id in (select row_id from siebel.s_user where login = 'ECUB90176909');
commit;
quit
