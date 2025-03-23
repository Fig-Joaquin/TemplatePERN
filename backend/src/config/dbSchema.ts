import { Pool } from 'pg';
import { config } from './config';

// Create pool for schema queries
const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port
});

// Type definitions
export interface TableSchema {
  columns: Record<string, string>;
}

export interface DatabaseSchema {
  [tableName: string]: TableSchema;
}

export interface Relationship {
  references: string;
  relationship: string;
}

export interface TableRelationships {
  [columnName: string]: Relationship;
}

export interface DatabaseRelationships {
  [tableName: string]: TableRelationships;
}

// Function to get all tables in the database
async function getTables(): Promise<string[]> {
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  `;
  
  const result = await pool.query(query);
  return result.rows.map(row => row.table_name);
}

// Function to get columns for a specific table
async function getTableColumns(tableName: string): Promise<Record<string, string>> {
  const query = `
    SELECT column_name, data_type, 
           CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END as nullable,
           CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END as default_val
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = $1
    ORDER BY ordinal_position
  `;
  
  const result = await pool.query(query, [tableName]);
  
  const columns: Record<string, string> = {};
  for (const row of result.rows) {
    columns[row.column_name] = `${row.data_type}${row.nullable}${row.default_val}`;
  }
  
  return columns;
}

// Function to get primary keys for a table
async function getPrimaryKey(tableName: string): Promise<string[]> {
  const query = `
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_name = $1
    AND tc.table_schema = 'public'
  `;
  
  const result = await pool.query(query, [tableName]);
  return result.rows.map(row => row.column_name);
}

// Function to get foreign key relationships
async function getRelationships(): Promise<DatabaseRelationships> {
  const query = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  `;
  
  const result = await pool.query(query);
  
  const relationships: DatabaseRelationships = {};
  
  for (const row of result.rows) {
    if (!relationships[row.table_name]) {
      relationships[row.table_name] = {};
    }
    
    relationships[row.table_name][row.column_name] = {
      references: `${row.foreign_table_name}.${row.foreign_column_name}`,
      relationship: 'many-to-one' // Default relationship type
    };
  }
  
  return relationships;
}

// Function to get the complete database schema
export async function getDatabaseSchema(): Promise<DatabaseSchema> {
  try {
    const tables = await getTables();
    const schema: DatabaseSchema = {};
    
    for (const tableName of tables) {
      const columns = await getTableColumns(tableName);
      const primaryKeys = await getPrimaryKey(tableName);
      
      // Mark primary keys in the column definitions
      for (const pk of primaryKeys) {
        if (columns[pk]) {
          columns[pk] += ' PRIMARY KEY';
        }
      }
      
      schema[tableName] = { columns };
    }
    
    return schema;
  } catch (error) {
    console.error('Error fetching database schema:', error);
    throw new Error('Failed to fetch database schema');
  }
}

// Function to get all relationships in the database
export async function getDatabaseRelationships(): Promise<DatabaseRelationships> {
  try {
    return await getRelationships();
  } catch (error) {
    console.error('Error fetching database relationships:', error);
    throw new Error('Failed to fetch database relationships');
  }
}

// For backwards compatibility with existing code
export let dbSchema: DatabaseSchema = {};
export let dbRelationships: DatabaseRelationships = {};

// Initialize schema on module load
(async () => {
  try {
    dbSchema = await getDatabaseSchema();
    dbRelationships = await getDatabaseRelationships();
    console.log('Database schema loaded successfully');
    console.log('Database schema:', dbSchema);
    console.log('Database relationships:', dbRelationships);
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
  }
})();

// Export a function to refresh schema on demand
export async function refreshSchema(): Promise<void> {
  try {
    dbSchema = await getDatabaseSchema();
    dbRelationships = await getDatabaseRelationships();
    console.log('Database schema refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh database schema:', error);
    throw error;
  }
}
