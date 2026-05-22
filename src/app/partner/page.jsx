'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { useSocket } from '@/lib/socket';
import {
  Container,
  Row,
  Col,
  Card,
  Navbar,
  Nav,
  Button,
  Table,
  Badge,
  Form,
  Modal,
  Spinner
} from 'react-bootstrap';
import {
  BoxArrowRight,
  Files,
  Plus,
  People,
  Key,
  CheckCircle,
  Clock,
  Trash,
  PencilSquare,
  ToggleOn,
  ToggleOff
} from 'react-bootstrap-icons';
import ThemeToggle from '@/components/ThemeToggle';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function PartnerDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const [createCodeOpen, setCreateCodeOpen] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [myShare, setMyShare] = useState(0); 
  const [startDate, setStartDate] = useState(''); // New state for create modal
  const [endDate, setEndDate] = useState('');     // New state for create modal
  const [creatingCode, setCreatingCode] = useState(false);
  const [editCodeOpen, setEditCodeOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [editingCustomCode, setEditingCustomCode] = useState('');
  const [editingDiscountPercent, setEditingDiscountPercent] = useState('');
  const [editingMyShare, setEditingMyShare] = useState(0); 
  const [editingStartDate, setEditingStartDate] = useState(''); // New state for edit modal
  const [editingEndDate, setEditingEndDate] = useState('');     // New state for edit modal
  const [updatingCode, setUpdatingCode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState(null);
  const [deletingCode, setDeletingCode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const calculatedMyShare = 20 - (parseFloat(discountPercent) || 0);
    setMyShare(Math.max(0, calculatedMyShare));
  }, [discountPercent]);

  useEffect(() => {
    const calculatedEditingMyShare = 20 - (parseFloat(editingDiscountPercent) || 0);
    setEditingMyShare(Math.max(0, calculatedEditingMyShare));
  }, [editingDiscountPercent]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/partner', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    const userString = localStorage.getItem('user');
    let storedUser = {};
    try {
      if (userString && userString !== 'undefined') {
        storedUser = JSON.parse(userString);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
    }
    setUser(storedUser);

    const token = localStorage.getItem('token');

    if (!token || storedUser.role !== 'partner') {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router, mounted]);

  const socket = useSocket();

  useEffect(() => {
    if (socket === undefined || socket === null || !mounted) return;

    if (user.id) {
      socket.emit('join-partner', user.id);
    }

    socket.on('partner-data-updated', () => {
      fetchData();
    });

    return () => {
      socket.off('partner-data-updated');
    };
  }, [socket, mounted, user.id]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleEditClick = (codeItem) => {
    setEditingCode(codeItem);
    setEditingCustomCode(codeItem.code);
    const discountVal = codeItem.discount_percent !== undefined ? codeItem.discount_percent : codeItem.discountPercent;
    setEditingDiscountPercent(discountVal !== undefined && discountVal !== null ? discountVal.toString() : '0');
    setEditingStartDate(codeItem.start_date ? new Date(codeItem.start_date).toISOString().split('T')[0] : '');
    setEditingEndDate(codeItem.end_date ? new Date(codeItem.end_date).toISOString().split('T')[0] : '');
    setEditCodeOpen(true);
  };

  const copyReferralCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Referral code copied to clipboard!');
  };

  const toggleCodeStatus = async (codeId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/partner/toggle-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ codeId, isActive: !currentStatus })
      });

      if (res.ok) {
        toast.success(`Code ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchData();
      } else {
        toast.error('Failed to update code');
      }
    } catch (error) {
      toast.error('Failed to update code');
    }
  };

  const handleDeleteCode = (codeId) => {
    setCodeToDelete(codeId);
    setShowDeleteModal(true);
  };

  const confirmDeleteCode = async () => {
    if (!codeToDelete) return;

    setDeletingCode(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/partner/delete-code?id=${codeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await res.json();
      if (res.ok) {
        toast.success('Referral code deleted successfully');
        setShowDeleteModal(false);
        setCodeToDelete(null);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to delete code');
      }
    } catch (error) {
      toast.error('Failed to delete referral code');
    } finally {
      setDeletingCode(false);
    }
  };

  const handleCreateCode = async () => {
    if (!customCode.trim()) {
      toast.error('Please enter a referral code');
      return;
    }
    const discount = parseFloat(discountPercent);
    if (isNaN(discount) || discount < 0 || discount > 20) {
      toast.error('Discount percentage must be between 0 and 20.');
      return;
    }

    setCreatingCode(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/partner/create-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: customCode.trim().toUpperCase(),
          discountPercent: discount,
          myShare: 20 - discount,
          startDate: startDate || null, // Send null if not set
          endDate: endDate || null,     // Send null if not set
        })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success('Referral code created!');
        setCreateCodeOpen(false);
        setCustomCode('');
        setDiscountPercent('');
        setMyShare(0); 
        setStartDate('');
        setEndDate('');
        fetchData();
      } else {
        toast.error(result.error || 'Failed to create code');
      }
    } catch (error) {
      toast.error('Failed to create referral code');
    } finally {
      setCreatingCode(false);
    }
  };

  const handleUpdateCode = async () => {
    if (!editingCustomCode.trim()) {
      toast.error('Please enter a referral code');
      return;
    }
    
    if (!editingCode || !editingCode.id) {
      toast.error('No code selected for editing');
      return;
    }

    setUpdatingCode(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/partner/update-code', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingCode.id,
          code: editingCustomCode.trim().toUpperCase(),
          startDate: editingStartDate || null,
          endDate: editingEndDate || null,
        })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success('Referral code updated!');
        setEditCodeOpen(false);
        setEditingCode(null);
        setEditingCustomCode('');
        setEditingDiscountPercent('');
        setEditingMyShare(0); 
        setEditingStartDate('');
        setEditingEndDate('');
        fetchData();
      } else {
        toast.error(result.error || 'Failed to update code');
      }
    } catch (error) {
      toast.error('Failed to update referral code');
    } finally {
      setUpdatingCode(false);
    }
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="dashboard-container">
        {/* Navigation Bar */}
        <Navbar expand="lg" className="px-4 py-3 sticky-top glass-navbar section-mb">
          <Container fluid>
            <Navbar.Brand className="d-flex align-items-center fw-bold">
              <div className="brand-icon me-2">P</div>
              <span>Partner Dashboard</span>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="partner-navbar-nav" className="border-secondary opacity-50" />
            <Navbar.Collapse id="partner-navbar-nav">
              <Nav className="ms-auto align-items-center gap-3 mt-3 mt-lg-0">
                <ThemeToggle />
                <div className="d-flex align-items-center border rounded-pill px-3 py-1">
                  <div className="user-avatar me-2">{user.name?.charAt(0)}</div>
                  <span className="small fw-medium">{user.name}</span>
                </div>
                <Button variant="outline-secondary" size="sm" onClick={handleLogout} className="rounded-pill px-3">
                  <BoxArrowRight className="me-1" /> Logout
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container fluid className="px-4">
          {/* Profile Header */}
          <Card className="profile-hero-card border-0 overflow-hidden shadow-lg rounded-4 section-mb mb-4">
            <Card.Body className="p-4 p-md-5 position-relative z-1">
              <Row className="align-items-center">
                <Col xs="auto" className="mb-3 mb-md-0">
                  <div className="company-logo-large">
                    {data?.profile?.name?.charAt(0)}
                  </div>
                </Col>
                <Col>
                  <h1 className="text-white fw-bold mb-1">{data?.profile?.name}</h1>
                  <p className="text-light opacity-75 fs-5 mb-3">{data?.profile?.position}</p>
                </Col>              </Row>
            </Card.Body>
          </Card>

          {/* Stats Cards */}
          <Row className="g-4 section-mb mb-4">
            <Col xs={12} md={4} lg={3}>
              <Card className="stat-card border-0 glass-card-dark h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="stat-icon bg-primary bg-opacity-25 text-primary me-3">
                      <People size={24} />
                    </div>
                    <span className="opacity-75 small fw-medium text-uppercase" style={{ color: 'var(--foreground)' }}>Total Students</span>
                  </div>
                  <h2 className="text-primary fw-bold mb-0">{data?.referralStats?.totalTransactions || 0}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4} lg={3}>
              <Card className="stat-card border-0 glass-card-dark h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="stat-icon bg-success bg-opacity-25 text-success me-3">
                      <Plus size={24} />
                    </div>
                    <span className="opacity-75 small fw-medium text-uppercase" style={{ color: 'var(--foreground)' }}>Total Earnings</span>
                  </div>
                  <h2 className="text-success fw-bold mb-0">₹{data?.referralStats?.totalEarnings?.toFixed(2) || '0.00'}</h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Referral Program Info Card */}
          <Card className="mb-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-4">
            <Card.Body className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--foreground)' }}>Referral Program</h5>
                <p className="small mb-0" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Generate new codes to track your referrals and earnings</p>
              </div>
              <Button variant="primary" className="rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center" onClick={() => setCreateCodeOpen(true)}>
                <Plus size={20} className="me-1" /> Create Referral Code
              </Button>
            </Card.Body>
          </Card>

          {/* Referral Codes Management Section */}
          <Card className="glass-card-dark border-0 shadow-lg rounded-4 overflow-hidden section-mb mb-4">
            <Card.Header className="bg-transparent border-0 p-4">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--foreground)' }}>Your Referral Codes</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="custom-table mb-0" hover>
                  <thead>
                    <tr>
                      <th className="ps-4">Code</th>
                      <th>Total Sales</th>
                      <th>Discounts</th>
                      <th>Your Earnings</th>
                      <th>Status</th>
                      <th>Usage</th>
                      <th>Discount (%)</th>
                      <th>Your Share (%)</th>
                      <th className="pe-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.referralCodes && data.referralCodes.length > 0 ? (
                      data.referralCodes.map((codeItem) => {
                        const discountValue = codeItem.discount_percent !== undefined ? codeItem.discount_percent : codeItem.discountPercent;
                        const finalDiscount = discountValue !== undefined && discountValue !== null ? discountValue : 0;
                        
                        // Explicitly bind strictly to your exact backend column target name: my_share
                        const finalShare = codeItem.my_share !== undefined && codeItem.my_share !== null 
                          ? codeItem.my_share 
                          : Math.max(0, 20 - parseFloat(finalDiscount));

                        return (
                          <tr key={codeItem.id} className="align-middle">
                            <td className="ps-4">
                              <div className="d-flex align-items-center gap-2">
                                <code className="font-monospace fw-bold text-primary fs-6">{codeItem.code}</code>
                                <Button 
                                  variant="link" 
                                  className="p-0 text-muted shadow-none d-flex align-items-center" 
                                  onClick={() => copyReferralCode(codeItem.code)}
                                  title="Copy code"
                                >
                                  <Files size={14} />
                                </Button>
                              </div>
                            </td>
                            <td className="fw-bold">₹{parseFloat(codeItem.total_amount || 0).toFixed(2)}</td>
                            <td className="text-danger">-₹{parseFloat(codeItem.total_discount || 0).toFixed(2)}</td>
                            <td className="fw-bold text-success">₹{parseFloat(codeItem.total_earnings || 0).toFixed(2)}</td>
                            <td>
                              {codeItem.is_active ? (
                                <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 align-items-center gap-1">
                                  <CheckCircle size={12} className="me-1" /> Active
                                </Badge>
                              ) : (
                                <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1 align-items-center gap-1">
                                  <Clock size={12} className="me-1" /> Inactive
                                </Badge>
                              )}
                            </td>
                            <td>{codeItem.transaction_count || 0}</td>
                            <td>{finalDiscount}%</td>
                            <td>{finalShare}%</td>
                            <td className="pe-4 text-end">
                              <div className="d-flex align-items-center justify-content-end gap-3 actions-link-group">
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="action-link p-0 d-inline-flex align-items-center gap-1 text-decoration-none"
                                  onClick={() => handleEditClick(codeItem)}
                                >
                                  <PencilSquare size={13} /> Edit
                                </Button>
                                
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className={`action-link p-0 d-inline-flex align-items-center gap-1 text-decoration-none ${codeItem.is_active ? 'text-warning' : 'text-success'}`}
                                  onClick={() => toggleCodeStatus(codeItem.id, codeItem.is_active)}
                                >
                                  {codeItem.is_active ? (
                                    <>
                                      <ToggleOff size={14} /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <ToggleOn size={14} /> Activate
                                    </>
                                  )}
                                </Button>

                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="action-link link-danger p-0 d-inline-flex align-items-center gap-1 text-decoration-none"
                                  onClick={() => handleDeleteCode(codeItem.id)}
                                >
                                  <Trash size={13} /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-5">
                          <div className="opacity-25 mb-3">
                            <Key size={48} />
                          </div>
                          <h6 className="opacity-50">No referral codes set up</h6>
                          <p className="small opacity-50 mb-0">Click the button above to generate your custom referral tracking options.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Student Transactions Table */}
          {data?.transactions && (
            <Card className="glass-card-dark border-0 shadow-lg rounded-4 overflow-hidden section-mb">
              <Card.Header className="bg-transparent border-0 p-4">
                <h5 className="mb-0 fw-bold" style={{ color: 'var(--foreground)' }}>Student Transactions</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table className="custom-table mb-0" hover>
                    <thead>
                      <tr>
                        <th className="ps-4">Transaction ID</th>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Class</th>
                        <th>Amount</th>
                        <th>Referral Code</th>
                        <th className="pe-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.length > 0 ? (
                        data.transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="ps-4">
                              <span className="font-monospace small">{transaction.transactionId}</span>
                            </td>
                            <td>
                              <span className="fw-medium">{transaction.studentName}</span>
                            </td>
                            <td className="opacity-75">{transaction.email || 'N/A'}</td>
                            <td className="opacity-75">{transaction.className}</td>
                            <td className="fw-bold text-success">₹{parseFloat(transaction.amount || 0).toFixed(2)}</td>
                            <td className="opacity-75">
                              <Badge bg="success" className="bg-opacity-25 text-light border border-light border-opacity-25 px-2 py-1">
                                {transaction.code}
                              </Badge>
                            </td>
                            <td className="pe-4 opacity-75">{new Date(transaction.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <div className="opacity-25 mb-3">
                              <CheckCircle size={48} />
                            </div>
                            <h6 className="opacity-50">No transactions found</h6>
                            <p className="small opacity-50">No transactions have been recorded with your referral codes yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Container>

        {/* Create Referral Code Modal */}
        <Modal show={createCodeOpen} onHide={() => setCreateCodeOpen(false)} size="lg" centered className="glass-modal">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold d-flex align-items-center">
              <Key className="text-primary me-2" /> Generate Referral Code
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Referral Code</Form.Label>
                    <Form.Control
                      className="font-monospace text-uppercase"
                      placeholder="e.g. REFERRAL2024"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      style={{ letterSpacing: '1px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Discount Percentage (%)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0-20"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      min="0"
                      max="20"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                    <Form.Text className="opacity-50 small">Optional</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">My Share (%)</Form.Label>
                    <Form.Control
                      type="text"
                      value={myShare.toFixed(2)}
                      readOnly
                      disabled
                      className="bg-light"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" onClick={() => setCreateCodeOpen(false)} className="rounded-pill px-4">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCreateCode}
              disabled={creatingCode || !customCode.trim() || parseFloat(discountPercent) > 20 || isNaN(parseFloat(discountPercent))}
              className="rounded-pill px-4 fw-bold"
            >
              {creatingCode ? <Spinner animation="border" size="sm" /> : 'Generate Code'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Referral Code Modal */}
        <Modal show={editCodeOpen} onHide={() => setEditCodeOpen(false)} size="lg" centered className="glass-modal">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold d-flex align-items-center">
              <PencilSquare className="text-primary me-2" /> Edit Referral Code
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Referral Code</Form.Label>
                    <Form.Control
                      className="font-monospace text-uppercase"
                      placeholder="e.g. REFERRAL2024"
                      value={editingCustomCode}
                      onChange={(e) => setEditingCustomCode(e.target.value.toUpperCase())}
                      style={{ letterSpacing: '1px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Discount Percentage (%)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0-20"
                      value={editingDiscountPercent}
                      onChange={(e) => setEditingDiscountPercent(e.target.value)}
                      min="0"
                      max="20"
                      readOnly
                      disabled
                      className="bg-light"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editingStartDate}
                      onChange={(e) => setEditingStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editingEndDate}
                      onChange={(e) => setEditingEndDate(e.target.value)}
                      min={editingStartDate}
                    />
                    <Form.Text className="opacity-50 small">Optional</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">My Share (%)</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingMyShare.toFixed(2)}
                      readOnly
                      disabled
                      className="bg-light"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" onClick={() => setEditCodeOpen(false)} className="rounded-pill px-4">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleUpdateCode}
              disabled={updatingCode || !editingCustomCode.trim() || parseFloat(editingDiscountPercent) > 20 || isNaN(parseFloat(editingDiscountPercent))}
              className="rounded-pill px-4 fw-bold"
            >
              {updatingCode ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Modal>

        <ConfirmationModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteCode}
          title="Delete Referral Code"
          message={`Are you sure you want to delete this referral code? This action cannot be undone.`}
          confirmText="Yes, Delete it"
          cancelText="No, Keep it"
          loading={deletingCode}
        />
      </div>

      <style jsx global>{`
        .dashboard-container {
          background: var(--background);
          color: var(--foreground);
          min-height: 100vh;
        }

        .glass-navbar {
          background: rgba(var(--navbar-bg-rgb), 0.7);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--card-border);
          box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
        }

        .brand-icon {
          width: 32px;
          height: 32px;
          background: var(--primary-color);
          color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        [data-bs-theme="dark"] .brand-icon {
          background: var(--foreground);
          color: var(--background);
        }

        .user-avatar {
          width: 24px;
          height: 24px;
          background: var(--primary-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .profile-hero-card {
          background: var(--primary-color);
          color: white;
          border: none !important;
          border-radius: 12px !important;
        }

        .company-logo-large {
          width: 80px;
          height: 80px;
          background: var(--card-bg, #fff);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: bold;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .glass-card-dark {
          background: rgba(var(--card-bg-rgb, 255, 255, 255), 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid var(--card-border, #dee2e6);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .custom-table thead th {
          background: rgba(0,0,0,0.02);
          color: var(--secondary-color);
          border-bottom: 1px solid var(--card-border, #dee2e6);
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        [data-bs-theme="dark"] .custom-table thead th {
          background: rgba(255,255,255,0.02);
        }

        .custom-table tbody tr td {
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        .actions-link-group .action-link {
          font-weight: 500;
          font-size: 0.85rem;
          opacity: 0.85;
          transition: opacity 0.15s ease-in-out;
        }

        .actions-link-group .action-link:hover {
          opacity: 1;
          text-decoration: underline !important;
        }

        .glass-modal .modal-content {
          background: rgba(var(--card-bg-rgb, 255, 255, 255), 0.9);
          backdrop-filter: blur(15px);
          color: var(--foreground);
          border: 1px solid var(--card-border);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
        }

        [data-bs-theme="dark"] .profile-hero-card {
          background: rgba(var(--card-bg-rgb), 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid var(--card-border) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.06);
          color: var(--foreground);
        }
      `}</style>
    </>
  );
}