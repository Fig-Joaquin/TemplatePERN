import { Pool } from 'pg';
import { config } from '../../config/config';
import { dbSchema } from '../../config/dbSchema';

// Create database connection pool
const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port
});

// Basic SQL validation to check for non-existent tables
export function validateSQL(sql: string): { valid: boolean, error?: string } {
  const availableTables = Object.keys(dbSchema).map(name => name.toLowerCase());
  
  // This is a simplified approach - a more robust parser would be better
  const sqlLower = sql.toLowerCase();
  
  // Primero verificar si la consulta está vacía
  if (!sql || !sql.trim()) {
    return {
      valid: false,
      error: 'La consulta SQL está vacía'
    };
  }
  
  // Check for table references in common SQL clauses
  let tableMatches: string[] = [];
  
  // Match FROM clause
  const fromRegex = /from\s+([a-z0-9_]+)/g;
  let match;
  while ((match = fromRegex.exec(sqlLower)) !== null) {
    tableMatches.push(match[1]);
  }
  
  // Match JOIN clauses
  const joinRegex = /join\s+([a-z0-9_]+)/g;
  while ((match = joinRegex.exec(sqlLower)) !== null) {
    tableMatches.push(match[1]);
  }
  
  // Check if any referenced table doesn't exist
  for (const table of tableMatches) {
    if (!availableTables.includes(table)) {
      return {
        valid: false,
        error: `Table '${table}' does not exist in the database schema. Available tables: ${availableTables.join(', ')}`
      };
    }
  }
  
  // Verificar columnas referenciadas con tabla prefijo (table.column)
  const columnRegex = /([a-z0-9_]+)\.([a-z0-9_]+)/gi;
  while ((match = columnRegex.exec(sqlLower)) !== null) {
    const [_, table, column] = match;
    if (availableTables.includes(table.toLowerCase())) {
      const tableColumns = Object.keys(dbSchema[table].columns).map(col => col.toLowerCase());
      if (!tableColumns.includes(column.toLowerCase())) {
        return {
          valid: false,
          error: `Column '${column}' does not exist in table '${table}'`
        };
      }
    }
  }
  
  return { valid: true };
}

export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  // Validate the SQL query before execution
  const validation = validateSQL(sql);
  if (!validation.valid) {
    throw new Error(`Invalid SQL query: ${validation.error}`);
  }
  
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Error executing SQL query:', error);
    throw error;
  }
}

// Helper function to escape strings for SQL injection prevention
export function escapeSQLString(str: string): string {
  return str.replace(/'/g, "''");
}

// Function to safely close the pool when application shuts down
export async function closePool(): Promise<void> {
  await pool.end();
}
