type ToastType = 'success' | 'error' | 'info';

class Toast {
  private show(message: string, type: ToastType) {
    // Simple alert for now, but you can enhance this with a proper toast library if needed
    alert(`${type.toUpperCase()}: ${message}`);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }
}

export const toast = new Toast();