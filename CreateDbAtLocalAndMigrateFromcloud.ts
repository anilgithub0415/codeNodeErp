import { Router, Request, Response, RequestHandler } from 'express';
import sql from 'mssql';

interface DBConfig extends sql.config {
    server: string;
    user?: string;
    password?: string;
    options?: sql.config['options'];
}

interface MigrationRequestBody {
    cloudConfig: DBConfig;
    localConfig: DBConfig;
    newDbName: string;
}

interface SchemaRow {
    TableName: string;
    ColumnName: string;
    DataType: string;
    MaxLength: number;
    IsNullable: boolean;
    IsIdentity: boolean;
    IsPrimaryKey: number;
}

/*Send this body via Postman
{
  "cloudConfig": {
    "server": "den1.mssql8.gear.host",
    "user": "saishrustitest",
    "password": "YOUR_ACTUAL_PASSWORD_HERE",
    "database": "saishrustitest",
    "options": {
      "encrypt": true,
      "trustServerCertificate": true
    }
  },
  "localConfig": {
    "server": "localhost",
    "user": "sa",
    "password": "saadmin",
    "database": "ignitefuture",
    "options": {
      "encrypt": false,
      "trustServerCertificate": true
    }
  },
  "newDbName": "ignitefuture"
}
  */
//  var  cloudConfig:{
//     "server": "den1.mssql8.gear.host",
//     "user": "saishrustitest",
//     "password": "YOUR_ACTUAL_PASSWORD_HERE",
//     "database": "saishrustitest",
//     "options": {
//       "encrypt": true,
//       "trustServerCertificate": true
//     }
//  }
//  var localConfig:{
//     "server": "localhost",
//     "user": "sa",
//     "password": "saadmin",
//     "database": "ignitefuture",
//     "options": {
//       "encrypt": false,
//       "trustServerCertificate": true
//     }
//   }
  //var newDbName: "ignitefuture"

const router = Router();

