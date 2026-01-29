-- Ver estructura de pr_sis_perfiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pr_sis_perfiles'
ORDER BY ordinal_position;
