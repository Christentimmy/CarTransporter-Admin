const AdminRequests = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <p className="text-sm text-muted-foreground">
          View and manage transport requests flowing through the platform.
        </p>
      </div>
      {/* TODO: Implement requests table, filters, and moderation tools */}
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Request oversight will be implemented here (pending, approved, and rejected requests).
      </div>
    </div>
  );
};

export default AdminRequests;

