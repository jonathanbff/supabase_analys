/**
 * Utility functions for report generation and analysis
 */

/**
 * Calculates overall compliance score
 */
export const calculateOverallScore = (report) => {
  if (!report) return 0;
  const totalItems = report.mfa.totalUsers + report.rls.totalTables + report.pitr.totalProjects;
  const compliantItems = report.mfa.compliantUsers + report.rls.compliantTables + report.pitr.compliantProjects;
  return Math.round((compliantItems / totalItems) * 100) || 0;
};

/**
 * Analyzes security report and provides structured insights
 */
export const analyzeReport = (report) => {
  const mfaScore = (report.mfa.compliantUsers / report.mfa.totalUsers) * 100;
  const rlsScore = (report.rls.compliantTables / report.rls.totalTables) * 100;
  const pitrScore = (report.pitr.compliantProjects / report.pitr.totalProjects) * 100;
  const overallScore = (mfaScore + rlsScore + pitrScore) / 3;

  const analysis = {
    scores: {
      overall: Math.round(overallScore),
      mfa: Math.round(mfaScore),
      rls: Math.round(rlsScore),
      pitr: Math.round(pitrScore)
    },
    risks: {
      high: [],
      medium: [],
      low: []
    },
    recommendations: []
  };

  // Assess risks and add recommendations
  if (analysis.scores.mfa < 100) {
    analysis.risks.high.push('MFA not enabled for all users');
    analysis.recommendations.push('Enable MFA for all users to enhance account security');
  }

  if (analysis.scores.rls < 100) {
    analysis.risks.high.push('RLS not enabled for all tables');
    analysis.recommendations.push('Enable RLS on all tables to prevent unauthorized data access');
  }

  if (analysis.scores.pitr < 100) {
    analysis.risks.medium.push('PITR not enabled for all projects');
    analysis.recommendations.push('Enable PITR to ensure data recovery capabilities');
  }

  return analysis;
};

/**
 * Formats timestamp for report generation
 */
export const formatTimestamp = (date = new Date()) => {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

/**
 * Generates report filename
 */
export const generateReportFilename = (projectRef) => {
  return `supabase_security_report_${projectRef}_${formatTimestamp()}.pdf`;
};

/**
 * Formats compliance status for display
 */
export const getComplianceStatus = (isCompliant) => ({
  text: isCompliant ? 'Enabled' : 'Required',
  variant: isCompliant ? 'success' : 'danger'
}); 