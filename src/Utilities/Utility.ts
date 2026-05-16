import { v4 as uuidv4 } from 'uuid'; 
import {db} from '../Connections/sqlConfig'
import { Employee } from '../Models/Employee';
export function generateAutocode(data: any[], fieldName: string): string {
    if (!data || data.length === 0) {
      return '1'; // Or your initial autocode value
    } 
  
    // Sort the array in descending order based on the specified field
    const sortedData = [...data].sort((a, b) => {
      const valueA = a[fieldName];
      const valueB = b[fieldName];
  
      // Handle cases where the field might not exist or is not comparable
      if (valueA === undefined || valueA === null) return 1;
      if (valueB === undefined || valueB === null) return -1;
  
      // Assuming the field value can be directly compared (numbers or strings)
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return valueB - valueA; // Descending for numbers
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        return valueB.localeCompare(valueA); // Descending for strings
      } else {
        // Handle mixed types or non-comparable types as needed
        return 0;
      }
    });
  
    const largestValue = sortedData[0][fieldName];
  
    if (typeof largestValue === 'number') {
      return String(largestValue + 1).padStart(String(largestValue).length, '0'); // Increment number, pad with leading zeros
    } else if (typeof largestValue === 'string') {
      // Try to increment if the string represents a number
      const num = parseInt(largestValue, 10);
      if (!isNaN(num)) {
        return String(num + 1).padStart(largestValue.length, '0');
      } else {
        // If it's not a number string, you might need a different logic
        // (e.g., append a character, use a different encoding)
        return `${largestValue}A`; // Simple example: append 'A'
      }
    } else {
      return '1'; // Default if the largest value is not a number or string
    }
  }

  export function generateUUID():string{
    return uuidv4();
  }

  // In a separate utility function or within your Database class (less ideal)
  export async function getActiveConnections(): Promise<number> { 
  const pool = await db.getPool(); // Ensure the pool is initialized
  try {
      const result = await pool.request().query(`SELECT COUNT(*) AS ActiveConnections FROM sys.dm_exec_sessions`);
      return result.recordset[0].ActiveConnections;
  } catch (error: any) {
      //console.error("Error getting active connection count:", error.message);
     // throw error;
     return 0; 
  }
}

 