const migrateDatabaseHandler: RequestHandler = async (
    req: Request<{}, {}, MigrationRequestBody>, 
    res: Response
): Promise<void> => {

    console.log('Migration Started......................................................');
    
    const { cloudConfig, localConfig, newDbName } = req.body;
    
    let cloudPool: sql.ConnectionPool | null = null;
    let localMasterPool: sql.ConnectionPool | null = null;
    let localNewDbPool: sql.ConnectionPool | null = null;

    try {
        // 1. Establish initial connections
        cloudPool = await sql.connect(cloudConfig);
        localMasterPool = await sql.connect({ ...localConfig, database: 'master' });

        // 2. OVERWRITE CHECK: Force drop existing local DB if it exists
        // This script kicks out open connections (like SSMS) to prevent dropping from freezing
        const overwriteQuery = `
            IF EXISTS (SELECT name FROM sys.databases WHERE name = N'${newDbName}')
            BEGIN
                ALTER DATABASE [${newDbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                DROP DATABASE [${newDbName}];
            END
            CREATE DATABASE [${newDbName}];
        `;
        //commented creation of DB, we r using already existing DB
        //await localMasterPool.request().query(overwriteQuery);        await localMasterPool.close();

        // 3. Connect directly to your newly created local database
        localNewDbPool = await sql.connect({ ...localConfig, database: newDbName });

        // 4. Fetch rich database schema metadata from cloud engine catalog
        const schemaQuery = `
            SELECT 
                t.name AS TableName,
                c.name AS ColumnName,
                tp.name AS DataType,
                c.max_length AS MaxLength,
                c.is_nullable AS IsNullable,
                c.is_identity AS IsIdentity,
                ISNULL((SELECT 1 FROM sys.index_columns ic 
                        JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                        WHERE ic.object_id = t.object_id AND ic.column_id = c.column_id AND i.is_primary_key = 1), 0) AS IsPrimaryKey
            FROM sys.tables t
            JOIN sys.columns c ON t.object_id = c.object_id
            JOIN sys.types tp ON c.user_type_id = tp.user_type_id
            WHERE t.is_ms_shipped = 0
            ORDER BY t.name, c.column_id
        `;
        
        const schemaResult = await cloudPool.request().query<SchemaRow>(schemaQuery);
        
        // Group extracted metadata columns by their Parent Tables
        const tables: Record<string, SchemaRow[]> = {};
        schemaResult.recordset.forEach((row: SchemaRow) => {
            if (!tables[row.TableName]) {
                tables[row.TableName] = [];
            }
            tables[row.TableName].push(row);
        });

        // 5. Sequence over tables to build DDL structural changes and pipe data
        for (const tableName of Object.keys(tables)) {
            const columns = tables[tableName];
            const hasIdentity = columns.some((col) => col.IsIdentity);

            // Dynamically construct safe DDL Column Generation syntax strings
            const columnDefinitions = columns.map((col) => {
                let def = `[${col.ColumnName}] ${col.DataType}`;
                
                if (['varchar', 'nvarchar', 'char', 'nchar', 'binary', 'varbinary'].includes(col.DataType)) {
                    def += col.MaxLength === -1 ? '(MAX)' : `(${col.MaxLength})`;
                }
                if (col.IsIdentity) def += ' IDENTITY(1,1)';
                if (col.IsPrimaryKey) def += ' PRIMARY KEY';
                def += col.IsNullable ? ' NULL' : ' NOT NULL';
                return def;
            }).join(', ');

            // Execute local database table generation
            await localNewDbPool.request().query(`CREATE TABLE [${tableName}] (${columnDefinitions})`);

            // 6. Memory streams execution block wrapped into native TS Promise
            if (cloudPool) {
                await new Promise<void>((resolve, reject) => {
                    const request = new sql.Request(cloudPool!);
                    request.stream = true; // Flips library behavior into Event-Emitters streaming
                    request.query(`SELECT * FROM [${tableName}]`);

                    const bulk = new sql.Table(`[${tableName}]`);
                    columns.forEach((col) => {
                        bulk.columns.add(col.ColumnName, sql.VarChar, { nullable: col.IsNullable }); 
                    });

                    request.on('row', (row: Record<string, any>) => {
                        bulk.rows.add(...Object.values(row));
                    });

                    request.on('done', async () => {
                        try {
                            if (bulk.rows.length > 0 && localNewDbPool) {
                                // Enable manual key updates override parameters
                                if (hasIdentity) {
                                    await localNewDbPool.request().query(`SET IDENTITY_INSERT [${tableName}] ON`);
                                }

                                // Execute highly compressed batch transaction pipeline write
                                await localNewDbPool.request().bulk(bulk);

                                if (hasIdentity) {
                                    await localNewDbPool.request().query(`SET IDENTITY_INSERT [${tableName}] OFF`);
                                }
                            }
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    });

                    request.on('error', (err: Error) => reject(err));
                });
            }
        }
console.log('Migration Done');
        res.status(200).json({ success: true, message: `Database ${newDbName} overwritten and migrated flawlessly!` });

    } catch (error: any) {
        console.error("Migration crashed out:", error);
        res.status(500).json({ success: false, error: error.message || "Unknown error occurred" });
    } finally {
        if (cloudPool) await cloudPool.close();
        if (localNewDbPool) await localNewDbPool.close();
    }
};

router.post('', migrateDatabaseHandler);

export default router;


/* 2 ways to find current DB name

1. 
        // Query the active connection pool directly
        const result = await pool.request().query('SELECT DB_NAME() AS currentDb');
        const currentDatabaseName = result.recordset[0].currentDb;

        console.log(currentDatabaseName); // Outputs: "ignitefuture" or "master"


2.     // Read directly from your active pool configuration
        const currentDatabaseName = pool.config.database;

        console.log(currentDatabaseName); // Outputs: "ignitefuture"


 */