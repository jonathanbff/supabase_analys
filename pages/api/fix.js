import { Client } from 'pg';

/**
 * API handler for applying automated fixes.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { issueType, target, credentials } = req.body;

  try {
    switch(issueType) {
      case 'RLS':
        // Validate database credentials
        if (!credentials.dbPassword || !credentials.supabaseUrl) {
          throw new Error('Database credentials missing');
        }
        const dbHost = new URL(credentials.supabaseUrl).hostname;
        const dbClient = new Client({
          user: 'postgres',
          host: dbHost,
          database: 'postgres',
          password: credentials.dbPassword,
          port: 5432,
          ssl: { rejectUnauthorized: false }
        });
        await dbClient.connect();
        // Validate the table name to prevent SQL injection
        if (!/^[a-zA-Z0-9_]+$/.test(target)) {
          throw new Error('Invalid table name');
        }
        await dbClient.query(`ALTER TABLE "${target}" ENABLE ROW LEVEL SECURITY`);
        await dbClient.end();
        return res.json({ success: true, message: `RLS enabled for table ${target}` });
      
      case 'MFA':
        // For demonstration: implement your email/notification logic here.
        return res.json({ success: true, message: 'MFA prompt sent to user' });
      
      case 'PITR':
        if (!credentials.managementToken) {
          throw new Error('Management token is missing');
        }
        
        // Extract project reference from URL
        const projectRef = credentials.supabaseUrl.split('.')[0].split('//')[1];
        
        // Enable PITR using management API
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${credentials.managementToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            point_in_time_recovery_enabled: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to enable PITR');
        }

        return res.json({ success: true, message: `PITR enabled for project ${target.name || projectRef}` });
      
      default:
        throw new Error('Unknown issue type');
    }
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to apply fix' });
  }
} 