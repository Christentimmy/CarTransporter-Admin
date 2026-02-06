const AdminShipments = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
        <p className="text-sm text-muted-foreground">
          Track and control all shipments across the platform.
        </p>
      </div>
      {/* TODO: Implement shipments table, filters, and detail views */}
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Shipment monitoring will be implemented here (statuses, timelines, and alerts).
      </div>
    </div>
  );
};

export default AdminShipments;

