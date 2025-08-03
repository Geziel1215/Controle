import React from 'react';
import './CustomDialog.css';

function CustomDialog({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  children, 
  showConfirm = false, 
  onConfirm, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-container">
        <div className="dialog-header">
          {title && <h3>{title}</h3>}
          <button className="dialog-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-content">
          {message && <p>{message}</p>}
          {children}
        </div>
        
        {showConfirm && (
          <div className="dialog-actions">
            <button className="dialog-btn cancel-btn" onClick={onClose}>
              {cancelText}
            </button>
            <button className="dialog-btn confirm-btn" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomDialog;