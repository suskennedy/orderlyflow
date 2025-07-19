const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:Ahmad@789@db.ejgifuogadturszndnfo.supabase.co:5432/postgres';

async function exportSchema() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Get all tables
    const tablesQuery = `
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename;
    `;
    
    const tables = await client.query(tablesQuery);
    console.log('Found tables:', tables.rows);
    
    let schema = '';
    
    // Export table schemas
    for (const table of tables.rows) {
      const createTableQuery = `
        SELECT 
          'CREATE TABLE ' || quote_ident(schemaname) || '.' || quote_ident(tablename) || ' (' ||
          string_agg(
            quote_ident(column_name) || ' ' || data_type || 
            CASE 
              WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
              ELSE ''
            END ||
            CASE 
              WHEN is_nullable = 'NO' THEN ' NOT NULL'
              ELSE ''
            END ||
            CASE 
              WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
              ELSE ''
            END,
            ', '
            ORDER BY ordinal_position
          ) || ');' as create_statement
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        GROUP BY schemaname, tablename;
      `;
      
      const createTable = await client.query(createTableQuery, [table.schemaname, table.tablename]);
      
      if (createTable.rows.length > 0) {
        schema += '\n-- Table: ' + table.schemaname + '.' + table.tablename + '\n';
        schema += createTable.rows[0].create_statement + '\n';
      }
    }
    
    // Write to file
    fs.writeFileSync('schema.sql', schema);
    console.log('Schema exported to schema.sql');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

exportSchema(); 