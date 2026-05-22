'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  InputGroup
} from 'react-bootstrap';
import {
  PersonPlus,
  Envelope,
  Lock,
  Person,
  Eye,
  EyeSlash,
  BoxArrowInRight,
  ShieldCheck,
  CheckCircle,
  Building,
  Briefcase,
  List,
  People
} from 'react-bootstrap-icons';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');

  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    position: ''
  });
  const [isInvited, setIsInvited] = useState(false);

  useEffect(() => {
    if (inviteToken) {
      // Fetch invitation details if token exists
      const verifyToken = async () => {
        try {
          const res = await fetch(`/api/auth/verify-invite?token=${inviteToken}`);
          const data = await res.json();
          if (res.ok) {
            setFormData(prev => ({ ...prev, email: data.email }));
            setIsInvited(true);
          } else {
            toast.error(data.error || 'Invalid or expired invitation');
          }
        } catch (err) {
          console.error('Token verification error:', err);
        }
      };
      verifyToken();
    }
  }, [inviteToken]);

  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const steps = ['Register', 'Verify Email', 'Complete'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          position: formData.position,
          token: inviteToken || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      if (data.pendingVerification) {
        setActiveStep(1);
        toast.success('OTP sent to your email!');
        startCountdown();
      } else {
        toast.success('Registration successful!');
        setActiveStep(2); // Show success screen
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
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
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const newOtp = [...otpValues];
    pasteData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtpValues(newOtp);

    // Focus last filled input or the next empty one
    const nextIndex = Math.min(pasteData.length, 5);
    const nextInput = document.getElementById(`otp-input-${nextIndex}`);
    if (nextInput) nextInput.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        setOtpValues((prev) => {
          const newOtp = [...prev];
          newOtp[index - 1] = '';
          return newOtp;
        });
      }
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpValues.join('');
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Invalid OTP');
        setOtpValues(['', '', '', '', '', '']);
        return;
      }

      toast.success('Email verified successfully!');
      setActiveStep(2);

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('OTP resent to your email!');
        startCountdown();
      } else {
        toast.error(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="auth-wrapper" suppressHydrationWarning>
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} sm={10} md={8} lg={5}>
              <Card className="glass-card">
                <Card.Body className="p-4 p-md-5">
                  {activeStep === 0 && (
                    <>
                      <div className="text-center mb-4">
                        <div className="auth-icon-circle">
                          <PersonPlus size={30} />
                        </div>
                        <h1 className="h3 fw-bold">Partner Registration</h1>
                        <p className="opacity-75 small">Create your account</p>
                      </div>

                      <Form onSubmit={handleSubmit}>
                        <Row className="g-2">
                          <Col md={6}>
                            <Form.Group className="mb-2" controlId="registerName">
                              <Form.Label className="small">Full Name</Form.Label>
                              <InputGroup size="sm">
                                <InputGroup.Text className="bg-transparent border-end-0">
                                  <Person size={14} />
                                </InputGroup.Text>
                                <Form.Control
                                  placeholder="Your name"
                                  className="bg-transparent border-start-0 ps-0 shadow-none"
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  required
                                />
                              </InputGroup>
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-2" controlId="registerEmail">
                              <Form.Label className="small">Email Address</Form.Label>
                              <InputGroup size="sm">
                                <InputGroup.Text className="bg-transparent border-end-0">
                                  <Envelope size={14} />
                                </InputGroup.Text>
                                <Form.Control
                                  type="email"
                                  placeholder="name@example.com"
                                  className="bg-transparent border-start-0 ps-0 shadow-none"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  required
                                  readOnly={isInvited}
                                  disabled={isInvited}
                                />
                              </InputGroup>
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-2" controlId="registerPassword">
                              <Form.Label className="small">Password</Form.Label>
                              <InputGroup size="sm">
                                <InputGroup.Text className="bg-transparent border-end-0">
                                  <Lock size={14} />
                                </InputGroup.Text>
                                <Form.Control
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Create password"
                                  className="bg-transparent border-start-0 border-end-0 ps-0 shadow-none"
                                  value={formData.password}
                                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                  required
                                />
                                <Button
                                  variant="outline-secondary"
                                  className="border-start-0 bg-transparent border-1 py-0"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeSlash size={14} /> : <Eye size={14} />}
                                </Button>
                              </InputGroup>
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-2" controlId="registerPosition">
                              <Form.Label className="small">Position</Form.Label>
                              <InputGroup size="sm">
                                <InputGroup.Text className="bg-transparent border-end-0">
                                  <Briefcase size={14} />
                                </InputGroup.Text>
                                <Form.Control
                                  placeholder="e.g. CEO"
                                  className="bg-transparent border-start-0 ps-0 shadow-none"
                                  value={formData.position}
                                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                />
                              </InputGroup>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Button
                          type="submit"
                          variant="primary"
                          className="w-100 primary-btn mb-4"
                          disabled={loading}
                        >
                          {loading ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            isInvited ? 'Accept Invitation & Verify Email' : 'Register & Send OTP'
                          )}
                        </Button>
                      </Form>

                      <div className="text-center">
                        <Link href="/login" className="auth-link">
                          <BoxArrowInRight />
                          Already have an account? Login
                        </Link>
                      </div>
                    </>
                  )}

                  {activeStep === 1 && (
                    <>
                      <div className="text-center mb-4">
                        <div className="auth-icon-circle">
                          <ShieldCheck size={30} />
                        </div>
                        <h1 className="h4 fw-bold">Verify Your Email</h1>
                        <p className="opacity-75">
                          Enter the 6-digit OTP sent to<br />
                          <strong>{formData.email}</strong>
                        </p>
                      </div>

                      <div className="d-flex justify-content-center gap-2 mb-4">
                        {otpValues.map((value, index) => (
                          <Form.Control
                            key={index}
                            id={`otp-input-${index}`}
                            type="text"
                            className="bg-transparent text-center fw-bold shadow-none"
                            style={{ width: '45px', height: '55px', fontSize: '1.5rem' }}
                            value={value}
                            maxLength={1}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                          />
                        ))}
                      </div>

                      <Button
                        variant="primary"
                        className="w-100 primary-btn mb-3"
                        onClick={handleVerifyOtp}
                        disabled={loading || otpValues.join('').length !== 6}
                      >
                        {loading ? <Spinner animation="border" size="sm" /> : 'Verify OTP'}
                      </Button>

                      <div className="text-center">
                        <p className="opacity-75 small">
                          Didn't receive OTP?{' '}
                          <Button
                            variant="link"
                            className="p-0 fw-bold text-decoration-none"
                            onClick={handleResendOtp}
                            disabled={resendDisabled}
                          >
                            {resendDisabled ? `Resend in ${countdown}s` : 'Resend OTP'}
                          </Button>
                        </p>
                      </div>
                    </>
                  )}

                  {activeStep === 2 && (
                    <div className="text-center py-4">
                      <CheckCircle size={80} color="#38a169" className="mb-4" />
                      <h2 className="h4 fw-bold">Email Verified!</h2>
                      <p className="opacity-75 mb-4">
                        Your account has been verified successfully.
                      </p>
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="opacity-50 mt-3 small">Redirecting to login...</p>
                    </div>
                  )}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
