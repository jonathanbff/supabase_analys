import React, { useState, useRef } from 'react';
import {
  Button,
  Card,
  Alert,
  Spinner,
  Badge,
  Form,
  Container,
  Row,
  Col,
  Navbar,
  Nav,
} from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [credentials, setCredentials] = useState({
    supabaseUrl: '',
    serviceRoleKey: '',
    dbPassword: '',
    managementToken: '',
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const reportRef = useRef(null);

  const handleChange = (field, value) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const runChecks = async () => {
    if (
      !credentials.supabaseUrl ||
      !credentials.serviceRoleKey ||
      !credentials.dbPassword ||
      !credentials.managementToken
    ) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);
    setReport(null);
    setAiAnalysis(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setReport(data);

      // Get AI analysis
      const aiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Analyze this compliance report and provide recommendations',
          report: data
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        setAiAnalysis(aiData);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while scanning.');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`supabase_compliance_report_${new Date().toISOString()}.pdf`);
    } catch (err) {
      console.error('Error exporting to PDF:', err);
    }
  };

  const calculateProgress = () => {
    if (!report) return 0;
    const totalItems = report.mfa.totalUsers + report.rls.totalTables + report.pitr.totalProjects;
    const compliantItems = report.mfa.compliantUsers + report.rls.compliantTables + report.pitr.compliantProjects;
    return Math.round((compliantItems / totalItems) * 100) || 0;
  };

  const RadarAnimation = () => (
    <div className={styles.radarContainer}>
      <div className={styles.radar}>
        <div className={styles.securityIcons}>
          <span className={styles.securityIcon} style={{ top: '0%', left: '50%' }}>SAST</span>
          <span className={styles.securityIcon} style={{ top: '25%', right: '0%' }}>IaC Security</span>
          <span className={styles.securityIcon} style={{ bottom: '25%', right: '0%' }}>SCA</span>
          <span className={styles.securityIcon} style={{ bottom: '0%', left: '50%' }}>EoL Detection</span>
        </div>
      </div>
      <div className={styles.scanningText}>Scanning Security Configuration...</div>
    </div>
  );

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#" className="d-flex align-items-center">
            <i className="fas fa-shield-alt me-2"></i>
            Supabase Compliance Checker
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto">
              {report && (
                <Button variant="outline-light" size="sm" onClick={exportToPDF}>
                  <i className="fas fa-file-pdf me-2"></i>
                  Export Report
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container className="flex-grow-1">
        {loading && <RadarAnimation />}
        
        <Row className="mb-4">
          <Col md={8} className="mx-auto">
            <Card className="shadow-sm">
              <Card.Body>
                <div className="text-center mb-4">
                  <h2 className="mb-2">Security Compliance Scan</h2>
                  <p className="text-muted">
                    Enter your Supabase credentials to start the compliance check
                  </p>
                </div>

                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Supabase URL</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="https://your-project.supabase.co"
                      value={credentials.supabaseUrl}
                      onChange={(e) => handleChange('supabaseUrl', e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Service Role Key</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter Service Role Key"
                      value={credentials.serviceRoleKey}
                      onChange={(e) => handleChange('serviceRoleKey', e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Database Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter Database Password"
                      value={credentials.dbPassword}
                      onChange={(e) => handleChange('dbPassword', e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Management Token</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter Management Token"
                      value={credentials.managementToken}
                      onChange={(e) => handleChange('managementToken', e.target.value)}
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    onClick={runChecks}
                    disabled={loading}
                    className="w-100 py-2"
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Running Scan...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-shield-check me-2"></i>
                        Start Compliance Scan
                      </>
                    )}
                  </Button>
                </Form>

                {error && (
                  <Alert variant="danger" className="mt-3">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Compliance Report */}
        {report && (
          <div ref={reportRef} className="mb-5">
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm">
                  <Card.Body className="text-center">
                    <h3 className="mb-3">Overall Compliance Score</h3>
                    <div className="progress" style={{ height: '25px' }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${calculateProgress()}%` }}
                        aria-valuenow={calculateProgress()}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {calculateProgress()}%
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Card className="shadow-sm h-100">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-user-shield me-2"></i>
                      MFA Status
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <small className="text-muted">Compliant Users</small>
                      <h3>{report.mfa.compliantUsers}/{report.mfa.totalUsers}</h3>
                    </div>
                    {report.mfa.users.map((user) => (
                      <div key={user.id} className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-truncate me-2">{user.email}</span>
                        <Badge bg={user.mfaEnabled ? 'success' : 'danger'}>
                          {user.mfaEnabled ? 'Enabled' : 'Required'}
                        </Badge>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="shadow-sm h-100">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-table me-2"></i>
                      RLS Status
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <small className="text-muted">Protected Tables</small>
                      <h3>{report.rls.compliantTables}/{report.rls.totalTables}</h3>
                    </div>
                    {report.rls.tables.map((table) => (
                      <div key={table.table} className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-truncate me-2">{table.table}</span>
                        <Badge bg={table.rlsEnabled ? 'success' : 'danger'}>
                          {table.rlsEnabled ? 'Enabled' : 'Required'}
                        </Badge>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="shadow-sm h-100">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-clock-rotate-left me-2"></i>
                      PITR Status
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <small className="text-muted">Protected Projects</small>
                      <h3>{report.pitr.compliantProjects}/{report.pitr.totalProjects}</h3>
                    </div>
                    {report.pitr.projects.map((project) => (
                      <div key={project.id} className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-truncate me-2">{project.name}</span>
                        <Badge bg={project.pitrEnabled ? 'success' : 'danger'}>
                          {project.pitrEnabled ? 'Enabled' : 'Required'}
                        </Badge>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* AI Analysis in Report */}
            {aiAnalysis && (
              <Row className="mt-4">
                <Col>
                  <Card className="shadow-sm">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">
                        <i className="fas fa-robot me-2"></i>
                        AI Security Analysis
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <div>
                        <h5>Overall Assessment</h5>
                        <p className="mb-4">{aiAnalysis.response}</p>

                        <h5>Risk Analysis</h5>
                        <div className="mb-4">
                          {aiAnalysis.analysis.risks.high.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-danger">High Risks:</h6>
                              <ul>
                                {aiAnalysis.analysis.risks.high.map((risk, i) => (
                                  <li key={i}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {aiAnalysis.analysis.risks.medium.length > 0 && (
                            <div>
                              <h6 className="text-warning">Medium Risks:</h6>
                              <ul>
                                {aiAnalysis.analysis.risks.medium.map((risk, i) => (
                                  <li key={i}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <h5>Recommendations</h5>
                        <ul className="mb-4">
                          {aiAnalysis.analysis.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>

                        <h5>Compliance Details</h5>
                        <Row>
                          {Object.entries(aiAnalysis.analysis.details).map(([key, value]) => (
                            <Col md={4} key={key}>
                              <div className="mb-3">
                                <h6 className="text-uppercase">{key}</h6>
                                <div className="progress mb-2">
                                  <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{ width: `${value.percentage}%` }}
                                    aria-valuenow={value.percentage}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  >
                                    {value.percentage}%
                                  </div>
                                </div>
                                <small>
                                  {value.compliantCount} / {value.totalCount} compliant
                                </small>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </div>
        )}

        {/* AI Analysis Section (outside of PDF report) */}
        {aiAnalysis && (
          <div className={styles.aiAnalysis}>
            <h3>
              <i className="fas fa-robot me-2"></i>
              AI Security Analysis
            </h3>
            <div className={styles.aiAnalysisContent}>
              <h4>Overall Assessment</h4>
              <p>{aiAnalysis.response}</p>
              
              <h4>Risk Analysis</h4>
              <div className="mb-3">
                {aiAnalysis.analysis.risks.high.length > 0 && (
                  <Alert variant="danger">
                    <strong>High Risks:</strong>
                    <ul>
                      {aiAnalysis.analysis.risks.high.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
                
                {aiAnalysis.analysis.risks.medium.length > 0 && (
                  <Alert variant="warning">
                    <strong>Medium Risks:</strong>
                    <ul>
                      {aiAnalysis.analysis.risks.medium.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
              </div>

              <h4>Recommendations</h4>
              <ul className="mb-4">
                {aiAnalysis.analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>

              <h4>Compliance Scores</h4>
              <Row>
                {Object.entries(aiAnalysis.analysis.details).map(([key, value]) => (
                  <Col md={4} key={key}>
                    <Card className="mb-3">
                      <Card.Body>
                        <h5 className="text-uppercase">{key}</h5>
                        <div className="progress mb-2">
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${value.percentage}%` }}
                            aria-valuenow={value.percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {value.percentage}%
                          </div>
                        </div>
                        <small>
                          {value.compliantCount} / {value.totalCount} compliant
                        </small>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}
      </Container>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-auto">
        <Container className="text-center">
          <small>
            &copy; {new Date().getFullYear()} Supabase Compliance Checker. All rights reserved.
          </small>
        </Container>
      </footer>
    </div>
  );
} 