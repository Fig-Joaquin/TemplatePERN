import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wrench, 
  Car, 
  AlertTriangle, 
  Clock,
  DollarSign,
  Package,
  FileText,
  Activity,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchWorkPayments } from "@/services/work/workPayment";
import { fetchGastos } from "@/services/gastoService";
import { getAllWorkOrders } from "@/services/workOrderService";
import { fetchQuotations } from "@/services/quotationService";
import { getStockProducts } from "@/services/stockProductService";
import { fetchNotifications } from "@/services/notification/notificationService";
import { fetchVehicles } from "@/services/vehicleService";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { WorkPayment, Gasto, WorkOrder, Quotation, StockProduct, Vehicle } from "@/types/interfaces";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [, setPayments] = useState<WorkPayment[]>([]);
  const [, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<Quotation[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<StockProduct[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [activeVehicles, setActiveVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState({
    daily: { amount: 0, percentage: 0, trend: "up" as "up" | "down" },
    monthly: { amount: 0, percentage: 0, trend: "up" as "up" | "down" },
    annual: { amount: 0, percentage: 0, trend: "up" as "up" | "down" }
  });
  const [quickStats, setQuickStats] = useState({
    totalWorkOrders: 0,
    pendingQuotations: 0,
    lowStockItems: 0
  });

  // Estados para el resumen de hoy
  const [todayStats, setTodayStats] = useState({
    workOrdersToday: 0,
    quotationsToday: 0,
    totalWorkOrders: 0,
    totalQuotations: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          paymentsData, 
          gastosData, 
          workOrdersData, 
          quotationsData, 
          stockData, 
          notificationsData,
          vehiclesData
        ] = await Promise.all([
          fetchWorkPayments(),
          fetchGastos(),
          getAllWorkOrders(),
          fetchQuotations(),
          getStockProducts(),
          fetchNotifications(),
          fetchVehicles()
        ]);
        
        setPayments(paymentsData);
        setGastos(gastosData);
        
        // Calcular estadísticas financieras
        calculateStats(paymentsData, gastosData);
        
        // Procesar datos adicionales para el dashboard
        processAdditionalData(
          workOrdersData, 
          quotationsData, 
          stockData, 
          notificationsData,
          vehiclesData
        );
        
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processAdditionalData = (
    workOrders: WorkOrder[], 
    quotations: Quotation[], 
    stock: StockProduct[], 
    notifications: any[],
    vehicles: Vehicle[]
  ) => {
    // Obtener fecha de hoy como string YYYY-MM-DD
    const today = new Date();
    const todayStr = getLocalDateString(today);

    // Filtrar órdenes de trabajo de hoy
    const workOrdersToday = workOrders.filter(wo => {
      const orderDateStr = typeof wo.order_date === 'string' 
        ? (wo.order_date as string).split('T')[0] 
        : getLocalDateString(new Date(wo.order_date));
      return orderDateStr === todayStr;
    });

    // Filtrar cotizaciones de hoy
    const quotationsToday = quotations.filter(q => {
      if (!q.entry_date) return false;
      const entryDateStr = typeof q.entry_date === 'string' 
        ? (q.entry_date as string).split('T')[0] 
        : getLocalDateString(new Date(q.entry_date));
      return entryDateStr === todayStr;
    });

    // Órdenes de trabajo recientes (últimas 5)
    const sortedWorkOrders = workOrders
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
      .slice(0, 5);
    setRecentWorkOrders(sortedWorkOrders);
    
    // Cotizaciones recientes (últimas 5)
    const sortedQuotations = quotations
      .sort((a, b) => new Date(b.entry_date || 0).getTime() - new Date(a.entry_date || 0).getTime())
      .slice(0, 5);
    setRecentQuotations(sortedQuotations);

    // Productos con bajo stock (menos de 10 unidades)
    const lowStock = stock.filter(item => item.quantity < 10).slice(0, 5);
    setLowStockProducts(lowStock);

    // Notificaciones recientes (últimas 5)
    const recentNotifs = notifications
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
    setRecentNotifications(recentNotifs);

    // Vehículos activos (con órdenes de trabajo activas)
    const activeWorkOrderVehicleIds = workOrders
      .filter(wo => (wo as any).order_status === 'in_progress' || (wo as any).order_status === 'not_started')
      .map(wo => wo.vehicle?.vehicle_id)
      .filter(Boolean);
    
    const uniqueActiveVehicles = vehicles.filter(v => 
      activeWorkOrderVehicleIds.includes(v.vehicle_id)
    ).slice(0, 5);
    setActiveVehicles(uniqueActiveVehicles);

    // Estadísticas rápidas
    setQuickStats({
      totalWorkOrders: workOrders.filter(wo => (wo as any).order_status === 'in_progress' || (wo as any).order_status === 'not_started').length,
      pendingQuotations: quotations.filter(q => q.quotation_status === 'pending').length,
      lowStockItems: lowStock.length
    });

    // Estadísticas de hoy
    setTodayStats({
      workOrdersToday: workOrdersToday.length,
      quotationsToday: quotationsToday.length,
      totalWorkOrders: workOrders.length,
      totalQuotations: quotations.length
    });
  };

  const calculateStats = (payments: WorkPayment[], gastos: Gasto[]) => {
    const now = new Date();
    
    // Fechas para cálculos diarios
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    
    // Fechas para cálculos mensuales
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfCurrentMonthLastMonthCalc = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Fechas para cálculos anuales
    const startOfCurrentYear = new Date(now.getFullYear(), 0, 1);
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const startOfCurrentYearLastYearCalc = new Date(now.getFullYear(), 0, 1);

    // Ingresos del día actual
    const dailyIncome = calculateIncomeInRange(payments, today, tomorrow);
    // Ingresos del día anterior
    const yesterdayIncome = calculateIncomeInRange(payments, yesterday, today);
    // Gastos del día actual
    const dailyExpenses = calculateExpensesInRange(gastos, today, tomorrow);
    // Gastos del día anterior
    const yesterdayExpenses = calculateExpensesInRange(gastos, yesterday, today);

    // Ingresos del mes actual
    const monthlyIncome = calculateIncomeInRange(payments, startOfCurrentMonth, startOfNextMonth);
    // Ingresos del mes anterior
    const lastMonthIncome = calculateIncomeInRange(payments, startOfLastMonth, startOfCurrentMonthLastMonthCalc);
    // Gastos del mes actual
    const monthlyExpenses = calculateExpensesInRange(gastos, startOfCurrentMonth, startOfNextMonth);
    // Gastos del mes anterior
    const lastMonthExpenses = calculateExpensesInRange(gastos, startOfLastMonth, startOfCurrentMonthLastMonthCalc);

    // Ingresos del año actual
    const annualIncome = calculateIncomeInRange(payments, startOfCurrentYear, startOfNextYear);
    // Ingresos del año anterior
    const lastYearIncome = calculateIncomeInRange(payments, startOfLastYear, startOfCurrentYearLastYearCalc);
    // Gastos del año actual
    const annualExpenses = calculateExpensesInRange(gastos, startOfCurrentYear, startOfNextYear);
    // Gastos del año anterior
    const lastYearExpenses = calculateExpensesInRange(gastos, startOfLastYear, startOfCurrentYearLastYearCalc);

    // Totales (ingresos - gastos)
    const dailyTotal = dailyIncome - dailyExpenses;
    const yesterdayTotal = yesterdayIncome - yesterdayExpenses;
    const monthlyTotal = monthlyIncome - monthlyExpenses;
    const lastMonthTotal = lastMonthIncome - lastMonthExpenses;
    const annualTotal = annualIncome - annualExpenses;
    const lastYearTotal = lastYearIncome - lastYearExpenses;

    // Validar que todos los totales sean números válidos
    const validateNumber = (value: number, name: string): number => {
      if (isNaN(value) || !isFinite(value)) {
        console.warn(`⚠️ Valor inválido para ${name}: ${value}, usando 0`);
        return 0;
      }
      return value;
    };

    const validDailyTotal = validateNumber(dailyTotal, 'dailyTotal');
    const validYesterdayTotal = validateNumber(yesterdayTotal, 'yesterdayTotal');
    const validMonthlyTotal = validateNumber(monthlyTotal, 'monthlyTotal');
    const validLastMonthTotal = validateNumber(lastMonthTotal, 'lastMonthTotal');
    const validAnnualTotal = validateNumber(annualTotal, 'annualTotal');
    const validLastYearTotal = validateNumber(lastYearTotal, 'lastYearTotal');

    // Calcular porcentajes de cambio
    const dailyPercentage = calculatePercentageChange(validDailyTotal, validYesterdayTotal);
    const monthlyPercentage = calculatePercentageChange(validMonthlyTotal, validLastMonthTotal);
    const annualPercentage = calculatePercentageChange(validAnnualTotal, validLastYearTotal);

    setStats({
      daily: {
        amount: validDailyTotal,
        percentage: Math.abs(Math.round(dailyPercentage)),
        trend: dailyPercentage >= 0 ? "up" : "down"
      },
      monthly: {
        amount: validMonthlyTotal,
        percentage: Math.abs(Math.round(monthlyPercentage)),
        trend: monthlyPercentage >= 0 ? "up" : "down"
      },
      annual: {
        amount: validAnnualTotal,
        percentage: Math.abs(Math.round(annualPercentage)),
        trend: annualPercentage >= 0 ? "up" : "down"
      }
    });
  };

  // Función para obtener fecha como string YYYY-MM-DD en zona horaria local
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Actualizar la función calculateIncomeInRange
  const calculateIncomeInRange = (payments: WorkPayment[], start: Date, end: Date): number => {
    // Convertir las fechas de inicio y fin a strings YYYY-MM-DD para comparación simple
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);
    
    const filteredPayments = payments.filter(payment => {
      // Obtener la fecha como string YYYY-MM-DD
      let paymentDateStr: string;
      
      if (typeof payment.payment_date === 'string') {
        // Si es string, extraer la parte de fecha
        paymentDateStr = payment.payment_date.split('T')[0];
      } else {
        // Si ya es Date, convertirlo a string YYYY-MM-DD
        paymentDateStr = getLocalDateString(payment.payment_date);
      }
      
      // Verificamos si el pago está en estado válido
      const isValidPaymentStatus = 
        payment.payment_status === "pagado" || payment.payment_status === "parcial";
      
      if (!isValidPaymentStatus) {
        return false;
      }
      
      // Para rangos de fechas: incluye start, excluye end
      const isInRange = paymentDateStr >= startDateStr && paymentDateStr < endDateStr;
      
      return isInRange;
    });
    
    const result = filteredPayments.reduce((sum, payment) => {
      // Asegurar que amount_paid sea tratado como número
      const montoNumerico = typeof payment.amount_paid === 'string' ? parseFloat(payment.amount_paid) : Number(payment.amount_paid);
      return sum + montoNumerico;
    }, 0);
    return result;
  };

  // Actualizar la función calculateExpensesInRange
  const calculateExpensesInRange = (gastos: Gasto[], start: Date, end: Date): number => {
    // Convertir las fechas de inicio y fin a strings YYYY-MM-DD para comparación simple
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);
    
    const filteredGastos = gastos.filter(gasto => {
      // Obtener la fecha como string YYYY-MM-DD
      let gastoDateStr: string;
      
      if (typeof gasto.fecha_gasto === 'string') {
        // Si es string, extraer la parte de fecha
        gastoDateStr = gasto.fecha_gasto.split('T')[0];
      } else {
        // Si ya es Date, convertirlo a string YYYY-MM-DD
        gastoDateStr = getLocalDateString(gasto.fecha_gasto);
      }
      
      // Para rangos de fechas: incluye start, excluye end
      const isInRange = gastoDateStr >= startDateStr && gastoDateStr < endDateStr;
      
      return isInRange;
    });
    
    const result = filteredGastos.reduce((sum, gasto) => {
      // Asegurar que gasto.monto sea tratado como número
      const montoNumerico = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : Number(gasto.monto);
      return sum + montoNumerico;
    }, 0);
    return result;
  };

  const calculatePercentageChange = (current: number, previous: number): number => {
    // Si ambos valores son cero, no hay cambio
    if (current === 0 && previous === 0) return 0;
    
    // Si el valor anterior es cero pero el actual no
    if (previous === 0) {
      // Si el valor actual es positivo, consideramos como 100% de aumento
      // Si es negativo, consideramos como 100% de disminución
      return current > 0 ? 100 : (current < 0 ? -100 : 0);
    }
    
    // Calcular el porcentaje de cambio normal
    const percentageChange = ((current - previous) / Math.abs(previous)) * 100;
    
    // Limitar el porcentaje a un rango razonable (-999% a 999%)
    return Math.max(-999, Math.min(999, percentageChange));
  };



  return (
    <motion.div 
      className="space-y-6 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Dashboard de Gestión</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/nueva-orden-trabajo")}
            className="flex items-center gap-2"
          >
            <Wrench className="h-4 w-4" />
            Nueva Orden
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/cotizaciones/nuevo")}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Nueva Cotización
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-6 text-lg text-muted-foreground">Cargando datos del sistema...</p>
        </div>
      ) : (
        <>
          {/* Estadísticas Financieras */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <DashboardCard 
                  title="Balance Diario" 
                  amount={formatPriceCLP(stats.daily.amount)} 
                  percentage={Math.round(stats.daily.percentage)} 
                  trend={stats.daily.trend} 
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <DashboardCard 
                  title="Balance Mensual" 
                  amount={formatPriceCLP(stats.monthly.amount)} 
                  percentage={Math.round(stats.monthly.percentage)} 
                  trend={stats.monthly.trend} 
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <DashboardCard 
                  title="Balance Anual" 
                  amount={formatPriceCLP(stats.annual.amount)} 
                  percentage={Math.round(stats.annual.percentage)} 
                  trend={stats.annual.trend} 
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Métricas Rápidas */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.55 }}
          >
            <QuickStatCard
              title="Órdenes Activas"
              value={quickStats.totalWorkOrders}
              icon={<Wrench className="h-5 w-5" />}
              color="bg-blue-500"
              onClick={() => navigate("/admin/orden-trabajo")}
            />
            <QuickStatCard
              title="Cotizaciones Pendientes"
              value={quickStats.pendingQuotations}
              icon={<FileText className="h-5 w-5" />}
              color="bg-yellow-500"
              onClick={() => navigate("/admin/cotizaciones")}
            />
            <QuickStatCard
              title="Stock Bajo"
              value={quickStats.lowStockItems}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="bg-red-500"
              onClick={() => navigate("/admin/productos")}
            />
          </motion.div>

          {/* Resumen de Hoy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Resumen de Hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{todayStats.workOrdersToday}</div>
                    <div className="text-sm text-blue-800">Órdenes Hoy</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{todayStats.quotationsToday}</div>
                    <div className="text-sm text-green-800">Cotizaciones Hoy</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{todayStats.totalWorkOrders}</div>
                    <div className="text-sm text-purple-800">Total Órdenes</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{todayStats.totalQuotations}</div>
                    <div className="text-sm text-orange-800">Total Cotizaciones</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{lowStockProducts.length}</div>
                    <div className="text-sm text-red-800">Productos Críticos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Secciones de Actividad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actividad Reciente */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.65 }}
            >
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Órdenes de trabajo Reciente
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/admin/orden-trabajo")}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentWorkOrders.slice(0, 4).map((order) => (
                    <div key={order.work_order_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">Orden #{order.work_order_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.vehicle?.license_plate} • {formatDate(order.order_date)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(order as any).order_status === 'not_started' ? 'No Iniciado' : 
                         (order as any).order_status === 'in_progress' ? 'En Progreso' : 
                         (order as any).order_status === 'finished' ? 'Finalizado' : 'Desconocido'}
                      </Badge>
                    </div>
                  ))}
                  {recentWorkOrders.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No hay órdenes recientes</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Alertas y Notificaciones */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.75 }}
            >
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas del Sistema
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/admin/productos")}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stock Bajo */}
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <div key={product.stock_product_id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="font-medium text-sm">{product.product?.product_name}</p>
                          <p className="text-xs text-red-600">Stock: {product.quantity} unidades</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">Bajo Stock</Badge>
                    </div>
                  ))}

                  {/* Notificaciones */}
                  {recentNotifications.slice(0, 2).map((notification, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">{notification.message}</p>
                          <p className="text-xs text-blue-600">{formatDate(notification.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {lowStockProducts.length === 0 && recentNotifications.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No hay alertas pendientes</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Cotizaciones y Vehículos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cotizaciones Recientes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.85 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Cotizaciones Recientes
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/admin/cotizaciones")}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentQuotations.slice(0, 4).map((quotation) => (
                    <div key={quotation.quotation_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Cotización #{quotation.quotation_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {quotation.vehicle?.license_plate} • {formatPriceCLP(quotation.total_price || 0)}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={quotation.quotation_status === 'approved' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {quotation.quotation_status === 'pending' ? 'Pendiente' : 
                         quotation.quotation_status === 'approved' ? 'Aprobada' : 'Rechazada'}
                      </Badge>
                    </div>
                  ))}
                  {recentQuotations.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No hay cotizaciones recientes</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Vehículos en Taller */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.95 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehículos en Taller
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/admin/vehiculos")}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeVehicles.slice(0, 4).map((vehicle) => (
                    <div key={vehicle.vehicle_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Car className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{vehicle.license_plate}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">En Servicio</Badge>
                    </div>
                  ))}
                  {activeVehicles.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No hay vehículos en taller</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
};

interface DashboardCardProps {
  title: string
  amount: string
  percentage: number
  trend: "up" | "down"
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, amount, percentage, trend }) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary">{amount}</p>
        <div className="flex items-center mt-2">
          {trend === "up" ? (
            <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
          )}
          <p className={`text-sm ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {percentage}% {trend === "up" ? "Crecimiento" : "Disminución"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface QuickStatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  onClick?: () => void
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({ title, value, icon, color, onClick }) => {
  return (
    <Card 
      className={`transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Dashboard;

