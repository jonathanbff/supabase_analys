import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

/**
 * Validate required credentials from request body.
 */
const validateCredentials = (body) => {
  const { supabaseUrl, serviceRoleKey, dbPassword, managementToken } = body;
  if (!supabaseUrl || !serviceRoleKey || !dbPassword || !managementToken) {
    throw new Error('Missing required credentials.');
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error('Invalid Supabase URL format');
  }
};

/**
 * Get users with MFA status
 */
async function getUsersWithMFA(supabaseUrl, serviceRoleKey) {
  try {
    console.log('Fetching users from:', `${supabaseUrl}/auth/v1/admin/users`);
    
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MFA API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || 'Failed to fetch users';
      } catch (e) {
        errorMessage = errorText || 'Failed to fetch users';
      }
      
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    
    // Log the response structure to help debug
    console.log('Auth API Response structure:', {
      type: typeof responseData,
      keys: Object.keys(responseData),
      isArray: Array.isArray(responseData)
    });

    // Handle different response formats
    let users = [];
    if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData)) {
        users = responseData;
      } else if (responseData.users && Array.isArray(responseData.users)) {
        users = responseData.users;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        users = responseData.data;
      }
    }

    console.log(`Successfully fetched ${users.length} users`);
    
    // Map users with safe access to properties
    return users.map(user => ({
      id: user?.id || 'unknown',
      email: user?.email || 'unknown',
      mfaEnabled: Boolean(user?.factors?.length) || Boolean(user?.mfa_enabled) || false,
      lastSignIn: user?.last_sign_in_at || user?.last_sign_in || null
    }));
  } catch (error) {
    console.error('MFA check error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw new Error('Failed to fetch users: ' + error.message);
  }
}

/**
 * Get project settings using the management API
 */
async function getProjectSettings(projectRef, managementToken) {
  try {
    console.log('Fetching project settings for:', projectRef);
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Project Settings API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || 'Failed to fetch project settings';
      } catch (e) {
        errorMessage = errorText || 'Failed to fetch project settings';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Successfully fetched project settings');
    return data;
  } catch (error) {
    console.error('Project settings error:', error);
    throw new Error('Failed to fetch project settings: ' + error.message);
  }
}

/**
 * Get database connection configuration
 */
function getDatabaseConfig(supabaseUrl, dbPassword) {
  const projectRef = supabaseUrl.split('.')[0].split('//')[1];
  console.log('Configuring database connection for project:', projectRef);
  
  return {
    user: 'postgres',
    host: `db.${projectRef}.supabase.co`,
    database: 'postgres',
    password: dbPassword,
    port: 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000, // 10 second timeout
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  let dbClient = null;

  try {
    // Validate input
    validateCredentials(req.body);
    const { supabaseUrl, serviceRoleKey, dbPassword, managementToken } = req.body;

    // Extract project reference from URL
    const projectRef = supabaseUrl.split('.')[0].split('//')[1];
    console.log('Starting compliance scan for project:', projectRef);

    // 1. MFA Check
    console.log('Starting MFA check...');
    const mfaReport = await getUsersWithMFA(supabaseUrl, serviceRoleKey);
    const users = mfaReport || [];
    console.log(`MFA check complete. Found ${users.length} users`);

    // 2. RLS Check
    console.log('Starting RLS check...');
    const dbConfig = getDatabaseConfig(supabaseUrl, dbPassword);
    dbClient = new Client(dbConfig);
    
    try {
      console.log('Connecting to database...');
      await dbClient.connect();
      console.log('Database connection successful');
      
      const rlsRes = await dbClient.query(`
        SELECT tablename, rowsecurity 
        FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public'
      `);
      console.log(`RLS check complete. Found ${rlsRes.rowCount} tables`);

      const rlsReport = rlsRes.rows.map(row => ({
        table: row.tablename,
        rlsEnabled: row.rowsecurity
      }));

      // 3. PITR Check using direct API call
      console.log('Starting PITR check...');
      const projectSettings = await getProjectSettings(projectRef, managementToken);
      const pitrReport = [{
        id: projectRef,
        name: projectSettings.name || projectRef,
        pitrEnabled: projectSettings.point_in_time_recovery_enabled || false
      }];
      console.log('PITR check complete');

      // Final report
      const report = {
        timestamp: new Date().toISOString(),
        mfa: {
          totalUsers: users.length,
          compliantUsers: users.filter(u => u.mfaEnabled).length,
          users: users
        },
        rls: {
          totalTables: rlsReport.length,
          compliantTables: rlsReport.filter(t => t.rlsEnabled).length,
          tables: rlsReport
        },
        pitr: {
          totalProjects: 1,
          compliantProjects: pitrReport.filter(p => p.pitrEnabled).length,
          projects: pitrReport
        }
      };

      console.log('Compliance scan complete');
      res.status(200).json(report);
    } catch (dbError) {
      console.error('Database error:', {
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      });
      throw new Error('Database connection failed: ' + dbError.message);
    }
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (dbClient) {
      try {
        await dbClient.end();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
} 