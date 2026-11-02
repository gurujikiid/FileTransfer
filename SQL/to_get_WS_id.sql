//to get workspace id of main
SELECT row_id
FROM siebel.s_workspace
WHERE name = 'MAIN'   AND repository_id =
   (SELECT row_id FROM siebel.s_repository WHERE name = 'Siebel Repository');