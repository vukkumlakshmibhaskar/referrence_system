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
  InputGroup,
  Modal,
  Spinner,
  Tabs,
  Tab,
  Image,
  Dropdown
} from 'react-bootstrap';
import {
  People,
  Building,
  PersonPlus,
  BoxArrowRight,
  GraphUp,
  Files,
  Key,
  Plus,
  Envelope,
  Lock,
  Person,
  PencilSquare,
  Trash,
  Search,
  CheckCircle,
  Clock
} from 'react-bootstrap-icons';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [pendingPartners, setPendingPartners] = useState([]);
  const [referralCodes, setReferralCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotalCount, setUsersTotalCount] = useState(0);
  const usersLimit = 10; // Fixed items per page for now

  const fetchUsersData = async (page, limit, search = '', role = '') => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    try {
      let url = `/api/admin/users?page=${page}&limit=${limit}`;
      if (search) url += `&search=${search}`;
      if (role) url += `&role=${role}`;

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${storedToken}` } });
      const result = await res.json();
      if (res.ok) {
        setUsers(result.users || []);
        setUsersCurrentPage(result.pagination.currentPage);
        setUsersTotalPages(result.pagination.totalPages);
        setUsersTotalCount(result.pagination.totalCount);
      } else {
        toast.error(result.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchPartnersData = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch('/api/admin/partners', { headers: { 'Authorization': `Bearer ${storedToken}` } });
      const result = await res.json();
      if (res.ok) {
        setPartners(result.partners || []);
      } else {
        toast.error(result.error || 'Failed to fetch partners');
      }
    } catch (error) {
      console.error('Fetch partners error:', error);
      toast.error('Failed to fetch partners');
    }
  };

  const fetchReferralCodesData = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch('/api/admin/referral-codes', { headers: { 'Authorization': `Bearer ${storedToken}` } });
      const result = await res.json();
      if (res.ok) {
        setReferralCodes(result.referralCodes || []);
      } else {
        toast.error(result.error || 'Failed to fetch referral codes');
      }
    } catch (error) {
      console.error('Fetch referral codes error:', error);
      toast.error('Failed to fetch referral codes');
    }
  };

  const fetchPendingPartners = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;
    try {
      const res = await fetch('/api/admin/pending-partners', { headers: { 'Authorization': `Bearer ${storedToken}` } });
      const result = await res.json();
      if (res.ok) {
        setPendingPartners(result.pendingPartners || []);
      }
    } catch (error) {
      console.error('Fetch pending partners error:', error);
    }
  };

  const fetchAllAdminLists = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsersData(usersCurrentPage, usersLimit),
        fetchPartnersData(),
        fetchReferralCodesData(),
        fetchPendingPartners()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [token, setToken] = useState('');
  const [user, setUser] = useState({});
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [newPartner, setNewPartner] = useState({
    email: '', password: '', name: '', position: '', commissionRate: 20
  });
  const [creatingPartner, setCreatingPartner] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [newReferralCode, setNewReferralCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [myShare, setMyShare] = useState(0);
  const [codeStartDate, setCodeStartDate] = useState(''); // New state for admin code creation
  const [codeEndDate, setCodeEndDate] = useState('');   // New state for admin code creation
  const [creating, setCreating] = useState(false);

  const handleCreatePartner = async () => {
    setCreatingPartner(true);
    try {
      const res = await fetch('/api/admin/create-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newPartner)
      });
      const result = await res.json();
      if (res.ok) {
        setPartners([...partners, result.partner]);
        setOpenDialog(false);
        setNewPartner({ email: '', password: '', name: '', position: '', commissionRate: 20 });
        toast.success('Partner created successfully!');
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to create partner');
    } finally {
      setCreatingPartner(false);
    }
  };

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', commissionRate: 20 });
  const [inviting, setInviting] = useState(false);

  const handleInvitePartner = async () => {
    if (!inviteForm.email) {
      toast.error('Email is required');
      return;
    }
    setInviting(true);
    try {
      const res = await fetch('/api/admin/invite-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(inviteForm)
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        setShowInviteModal(false);
        setInviteForm({ email: '', commissionRate: 20 });
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const [editDialog, setEditDialog] = useState({ open: false, type: '', data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: null, name: '' });
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [partnerToApprove, setPartnerToApprove] = useState(null);
  const [commissionRateToAssign, setCommissionRateToAssign] = useState(20);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (selectedPartner) {
      const partner = partners.find(p => p.id === parseInt(selectedPartner));
      if (partner) {
        // Update myShare calculation based on partner's commission_rate
        const rate = parseFloat(partner.commission_rate || 20);
        const calculatedMyShare = rate - (parseFloat(discountPercent) || 0);
        setMyShare(Math.max(0, calculatedMyShare));
      }
    }
  }, [discountPercent, selectedPartner, partners]);

  useEffect(() => {
    if (!mounted) return;

    const storedToken = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setToken(storedToken || '');
    setUser(storedUser);

    if (!storedToken || storedUser.role !== 'admin') {
      router.push('/login');
      return;
    }

    const fetchAdminOverallData = async () => {
      try {
        const res = await fetch('/api/admin', { headers: { 'Authorization': `Bearer ${storedToken}` } });
        const result = await res.json();
        if (res.ok) {
          setData(result);
        } else {
          toast.error(result.error || 'Failed to fetch admin stats');
        }
      } catch (error) {
        console.error('Fetch admin stats error:', error);
        toast.error('Failed to fetch admin stats');
      }
    };

    // Fetch all lists: users, partners, and referral codes
    const fetchAllLists = async () => {
      try {
        await Promise.all([
          fetchUsersData(1, 10, searchTerm, filterRole),
          fetchPartnersData(),
          fetchReferralCodesData(),
          fetchPendingPartners()
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminOverallData();
    fetchAllLists();
  }, [router, mounted]);

  // Refetch users when search or filter changes
  useEffect(() => {
    if (!mounted || !token) return;
    const timeoutId = setTimeout(() => {
      fetchUsersData(1, usersLimit, searchTerm, filterRole);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterRole, mounted, token]);

  // Live update via Socket.io
  const socket = useSocket();

  useEffect(() => {
    if (socket === undefined || socket === null || !mounted || !token) return;

    socket.emit('join-admin');

    socket.on('data-updated', (type) => {
      // Refresh data when notified
      Promise.all([
        fetch('/api/admin/partners', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/referral-codes', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
      ]).then(([partnersRes, codesRes, usersRes]) => {
        if (type === 'partners' || type === 'all') setPartners(partnersRes.partners || []);
        if (type === 'referralCodes' || type === 'all') setReferralCodes(codesRes.referralCodes || []);
        if (type === 'users' || type === 'all') setUsers(usersRes.users || []);
      }).catch(() => {});
    });

    return () => {
      socket.off('data-updated');
    };
  }, [socket, token, mounted]);

  const createReferralCode = async () => {
    if (!selectedPartner || !newReferralCode) return;
    
    const partner = partners.find(p => p.id === parseInt(selectedPartner));
    const commissionRate = parseFloat(partner?.commission_rate || 20);
    
    const discount = parseFloat(discountPercent);
    if (isNaN(discount) || discount < 0 || discount > commissionRate) {
      toast.error(`Discount percentage must be between 0 and ${commissionRate}.`);
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/referral-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          partnerId: selectedPartner, 
          code: newReferralCode,
          discountPercent: discount,
          myShare: commissionRate - discount,
          startDate: codeStartDate || null,
          endDate: codeEndDate || null,
        })
      });
      const result = await res.json();
      if (res.ok) {
        setReferralCodes([result.referralCode, ...referralCodes]);
        setSelectedPartner('');
        setNewReferralCode('');
        setDiscountPercent('');
        setCodeStartDate(''); // Reset
        setCodeEndDate('');   // Reset
        setShowCodeModal(false);
        toast.success(`Referral code created: ${result.referralCode.code}`);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to create referral code');
    } finally {
      setCreating(false);
    }
  };

  const handleApprovePartner = async (partner) => {
    setPartnerToApprove(partner);
    setCommissionRateToAssign(20);
    setShowApproveModal(true);
  };

  const confirmApprovePartner = async () => {
    if (!partnerToApprove) return;
    setApproving(true);
    try {
      const res = await fetch('/api/admin/approve-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          partnerId: partnerToApprove.id,
          commissionRate: commissionRateToAssign
        })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        setShowApproveModal(false);
        setPartnerToApprove(null);
        fetchPendingPartners();
        fetchPartnersData();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to approve partner');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectPartner = async (partnerId) => {
    if (!confirm('Are you sure you want to reject and remove this partner?')) return;
    try {
      const res = await fetch('/api/admin/reject-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ partnerId })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        fetchPendingPartners();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to reject partner');
    }
  };

  const handleEdit = (type, item) => {
    setEditDialog({ open: true, type, data: item });
    if (type === 'user') {
      setEditForm({ name: item.name, email: item.email, isVerified: item.is_verified });
    } else if (type === 'partner') {
      setEditForm({ 
        name: item.name, 
        email: item.email, 
        position: item.position, 
        commissionRate: item.commission_rate || 20,
        isVerified: item.is_verified 
      });
    } else if (type === 'referralCode') {
      setEditForm({ 
        isActive: item.is_active,
        startDate: item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : '',
        endDate: item.end_date ? new Date(item.end_date).toISOString().split('T')[0] : ''
      });
    }
  };

  const handleSaveEdit = async () => {
    const currentToken = localStorage.getItem('token');
    setSaving(true);
    try {
      let endpoint = '';
      let body = {};
      if (editDialog.type === 'user') {
        endpoint = '/api/admin/users';
        body = { userId: editDialog.data.id, ...editForm };
      } else if (editDialog.type === 'partner') {
        endpoint = '/api/admin/partners';
        body = { partnerId: editDialog.data.id, ...editForm };
      } else if (editDialog.type === 'referralCode') {
        endpoint = '/api/admin/referral-codes';
        body = { 
          codeId: editDialog.data.id, 
          isActive: editForm.isActive,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
        };
      }
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast.success('Updated successfully!');
        const [partnersRes, codesRes, usersRes] = await Promise.all([
          fetch('/api/admin/partners', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
          fetch('/api/admin/referral-codes', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
          fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);
        setPartners(partnersRes.partners || []);
        setReferralCodes(codesRes.referralCodes || []);
        setUsers(usersRes.users || []);
        setEditDialog({ open: false, type: '', data: null });
      } else {
        const result = await res.json();
        toast.error(result.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (type, id, name) => {
    setDeleteDialog({ open: true, type, id, name });
  };

  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      const currentToken = localStorage.getItem('token');
      let endpoint = '';
      if (deleteDialog.type === 'user') endpoint = `/api/admin/users?id=${deleteDialog.id}`;
      else if (deleteDialog.type === 'partner') endpoint = `/api/admin/partners?id=${deleteDialog.id}`;
      else if (deleteDialog.type === 'referralCode') endpoint = `/api/admin/referral-codes?id=${deleteDialog.id}`;
      const res = await fetch(endpoint, { method: 'DELETE', headers: { 'Authorization': `Bearer ${currentToken}` } });
      if (res.ok) {
        toast.success('Deleted successfully!');
        const [partnersRes, codesRes, usersRes] = await Promise.all([
          fetch('/api/admin/partners', { headers: { 'Authorization': `Bearer ${currentToken}` } }).then(r => r.json()),
          fetch('/api/admin/referral-codes', { headers: { 'Authorization': `Bearer ${currentToken}` } }).then(r => r.json()),
          fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${currentToken}` } }).then(r => r.json())
        ]);
        setPartners(partnersRes.partners || []);
        setReferralCodes(codesRes.referralCodes || []);
        setUsers(usersRes.users || []);
        setDeleteDialog({ open: false, type: '', id: null, name: '' });
      } else {
        const result = await res.json();
        toast.error(result.error || 'Delete failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const availablePartners = partners;

  return (
    <>
      <Toaster position="top-center" />
      <div className="dashboard-container">
        {/* Navigation Bar */}
        <Navbar expand="lg" className="px-4 py-3 sticky-top glass-navbar mb-4">
          <Container fluid>
            <Navbar.Brand className="d-flex align-items-center fw-bold">
              <div className="brand-icon me-2">S</div>
              <span>Admin Dashboard</span>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="admin-navbar-nav" className="border-secondary opacity-50" />
            <Navbar.Collapse id="admin-navbar-nav">
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
          {/* Stats Cards */}
          <Row className="g-4 mb-4">
            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card border-0 glass-card-dark h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="stat-icon bg-primary bg-opacity-25 text-primary me-3">
                      <People size={24} />
                    </div>
                    <span className="opacity-75 small fw-medium text-uppercase" style={{ color: 'var(--foreground)' }}>Students</span>
                  </div>
                  <h2 className="text-primary fw-bold mb-0">{data?.totalStudents || 0}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card border-0 glass-card-dark h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="stat-icon bg-info bg-opacity-25 text-info me-3">
                      <Building size={24} />
                    </div>
                    <span className="opacity-75 small fw-medium text-uppercase" style={{ color: 'var(--foreground)' }}>Partners</span>
                  </div>
                  <h2 className="text-info fw-bold mb-0">{data?.totalPartners || 0}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card border-0 glass-card-dark h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="stat-icon bg-success bg-opacity-25 text-success me-3">
                      <GraphUp size={24} />
                    </div>
                    <span className="opacity-75 small fw-medium text-uppercase" style={{ color: 'var(--foreground)' }}>Total Sales</span>
                  </div>
                  <h2 className="text-success fw-bold mb-0">₹{data?.totalSales?.toFixed(2) || '0.00'}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card border-0 glass-card-dark h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="stat-icon bg-warning bg-opacity-25 text-warning me-3">
                      <Key size={24} />
                    </div>
                    <span className="opacity-75 small fw-medium text-uppercase" style={{ color: 'var(--foreground)' }}>Partner Payouts</span>
                  </div>
                  <h2 className="text-warning fw-bold mb-0">₹{data?.totalPartnerEarnings?.toFixed(2) || '0.00'}</h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Content Area */}
          <Card className="glass-card-dark border-0 overflow-hidden shadow-lg mb-5">
            <Card.Header className="bg-transparent border-0 p-0">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="custom-tabs border-0"
                fill
              >
                <Tab eventKey="users" title={<span><People className="me-2" />Users</span>} />
                <Tab eventKey="partners" title={<span><Building className="me-2" />Partners</span>} />
                <Tab eventKey="pending" title={
                  <span>
                    <Clock className="me-2" />
                    Pending {pendingPartners.length > 0 && <Badge bg="danger" pill className="ms-1">{pendingPartners.length}</Badge>}
                  </span>
                } />
                <Tab eventKey="codes" title={<span><Key className="me-2" />Referral Codes</span>} />
              </Tabs>
            </Card.Header>
            <Card.Body className="p-4">
              {activeTab === 'users' && (
                <>
                  <Row className="mb-4 align-items-center g-3">
                    <Col>
                      <h5 className="mb-0 fw-bold">User Management</h5>
                    </Col>
                    <Col xs={12} md="auto">
                      <InputGroup className="glass-search rounded-pill">
                        <InputGroup.Text className="bg-transparent border-0 opacity-50 pe-0">
                          <Search />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Search users..."
                          className="bg-transparent border-0 shadow-none ps-2"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col xs={12} md="auto">
                      <Form.Select
                        className="border border-secondary border-opacity-25 rounded-pill shadow-none px-4"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        style={{ width: '150px' }}
                      >
                        <option value="">All Roles</option>
                        <option value="partner">Partner</option>
                        <option value="admin">Admin</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  <div className="table-responsive">
                    <Table className="custom-table" hover>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Details</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => {
                          const matchesSearch = !searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesRole = !filterRole || u.role === filterRole;
                          return matchesSearch && matchesRole;
                        }).map(user => (
                          <tr key={user.id}>
                            <td>
                              <span className="fw-medium">{user.name}</span>
                            </td>
                            <td className="opacity-75">{user.email}</td>
                            <td>
                              <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'partner' ? 'warning' : 'success'} className="custom-badge">
                                {user.role}
                              </Badge>
                            </td>
                            <td>
                              <div className="small opacity-75">
                                {user.role === 'student' && user.details && (
                                  <span>{user.details.student_id} • {user.details.course} ({user.details.year})</span>
                                )}
                                {user.role === 'partner' && user.details && (
                                  <span>{user.details.position}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              {user.is_verified ? (
                                <Badge bg="success" className="custom-badge bg-opacity-25 text-success border border-success border-opacity-25">
                                  <CheckCircle className="me-1" /> Verified
                                </Badge>
                              ) : (
                                <Badge bg="secondary" className="custom-badge bg-opacity-25 text-light border border-light border-opacity-25">
                                  <Clock className="me-1" /> Pending
                                </Badge>
                              )}
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end align-items-center">
                                <Button variant="outline-primary" size="sm" className="me-2 rounded-pill d-flex align-items-center" onClick={() => handleEdit('user', user)}>
                                  <PencilSquare className="me-1" /> Edit
                                </Button>
                                <Button variant="outline-danger" size="sm" className="rounded-pill d-flex align-items-center" onClick={() => handleDeleteClick('user', user.id, user.name)}>
                                  <Trash className="me-1" /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}

              {activeTab === 'partners' && (
                <>
                  <Card className="mb-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-4">
                    <Card.Body className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div>
                        <h5 className="fw-bold mb-1" style={{ color: 'var(--foreground)' }}>Partner Network</h5>
                        <p className="small mb-0" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Expand your system by adding new strategic partners</p>
                      </div>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" className="rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center" onClick={() => setShowInviteModal(true)}>
                          <Envelope size={20} className="me-1" /> Invite Partner
                        </Button>
                        <Button variant="primary" className="rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center" onClick={() => setOpenDialog(true)}>
                          <Plus size={20} className="me-1" /> Create Partner
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>

                  <div className="table-responsive">
                    <Table className="custom-table" hover>
                      <thead>
                        <tr>
                          <th>Partner Name</th>
                          <th>Email</th>
                          <th>Commission</th>
                          <th>Total Sales</th>
                          <th>Total Earnings</th>
                          <th>Codes</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partners.map(partner => (
                          <tr key={partner.id}>
                            <td>
                              <span className="fw-medium">{partner.name}</span>
                            </td>
                            <td className="opacity-75">{partner.email}</td>
                            <td className="fw-bold text-primary">{parseFloat(partner.commission_rate || 20).toFixed(1)}%</td>
                            <td className="fw-bold">₹{parseFloat(partner.total_sales || 0).toFixed(2)}</td>
                            <td className="fw-bold text-success">₹{parseFloat(partner.total_earnings || 0).toFixed(2)}</td>
                            <td>
                              {partner.referral_code_count > 0 ? (
                                <Badge bg="primary" className="rounded-pill px-2 py-1 shadow-sm">
                                  {partner.referral_code_count} {partner.referral_code_count === 1 ? 'Code' : 'Codes'}
                                </Badge>
                              ) : (
                                <span className="opacity-25 small">No codes</span>
                              )}
                            </td>
                            <td>
                              {partner.is_verified ? (
                                <Badge bg="success" className="custom-badge bg-opacity-25 text-success border border-success border-opacity-25">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge bg="secondary" className="custom-badge bg-opacity-25 text-light border border-light border-opacity-25">
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end align-items-center">
                                <Button variant="outline-primary" size="sm" className="me-2 rounded-pill d-flex align-items-center" onClick={() => handleEdit('partner', partner)}>
                                  <PencilSquare className="me-1" /> Edit
                                </Button>
                                <Button variant="outline-danger" size="sm" className="rounded-pill d-flex align-items-center" onClick={() => handleDeleteClick('partner', partner.id, partner.name)}>
                                  <Trash className="me-1" /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}

              {activeTab === 'pending' && (
                <>
                  <Row className="mb-4 align-items-center g-3">
                    <Col>
                      <h5 className="mb-0 fw-bold">Pending Partner Approvals</h5>
                      <p className="small opacity-75 mb-0">Review and approve self-registered partners</p>
                    </Col>
                  </Row>

                  <div className="table-responsive">
                    <Table className="custom-table" hover>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Position</th>
                          <th>Registered</th>
                          <th>Verification</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPartners.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-5 opacity-50">
                              No pending approvals at the moment.
                            </td>
                          </tr>
                        ) : (
                          pendingPartners.map(partner => (
                            <tr key={partner.id}>
                              <td>
                                <span className="fw-medium">{partner.name}</span>
                              </td>
                              <td className="opacity-75">{partner.email}</td>
                              <td>{partner.position || 'N/A'}</td>
                              <td className="small opacity-75">
                                {new Date(partner.created_at).toLocaleDateString()}
                              </td>
                              <td>
                                {partner.is_verified ? (
                                  <Badge bg="success" className="custom-badge bg-opacity-10 text-success border border-success border-opacity-25">
                                    Email Verified
                                  </Badge>
                                ) : (
                                  <Badge bg="warning" className="custom-badge bg-opacity-10 text-warning border border-warning border-opacity-25">
                                    Email Pending
                                  </Badge>
                                )}
                              </td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end align-items-center gap-2">
                                  <Button 
                                    variant="success" 
                                    size="sm" 
                                    className="rounded-pill px-3 d-flex align-items-center"
                                    onClick={() => handleApprovePartner(partner)}
                                  >
                                    <CheckCircle className="me-1" /> Approve
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm" 
                                    className="rounded-pill px-3 d-flex align-items-center"
                                    onClick={() => handleRejectPartner(partner.id)}
                                  >
                                    <Trash className="me-1" /> Reject
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}

              {activeTab === 'codes' && (
                <>
                  <Card className="mb-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-4">
                    <Card.Body className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div>
                        <h5 className="fw-bold mb-1" style={{ color: 'var(--foreground)' }}>Referral Program</h5>
                        <p className="small mb-0" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Generate new codes to track and reward your partners</p>
                      </div>
                      <Button variant="primary" className="rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center" onClick={() => setShowCodeModal(true)}>
                        <Plus size={20} className="me-1" /> Create Referral Code
                      </Button>
                    </Card.Body>
                  </Card>

                  <div className="table-responsive">
                    <Table className="custom-table" hover>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Partner</th>
                          <th>Discount</th>
                          <th>My Share</th>
                          <th>Usage</th>
                          <th>Status</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Created At</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralCodes.map(rc => (
                          <tr key={rc.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <Badge
                                  bg="info"
                                  className="font-monospace text-uppercase p-2 shadow-sm pointer-cursor me-2"
                                  onClick={() => {
                                    navigator.clipboard.writeText(rc.code);
                                    toast.success('Code copied to clipboard!');
                                  }}
                                  title="Click to copy"
                                  style={{ cursor: 'pointer' }}
                                >
                                  {rc.code}
                                </Badge>
                                <Files className="opacity-25" size={14} />
                              </div>
                            </td>
                            <td>
                              <span className="fw-medium">{rc.partner_name}</span>
                            </td>
                            <td>
                              <span className="fw-bold text-primary">{rc.discount_percent}%</span>
                            </td>
                            <td>
                              <span className="fw-bold text-success">{rc.my_share}%</span>
                            </td>
                            <td>
                              <Badge pill bg={rc.student_count > 0 ? 'primary' : 'secondary'} className="bg-opacity-25 text-light border border-light border-opacity-25">
                                {rc.student_count} Students
                              </Badge>
                            </td>
                            <td>
                              {rc.is_active ? (
                                <Badge bg="success" className="custom-badge bg-opacity-25 text-success border border-success border-opacity-25">
                                  Active
                                </Badge>
                              ) : (
                                <Badge bg="danger" className="custom-badge bg-opacity-25 text-danger border border-danger border-opacity-25">
                                  Inactive
                                </Badge>
                              )}
                            </td>
                            <td className="small opacity-75">
                              {rc.start_date ? new Date(rc.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="small opacity-75">
                              {rc.end_date ? new Date(rc.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="small opacity-75">
                              {new Date(rc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end align-items-center">
                                <Button variant="outline-primary" size="sm" className="me-2 rounded-pill d-flex align-items-center" onClick={() => handleEdit('referralCode', rc)}>
                                  <PencilSquare className="me-1" /> Edit
                                </Button>
                                <Button variant="outline-danger" size="sm" className="rounded-pill d-flex align-items-center" onClick={() => handleDeleteClick('referralCode', rc.id, rc.code)}>
                                  <Trash className="me-1" /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Modals */}
        {/* Create Partner Modal */}
        <Modal show={openDialog} onHide={() => setOpenDialog(false)} size="lg" centered className="glass-modal">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold d-flex align-items-center">
              <PersonPlus className="text-primary me-2" /> Create New Partner
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Email Address</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0"><Envelope /></InputGroup.Text>
                      <Form.Control
                        className="border-start-0"
                        placeholder="email@example.com"
                        value={newPartner.email}
                        onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Initial Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0"><Lock /></InputGroup.Text>
                      <Form.Control
                        type="password"
                        className="border-start-0"
                        placeholder="••••••••"
                        value={newPartner.password}
                        onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Full Name</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0"><Person /></InputGroup.Text>
                      <Form.Control
                        className="border-start-0"
                        placeholder="Partner's Name"
                        value={newPartner.name}
                        onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Position</Form.Label>
                    <Form.Control
                      placeholder="e.g. CEO"
                      value={newPartner.position}
                      onChange={(e) => setNewPartner({ ...newPartner, position: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Commission Rate (%)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="20"
                      value={newPartner.commissionRate}
                      onChange={(e) => setNewPartner({ ...newPartner, commissionRate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" onClick={() => setOpenDialog(false)} className="rounded-pill px-4">Cancel</Button>
            <Button variant="primary" onClick={handleCreatePartner} disabled={creatingPartner} className="rounded-pill px-4 fw-bold">
              {creatingPartner ? <Spinner animation="border" size="sm" /> : 'Create Partner'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Invite Partner Modal */}
        <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered className="glass-modal">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold d-flex align-items-center">
              <Envelope className="text-primary me-2" /> Invite Strategic Partner
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <p className="small opacity-75 mb-4">Send an invitation link to a potential partner's email. They will be able to create their account with a pre-assigned commission rate.</p>
              <Form.Group className="mb-3">
                <Form.Label className="small opacity-75">Partner's Email Address</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0"><Envelope size={14} /></InputGroup.Text>
                  <Form.Control
                    type="email"
                    className="border-start-0"
                    placeholder="partner@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small opacity-75">Assigned Commission Rate (%)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="20"
                  value={inviteForm.commissionRate}
                  onChange={(e) => setInviteForm({ ...inviteForm, commissionRate: e.target.value })}
                  min="0"
                  max="100"
                />
                <Form.Text className="text-muted small">
                  The partner will be restricted to this total pool for their referral codes.
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" onClick={() => setShowInviteModal(false)} className="rounded-pill px-4">Cancel</Button>
            <Button variant="primary" onClick={handleInvitePartner} disabled={inviting || !inviteForm.email} className="rounded-pill px-4 fw-bold">
              {inviting ? <Spinner animation="border" size="sm" /> : 'Send Invitation Email'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Modal */}
        <Modal show={editDialog.open} onHide={() => setEditDialog({ open: false, type: '', data: null })} centered className="glass-modal">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">
              Edit {editDialog.type === 'user' ? 'User' : editDialog.type === 'partner' ? 'Partner' : 'Referral Code'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Row className="g-3">
                {editDialog.type === 'user' && (
                  <>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small opacity-75">Name</Form.Label>
                        <Form.Control
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small opacity-75">Email</Form.Label>
                        <Form.Control
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Check
                        type="switch"
                        id="verify-switch"
                        label="Email Verified"
                        checked={editForm.isVerified || false}
                        onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                      />
                    </Col>
                  </>
                )}
                {editDialog.type === 'partner' && (
                  <>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small opacity-75">Name</Form.Label>
                        <Form.Control
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small opacity-75">Position</Form.Label>
                        <Form.Control
                          value={editForm.position || ''}
                          onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small opacity-75">Commission Rate (%)</Form.Label>
                        <Form.Control
                          type="number"
                          value={editForm.commissionRate || ''}
                          onChange={(e) => setEditForm({ ...editForm, commissionRate: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Check
                        type="switch"
                        id="verify-partner-switch"
                        label="Email Verified"
                        checked={editForm.isVerified || false}
                        onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                      />
                    </Col>
                  </>
                )}
                {editDialog.type === 'referralCode' && (
                  <Col xs={12}>
                    <Row className="g-3">
                      <Col md={12}>
                        <Form.Check
                          type="switch"
                          id="active-switch"
                          label="Active"
                          checked={editForm.isActive || false}
                          onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small opacity-75">Start Date</Form.Label>
                          <Form.Control
                            type="date"
                            className="bg-white bg-opacity-10 border-0 shadow-none px-3"
                            value={editForm.startDate || ''}
                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                            style={{ color: 'var(--foreground)' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small opacity-75">End Date</Form.Label>
                          <Form.Control
                            type="date"
                            className="bg-white bg-opacity-10 border-0 shadow-none px-3"
                            value={editForm.endDate || ''}
                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                            min={editForm.startDate}
                            style={{ color: 'var(--foreground)' }}
                          />
                          <Form.Text className="opacity-50 small">Optional</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                )}
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" onClick={() => setEditDialog({ open: false, type: '', data: null })} className="rounded-pill px-4">Cancel</Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={saving} className="rounded-pill px-4 fw-bold">
              {saving ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Create Referral Code Modal */}
        <Modal show={showCodeModal} onHide={() => setShowCodeModal(false)} size="lg" centered className="glass-modal">
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
                    <Form.Label className="small opacity-75">Assign to Partner</Form.Label>
                    <Form.Select
                      className="bg-light shadow-none"
                      value={selectedPartner}
                      onChange={(e) => setSelectedPartner(e.target.value)}
                    >
                      <option value="">-- Select Partner --</option>
                      {availablePartners.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Custom Code</Form.Label>
                    <Form.Control
                      className="font-monospace"
                      placeholder="e.g. SUMMER2024"
                      value={newReferralCode}
                      onChange={(e) => setNewReferralCode(e.target.value.toUpperCase())}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={codeStartDate}
                      onChange={(e) => setCodeStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={codeEndDate}
                      onChange={(e) => setCodeEndDate(e.target.value)}
                      min={codeStartDate}
                    />
                    <Form.Text className="opacity-50 small">Optional</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small opacity-75">Discount Percentage (%)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder={`0-${parseFloat(partners.find(p => p.id === parseInt(selectedPartner))?.commission_rate || 20)}`}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      min="0"
                      max={parseFloat(partners.find(p => p.id === parseInt(selectedPartner))?.commission_rate || 20)}
                    />
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
            <Button variant="light" onClick={() => setShowCodeModal(false)} className="rounded-pill px-4">Cancel</Button>
            <Button 
              variant="primary" 
              onClick={createReferralCode} 
              disabled={creating || !selectedPartner || !newReferralCode || discountPercent === ''} 
              className="rounded-pill px-4 fw-bold"
            >
              {creating ? <Spinner animation="border" size="sm" /> : 'Generate Code'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Approve Partner Modal */}
        <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered className="glass-modal">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Approve Partner</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <p>Approve <strong>{partnerToApprove?.name}</strong> and assign a commission rate.</p>
              <Form.Group>
                <Form.Label className="small opacity-75">Commission Rate (%)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="e.g. 20"
                  value={commissionRateToAssign}
                  onChange={(e) => setCommissionRateToAssign(e.target.value)}
                  min="0"
                  max="100"
                />
                <Form.Text className="text-muted">
                  This rate defines the total pool for discounts and partner earnings.
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" onClick={() => setShowApproveModal(false)} className="rounded-pill px-4">Cancel</Button>
            <Button variant="success" onClick={confirmApprovePartner} disabled={approving} className="rounded-pill px-4 fw-bold">
              {approving ? <Spinner animation="border" size="sm" /> : 'Approve & Assign'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal show={deleteDialog.open} onHide={() => setDeleteDialog({ open: false, type: '', id: null, name: '' })} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4 text-center">
            <Trash size={48} className="text-danger mb-3" />
            <p className="mb-0">
              Are you sure you want to delete {deleteDialog.type === 'user' ? 'user' : deleteDialog.type === 'partner' ? 'partner' : 'referral code'}{' '}
              <strong className="text-danger">"{deleteDialog.name}"</strong>?
            </p>
            <p className="small text-muted mt-2">This action is permanent and cannot be reversed.</p>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4 justify-content-center">
            <Button variant="light" onClick={() => setDeleteDialog({ open: false, type: '', id: null, name: '' })} className="rounded-pill px-4">No, Keep it</Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={saving} className="rounded-pill px-4 fw-bold">
              {saving ? <Spinner animation="border" size="sm" /> : 'Yes, Delete it'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <style jsx global>{`
        .dashboard-container {
          background: var(--background);
          color: var(--foreground);
        }

        .glass-navbar {
          background: var(--navbar-bg);
          border-bottom: 1px solid var(--card-border);
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
          background: var(--primary-color);
          color: white;
        }

        .glass-card-dark {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 8px;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .custom-tabs .nav-link {
          color: var(--secondary-color);
          font-weight: 500;
        }

        .custom-tabs .nav-link.active {
          color: var(--primary-color);
          border-bottom: 2px solid var(--primary-color);
          background: transparent;
        }

        .glass-search {
          background: var(--background);
          border: 1px solid var(--card-border);
        }

        .custom-table {
          --bs-table-bg: transparent; /* Ensure table background is transparent */
          --bs-table-color: var(--foreground); /* Inherit text color from theme */
          --bs-table-border-color: var(--card-border); /* Use card border for table borders */
        }

        .custom-table thead th {
          background: var(--card-bg); /* Use card background for header */
          color: var(--secondary-color);
          border-bottom: 1px solid var(--card-border);
          padding: 1rem 1.25rem; /* More padding for header cells */
        }

        .custom-table tbody td {
          padding: 0.75rem 1.25rem; /* Consistent padding for body cells */
          border-bottom: 1px solid var(--card-border); /* Add bottom border to body cells */
        }

        .custom-table tbody tr:last-child td {
          border-bottom: none; /* No bottom border for the last row */
        }

        [data-bs-theme="dark"] .custom-table thead th {
          background: rgba(255,255,255,0.02);
        }

        .glass-modal .modal-content {
          background: var(--card-bg);
          color: var(--foreground);
          border: 1px solid var(--card-border);
        }

        .custom-badge {
          border-radius: 0.375rem; /* Bootstrap's default for rounded-pill */
          padding: 0.35em 0.65em;
          font-size: 0.75em;
          font-weight: 600;
          line-height: 1;
          display: inline-block;
          text-align: center;
          white-space: nowrap;
          vertical-align: baseline;
        }
      `}</style>
    </>
  );
}