/**
 * Utility functions for Supabase API interactions
 */

/**
 * Validates Supabase credentials format
 */
export const validateCredentials = (credentials) => {
  const { supabaseUrl, serviceRoleKey, dbPassword, managementToken } = credentials;
  
  if (!supabaseUrl || !serviceRoleKey || !dbPassword || !managementToken) {
    throw new Error('All credentials are required');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error('Invalid Supabase URL format');
  }

  // Validate service role key format
  if (!serviceRoleKey.startsWith('eyJ')) {
    throw new Error('Invalid service role key format');
  }

  // Validate management token format
  if (!managementToken.startsWith('sbp_')) {
    throw new Error('Invalid management token format');
  }
};

/**
 * Extracts project reference from Supabase URL
 */
export const getProjectRef = (supabaseUrl) => {
  try {
    return supabaseUrl.split('.')[0].split('//')[1];
  } catch (e) {
    throw new Error('Could not extract project reference from URL');
  }
};

/**
 * Formats database connection config
 */
export const getDatabaseConfig = (supabaseUrl, dbPassword) => {
  const projectRef = getProjectRef(supabaseUrl);
  
  return {
    user: 'postgres',
    host: `db.${projectRef}.supabase.co`,
    database: 'postgres',
    password: dbPassword,
    port: 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  };
};

/**
 * Formats API headers for Supabase requests
 */
export const getApiHeaders = (serviceRoleKey) => ({
  'Authorization': `Bearer ${serviceRoleKey}`,
  'apikey': serviceRoleKey,
  'Content-Type': 'application/json'
}); 