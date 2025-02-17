
export const Dashboard = () => {
  return (
    <div className="p-6">
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Ventas Diarias</h3>
          <p className="text-3xl font-bold text-green-500">$249.95</p>
          <p className="text-sm text-gray-500">67% Crecimiento</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Ventas Mensuales</h3>
          <p className="text-3xl font-bold text-red-500">$2,942.32</p>
          <p className="text-sm text-gray-500">36% Disminución</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Ventas Anuales</h3>
          <p className="text-3xl font-bold text-green-500">$8,638.32</p>
          <p className="text-sm text-gray-500">80% Crecimiento</p>
        </div>
      </main>
    </div>
  );
}
