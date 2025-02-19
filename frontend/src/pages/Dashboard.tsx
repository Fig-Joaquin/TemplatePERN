export const Dashboard = () => {
  return (
    <div className="p-6">
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground">Ventas Diarias</h3>
          <p className="text-3xl font-bold text-primary">$249.95</p>
          <p className="text-sm text-muted-foreground">67% Crecimiento</p>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground">Ventas Mensuales</h3>
          <p className="text-3xl font-bold text-destructive">$2,942.32</p>
          <p className="text-sm text-muted-foreground">36% Disminución</p>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground">Ventas Anuales</h3>
          <p className="text-3xl font-bold text-primary">$8,638.32</p>
          <p className="text-sm text-muted-foreground">80% Crecimiento</p>
        </div>
      </main>
    </div>
  )
}

