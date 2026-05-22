'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Modal,
  Spinner,
  InputGroup
} from 'react-bootstrap';
import {
  BoxArrowInRight,
  PersonPlus,
  Envelope,
  Lock,
  ArrowRepeat,
  CheckCircle,
  Eye,
  EyeSlash
} from 'react-bootstrap-icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'NOT_VERIFIED') {
          setPendingEmail(email);
          setShowVerifyModal(true);
          return;
        }
        toast.error(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('lastLogin', Date.now().toString());

      toast.success('Login successful!');
      router.push(`/${data.user.role}`);
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('OTP sent to your email!');
        setResendDisabled(true);
        setCountdown(60);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setResendDisabled(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error('Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, otp })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Email verified successfully! Please login.');
        setShowVerifyModal(false);
        setOtp('');
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (err) {
      toast.error('Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpPaste = (e) => {
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      setOtp(pasteData);
    }
  };

  return (
    <>
      <Toaster position="top-center" />

      {/* Verification Modal */}
      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Verify Your Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Your email is not verified. Please verify your email to login.</p>
          <p className="text-muted small">
            We'll send an OTP to: <strong>{pendingEmail}</strong>
          </p>
          <InputGroup className="mt-3">
            <Form.Control
              type="text"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onPaste={handleOtpPaste}
              maxLength={6}
            />
            <Button
              variant="primary"
              onClick={handleVerifyOtp}
              disabled={verifying || otp.length !== 6}
            >
              {verifying ? <Spinner animation="border" size="sm" /> : <CheckCircle className="me-1" />}
              {verifying ? ' Verifying...' : 'Verify'}
            </Button>
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowVerifyModal(false); setOtp(''); }}>
            Cancel
          </Button>
          <Button
            variant="outline-primary"
            onClick={handleSendOtp}
            disabled={resendDisabled}
          >
            {resendDisabled ? (
              <><ArrowRepeat className="me-1" /> Resend ({countdown}s)</>
            ) : (
              <><ArrowRepeat className="me-1" /> Resend OTP</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Login Page UI */}
      <div className="auth-wrapper" suppressHydrationWarning>
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} sm={10} md={8} lg={5}>
              <Card className="glass-card">
                <Card.Body className="p-4 p-md-5">
                  <div className="text-center mb-4" suppressHydrationWarning>
                    <div className="auth-icon-circle" suppressHydrationWarning>
                      <BoxArrowInRight size={30} />
                    </div>
                    <h1 className="h3 fw-bold" suppressHydrationWarning>Welcome</h1>
                    <p className="opacity-75 small" suppressHydrationWarning>Sign in to continue to your dashboard</p>
                  </div>

                  <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-3" controlId="loginEmail">
                      <Form.Label>Email Address</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-transparent border-end-0">
                          <Envelope />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          placeholder="name@example.com"
                          className="bg-transparent border-start-0 ps-0 shadow-none"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="loginPassword">
                      <Form.Label>Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-transparent border-end-0">
                          <Lock />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="bg-transparent border-start-0 border-end-0 ps-0 shadow-none"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                        <Button
                          variant="outline-secondary"
                          className="border-start-0 bg-transparent border-1"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeSlash /> : <Eye />}
                        </Button>
                      </InputGroup>
                      <div className="text-end mt-2" suppressHydrationWarning>
                        <Link href="/forgot-password" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500' }}>
                          Forgot Password?
                        </Link>
                      </div>
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-100 primary-btn mb-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </Form>

                  <div className="text-center" suppressHydrationWarning>
                    <Link href="/register" className="auth-link">
                      <PersonPlus />
                      New Partner? Register here
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <style jsx global>{`
        .glass-card .form-label {
          font-weight: 500;
        }
      `}</style>
    </>
  );
}
