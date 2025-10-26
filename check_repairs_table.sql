-- SQL Queries to check existing triggers, functions, and constraints on repairs table
-- Run these queries to identify what's causing the due_date error

-- 1. Check for existing triggers on repairs table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'repairs'
ORDER BY trigger_name;

-- 2. Check for functions that might be used by triggers
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND (routine_name LIKE '%repair%' OR routine_name LIKE '%calendar%')
ORDER BY routine_name;

-- 3. Check for constraints on repairs table
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'repairs'
ORDER BY constraint_name;

-- 4. Check for foreign key constraints specifically
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'repairs';

-- 5. Check for any views that might reference repairs table
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%repairs%'
ORDER BY table_name;

-- 6. Check for any rules on repairs table
SELECT 
    rule_name,
    event_object_table,
    action_statement
FROM information_schema.rules 
WHERE event_object_table = 'repairs';

-- 7. Check for any indexes on repairs table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'repairs'
ORDER BY indexname;

-- 8. Check for any policies (RLS) on repairs table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'repairs'
ORDER BY policyname;

-- 9. Check the actual table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'repairs'
ORDER BY ordinal_position;

-- 10. Check for any functions that might be called by triggers
SELECT 
    p.proname AS function_name,
    p.prosrc AS function_source,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_proc p
JOIN pg_trigger t ON p.oid = t.tgfoid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'repairs'
ORDER BY p.proname;

