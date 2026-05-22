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
  Spinner,
  InputGroup
} from 'react-bootstrap';
import {
  Key,
  Envelope,
  Lock,
  ArrowLeft,
  ShieldLock,
  CheckCircle,
  Eye,
  EyeSlash
} from 'react-bootstrap-icons';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0: Request, 1: Verify & Reset, 2: Success
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Reset OTP sent to your email!');
        setStep(1);
        setOtpVerified(false);
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
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
        setOtpValues(prev => {
          const updated = [...prev];
          updated[index - 1] = '';
          return updated;
        });
      }
    }
  };

  const handleCheckOTP = async () => {
    const otp = otpValues.join('');
    if (otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/check-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('OTP verified! Now set your new password.');
        setOtpVerified(true);
      } else {
        toast.error(data.error || 'Verification failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otp = otpValues.join('');
    if (!otpVerified) {
      toast.error('Please verify OTP first');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Password reset successfully!');
        setStep(2);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        toast.error(data.error || 'Reset failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
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
                  {step === 0 && (
                    <>
                      <div className="text-center mb-4">
                        <div className="auth-icon-circle">
                          <Key size={30} />
                        </div>
                        <h2 className="h3 fw-bold">Forgot Password?</h2>
                        <p className="opacity-75 small">Enter your email and we'll send you a reset OTP.</p>
                      </div>

                      <Form onSubmit={handleSendOTP}>
                        <Form.Group className="mb-4" controlId="forgotEmail">
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
                            />
                          </InputGroup>
                        </Form.Group>

                        <Button type="submit" variant="primary" className="w-100 primary-btn mb-4" disabled={loading}>
                          {loading ? <Spinner animation="border" size="sm" /> : 'Send Reset OTP'}
                        </Button>

                        <div className="text-center">
                          <Link href="/login" className="auth-link">
                            <ArrowLeft />
                            Back to Login
                          </Link>
                        </div>
                      </Form>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <div className="text-center mb-4">
                        <div className="auth-icon-circle bg-danger bg-opacity-25 text-danger">
                          <ShieldLock size={30} />
                        </div>
                        <h2 className="h4 fw-bold">Reset Password</h2>
                        <p className="opacity-75 small">We've sent a 6-digit code to <br/><strong>{email}</strong></p>
                      </div>

                      <Form onSubmit={otpVerified ? handleResetPassword : (e) => e.preventDefault()}>
                        <Form.Label className="small fw-bold text-uppercase opacity-75 text-center d-block mb-3">Enter OTP Code</Form.Label>
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
                              required
                              disabled={otpVerified || verifyingOtp}
                            />
                          ))}
                        </div>

                        {!otpVerified ? (
                          <Button 
                            type="button" 
                            variant="primary" 
                            className="w-100 primary-btn mb-3" 
                            onClick={handleCheckOTP}
                            disabled={verifyingOtp || otpValues.join('').length !== 6}
                          >
                            {verifyingOtp ? <Spinner animation="border" size="sm" /> : 'Verify OTP'}
                          </Button>
                        ) : (
                          <div className="fade-in">
                            <div className="alert alert-success py-2 small d-flex align-items-center mb-4">
                              <CheckCircle className="me-2" /> OTP Verified! Set your new password below.
                            </div>
                            
                            <Form.Group className="mb-3" controlId="newPassword">
                              <Form.Label>New Password</Form.Label>
                              <InputGroup>
                                <InputGroup.Text className="bg-transparent border-end-0">
                                  <Lock />
                                </InputGroup.Text>
                                <Form.Control
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Min. 6 characters"
                                  className="bg-transparent border-start-0 border-end-0 ps-0 shadow-none"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  required
                                />
                                <Button
                                  variant="outline-secondary"
                                  className="border-start-0 bg-transparent border-1"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeSlash /> : <Eye />}
                                </Button>
                              </InputGroup>
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="confirmPassword">
                              <Form.Label>Confirm Password</Form.Label>
                              <InputGroup>
                                <InputGroup.Text className="bg-transparent border-end-0">
                                  <Lock />
                                </InputGroup.Text>
                                <Form.Control
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Repeat new password"
                                  className="bg-transparent border-start-0 ps-0 shadow-none"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  required
                                />
                              </InputGroup>
                            </Form.Group>

                            <Button type="submit" variant="danger" className="w-100 primary-btn mb-3" disabled={loading} style={{ background: 'var(--bs-danger)', borderColor: 'var(--bs-danger)' }}>
                              {loading ? <Spinner animation="border" size="sm" /> : 'Reset Password'}
                            </Button>
                          </div>
                        )}

                        <div className="text-center">
                          <Button variant="link" className="auth-link p-0 border-0" onClick={() => setStep(0)} disabled={loading}>
                            Try a different email
                          </Button>
                        </div>
                      </Form>
                    </>
                  )}

                  {step === 2 && (
                    <div className="text-center py-4">
                      <CheckCircle size={80} color="#38a169" className="mb-4" />
                      <h2 className="h4 fw-bold">Password Reset!</h2>
                      <p className="opacity-75 mb-4">Your password has been changed successfully. You can now login with your new password.</p>
                      <Button variant="primary" className="primary-btn px-5" onClick={() => router.push('/login')}>
                        Login Now
                      </Button>
                      <p className="opacity-50 mt-4 small">Redirecting to login...</p>
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
        .form-control {
          color: var(--foreground) !important;
          background-color: var(--card-bg) !important;
        }
        .auth-wrapper {
          background-color: var(--background) !important;
        }
        .fade-in {
          animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
