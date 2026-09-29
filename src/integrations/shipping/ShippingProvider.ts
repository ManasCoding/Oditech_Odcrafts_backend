export interface ShippingProvider {
  createShipment(orderData: any): Promise<any>;
  schedulePickup(shipmentId: string, date: Date): Promise<any>;
  getTrackingInfo(trackingNumber: string): Promise<any>;
  cancelShipment(shipmentId: string): Promise<any>;
}
