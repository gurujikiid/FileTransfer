select table_name from user_tables;



begin 
for t in (select table_name from user_tables where TABLE_NAME like 'TEMP%' )
loop 
    execute IMMEDIATE 'drop table "' ||t.table_name ||'"
    cascade constraints';
    end loop;
end
    ;
	
	
	

SELECT 
   segment_name AS table_name,
   ROUND(SUM(bytes)/1024/1024, 2) AS size_mb
FROM user_segments
WHERE segment_type = 'TABLE'
GROUP BY segment_name
ORDER BY size_mb DESC;