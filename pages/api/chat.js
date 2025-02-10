import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Analyzes the compliance report and returns structured insights
 */
function analyzeReport(report) {
  const mfaScore = (report.mfa.compliantUsers / report.mfa.totalUsers) * 100;
  const rlsScore = (report.rls.compliantTables / report.rls.totalTables) * 100;
  const pitrScore = (report.pitr.compliantProjects / report.pitr.totalProjects) * 100;
  const overallScore = (mfaScore + rlsScore + pitrScore) / 3;

  return {
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
}

/**
 * API endpoint for AI chat integration.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { message, report } = req.body;

  try {
    // Validate input
    if (!message || !report) {
      throw new Error('Message and report data are required');
    }

    // Analyze the report
    const analysis = analyzeReport(report);

    // Add risks based on scores
    if (analysis.scores.mfa < 100) {
      analysis.risks.high.push('MFA not enabled for all users');
    }
    if (analysis.scores.rls < 100) {
      analysis.risks.high.push('RLS not enabled for all tables');
    }
    if (analysis.scores.pitr < 100) {
      analysis.risks.medium.push('PITR not enabled for all projects');
    }

    // Add recommendations
    if (analysis.scores.mfa < 100) {
      analysis.recommendations.push('Enable MFA for all users to enhance account security');
    }
    if (analysis.scores.rls < 100) {
      analysis.recommendations.push('Enable RLS on all tables to prevent unauthorized data access');
    }
    if (analysis.scores.pitr < 100) {
      analysis.recommendations.push('Enable PITR to ensure data recovery capabilities');
    }

    const systemMessage = `
      You're a Supabase compliance expert. Analyze this report:
      
      Current Compliance Status:
      - MFA: ${report.mfa.compliantUsers}/${report.mfa.totalUsers} users compliant (${analysis.scores.mfa}%)
      - RLS: ${report.rls.compliantTables}/${report.rls.totalTables} tables compliant (${analysis.scores.rls}%)
      - PITR: ${report.pitr.compliantProjects}/${report.pitr.totalProjects} projects compliant (${analysis.scores.pitr}%)
      
      Overall Score: ${analysis.scores.overall}%
      
      High Risks: ${analysis.risks.high.join(', ') || 'None'}
      Medium Risks: ${analysis.risks.medium.join(', ') || 'None'}
      Low Risks: ${analysis.risks.low.join(', ') || 'None'}
      
      Recommendations:
      ${analysis.recommendations.map(rec => '- ' + rec).join('\n')}
      
      Please provide a detailed analysis based on this data and the user's question.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1024
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) throw new Error('No response from AI service');

    // Return both the AI response and the structured analysis
    res.json({
      response: aiResponse,
      analysis: {
        timestamp: new Date().toISOString(),
        scores: analysis.scores,
        risks: analysis.risks,
        recommendations: analysis.recommendations,
        details: {
          mfa: {
            compliantCount: report.mfa.compliantUsers,
            totalCount: report.mfa.totalUsers,
            percentage: analysis.scores.mfa
          },
          rls: {
            compliantCount: report.rls.compliantTables,
            totalCount: report.rls.totalTables,
            percentage: analysis.scores.rls
          },
          pitr: {
            compliantCount: report.pitr.compliantProjects,
            totalCount: report.pitr.totalProjects,
            percentage: analysis.scores.pitr
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error processing chat request' });
  }
} 