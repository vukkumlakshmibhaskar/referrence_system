'use client';

import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { ExclamationTriangle } from 'react-bootstrap-icons';

const ConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  icon: Icon = ExclamationTriangle
}) => {
  return (
    <Modal show={show} onHide={onHide} centered className="glass-modal">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold d-flex align-items-center">
          <Icon className={`text-${confirmVariant} me-2`} size={24} />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4 pt-0">
        <p className="mb-0 opacity-75" style={{ color: 'var(--foreground)' }}>
          {message}
        </p>
      </Modal.Body>
      <Modal.Footer className="border-0 p-4 pt-0">
        <Button 
          variant="light" 
          onClick={onHide} 
          disabled={loading}
          className="rounded-pill px-4"
        >
          {cancelText}
        </Button>
        <Button 
          variant={confirmVariant} 
          onClick={onConfirm} 
          disabled={loading}
          className="rounded-pill px-4 fw-bold"
        >
          {loading ? <Spinner animation="border" size="sm" /> : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;
