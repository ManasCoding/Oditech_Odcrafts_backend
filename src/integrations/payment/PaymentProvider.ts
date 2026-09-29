export interface PaymentProvider {
  createOrder(amount: number, currency: string, receipt: string): Promise<any>;
  verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean>;
  createRefund(paymentId: string, amount?: number): Promise<any>;
  getPaymentStatus(paymentId: string): Promise<any>;
}
