const ErrorHandler = {
  handleApiError(error) {
    if (!navigator.onLine) {
      return 'No internet connection. Please check your network.';
    }

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Session expired. Please login again.';
    }

    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'Access denied. You do not have permission.';
    }

    if (error.message.includes('404')) {
      return 'Resource not found.';
    }

    if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }

    return error.message || 'An unexpected error occurred.';
  },

  logError(context, error) {
    console.error(`❌ [${context}]`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  },

  showUserError(message, duration = 3000) {
    const existingError = document.querySelector('.error-toast');
    if (existingError) existingError.remove();

    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
};

export default ErrorHandler;
