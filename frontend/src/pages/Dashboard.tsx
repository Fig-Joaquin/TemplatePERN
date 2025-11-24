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
  Info,
  Activity,
  ArrowRight,
  Eye
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
import { getAllProductPurchases } from "@/services/productPurchaseService";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { getCompleteWorkOrderById } from "@/services/workOrderService";
import { WorkPayment, Gasto, WorkOrder, Quotation, StockProduct, Vehicle } from "@/types/interfaces";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<WorkPayment[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [productPurchases, setProductPurchases] = useState<any[]>([]);
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

  // Nuevo estado para los detalles del balance
  const [showDetailsDialog, setShowDetailsDialog] = useState<boolean>(false);
  const [, setDetailsType] = useState<"daily" | "monthly" | "annual">("daily");
  const [detailsData, setDetailsData] = useState<{
    period: string;
    income: number;
    expenses: number;
    balance: number;
    incomeTransactions: WorkPayment[];
    expenseTransactions: Gasto[];
    productPurchaseTransactions: any[];
  }>({
    period: "",
    income: 0,
    expenses: 0,
    balance: 0,
    incomeTransactions: [],
    expenseTransactions: [],
    productPurchaseTransactions: []
  });

  // Estado para el modal de detalle de orden de trabajo
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

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
          vehiclesData,
          productPurchasesData
        ] = await Promise.all([
          fetchWorkPayments(),
          fetchGastos(),
          getAllWorkOrders(),
          fetchQuotations([]),
          getStockProducts(),
          fetchNotifications(),
          fetchVehicles(),
          getAllProductPurchases()
        ]);

        setPayments(paymentsData);
        setGastos(gastosData);
        setProductPurchases(productPurchasesData);

        // Calcular estadísticas financieras incluyendo compras de productos
        calculateStats(paymentsData, gastosData, productPurchasesData);

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

  const calculateStats = (payments: WorkPayment[], gastos: Gasto[], productPurchases: any[]) => {
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
    // Gastos del día actual (gastos + compras de productos)
    const dailyExpenses = calculateExpensesInRange(gastos, today, tomorrow) +
      calculateProductPurchaseExpensesInRange(productPurchases, today, tomorrow);
    // Gastos del día anterior
    const yesterdayExpenses = calculateExpensesInRange(gastos, yesterday, today) +
      calculateProductPurchaseExpensesInRange(productPurchases, yesterday, today);

    // Ingresos del mes actual
    const monthlyIncome = calculateIncomeInRange(payments, startOfCurrentMonth, startOfNextMonth);
    // Ingresos del mes anterior
    const lastMonthIncome = calculateIncomeInRange(payments, startOfLastMonth, startOfCurrentMonthLastMonthCalc);
    // Gastos del mes actual (gastos + compras de productos)
    const monthlyExpenses = calculateExpensesInRange(gastos, startOfCurrentMonth, startOfNextMonth) +
      calculateProductPurchaseExpensesInRange(productPurchases, startOfCurrentMonth, startOfNextMonth);
    // Gastos del mes anterior
    const lastMonthExpenses = calculateExpensesInRange(gastos, startOfLastMonth, startOfCurrentMonthLastMonthCalc) +
      calculateProductPurchaseExpensesInRange(productPurchases, startOfLastMonth, startOfCurrentMonthLastMonthCalc);

    // Ingresos del año actual
    const annualIncome = calculateIncomeInRange(payments, startOfCurrentYear, startOfNextYear);
    // Ingresos del año anterior
    const lastYearIncome = calculateIncomeInRange(payments, startOfLastYear, startOfCurrentYearLastYearCalc);
    // Gastos del año actual (gastos + compras de productos)
    const annualExpenses = calculateExpensesInRange(gastos, startOfCurrentYear, startOfNextYear) +
      calculateProductPurchaseExpensesInRange(productPurchases, startOfCurrentYear, startOfNextYear);
    // Gastos del año anterior
    const lastYearExpenses = calculateExpensesInRange(gastos, startOfLastYear, startOfCurrentYearLastYearCalc) +
      calculateProductPurchaseExpensesInRange(productPurchases, startOfLastYear, startOfCurrentYearLastYearCalc);

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

      if (typeof gasto.expense_date === 'string') {
        // Si es string, extraer la parte de fecha
        gastoDateStr = gasto.expense_date.split('T')[0];
      } else {
        // Si ya es Date, convertirlo a string YYYY-MM-DD
        gastoDateStr = getLocalDateString(gasto.expense_date);
      }

      // Para rangos de fechas: incluye start, excluye end
      const isInRange = gastoDateStr >= startDateStr && gastoDateStr < endDateStr;

      return isInRange;
    });

    const result = filteredGastos.reduce((sum, gasto) => {
      // Asegurar que gasto.amount sea tratado como número
      const montoNumerico = typeof gasto.amount === 'string' ? parseFloat(gasto.amount) : Number(gasto.amount);
      return sum + montoNumerico;
    }, 0);
    return result;
  };

  // Función para calcular gastos de compras de productos en un rango de fechas
  const calculateProductPurchaseExpensesInRange = (productPurchases: any[], start: Date, end: Date): number => {
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);

    const filteredPurchases = productPurchases.filter(purchase => {
      if (!purchase.purchase_history || !purchase.purchase_history.purchase_date) return false;

      let purchaseDateStr: string;

      if (typeof purchase.purchase_history.purchase_date === 'string') {
        purchaseDateStr = purchase.purchase_history.purchase_date.split('T')[0];
      } else {
        purchaseDateStr = getLocalDateString(purchase.purchase_history.purchase_date);
      }

      // Solo incluir compras procesadas (que efectivamente gastaron dinero)
      const isProcessed = purchase.purchase_status === "processed";
      const isInRange = purchaseDateStr >= startDateStr && purchaseDateStr < endDateStr;

      return isProcessed && isInRange;
    });

    const result = filteredPurchases.reduce((sum, purchase) => {
      const totalPrice = typeof purchase.total_price === 'string' ? parseFloat(purchase.total_price) : Number(purchase.total_price);
      return sum + totalPrice;
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

  // Función para abrir el diálogo de detalles
  const openDetailsDialog = (type: "daily" | "monthly" | "annual") => {
    const now = new Date();
    let periodName = "";
    let incomeAmount = 0;
    let expensesAmount = 0;
    let filteredIncome: WorkPayment[] = [];
    let filteredExpenses: Gasto[] = [];
    let filteredProductPurchases: any[] = [];

    // Configurar fechas según el tipo de período
    if (type === "daily") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      periodName = `Día ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      filteredIncome = filterPaymentsByDateRange(payments, today, tomorrow);
      filteredExpenses = filterGastosByDateRange(gastos, today, tomorrow);
      filteredProductPurchases = filterProductPurchasesByDateRange(productPurchases, today, tomorrow);
      incomeAmount = calculateIncomeInRange(payments, today, tomorrow);
      expensesAmount = calculateExpensesInRange(gastos, today, tomorrow) +
        calculateProductPurchaseExpensesInRange(productPurchases, today, tomorrow);
    }
    else if (type === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      periodName = `Mes de ${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(now)} ${now.getFullYear()}`;
      filteredIncome = filterPaymentsByDateRange(payments, startOfMonth, startOfNextMonth);
      filteredExpenses = filterGastosByDateRange(gastos, startOfMonth, startOfNextMonth);
      filteredProductPurchases = filterProductPurchasesByDateRange(productPurchases, startOfMonth, startOfNextMonth);
      incomeAmount = calculateIncomeInRange(payments, startOfMonth, startOfNextMonth);
      expensesAmount = calculateExpensesInRange(gastos, startOfMonth, startOfNextMonth) +
        calculateProductPurchaseExpensesInRange(productPurchases, startOfMonth, startOfNextMonth);
    }
    else if (type === "annual") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

      periodName = `Año ${now.getFullYear()}`;
      filteredIncome = filterPaymentsByDateRange(payments, startOfYear, startOfNextYear);
      filteredExpenses = filterGastosByDateRange(gastos, startOfYear, startOfNextYear);
      filteredProductPurchases = filterProductPurchasesByDateRange(productPurchases, startOfYear, startOfNextYear);
      incomeAmount = calculateIncomeInRange(payments, startOfYear, startOfNextYear);
      expensesAmount = calculateExpensesInRange(gastos, startOfYear, startOfNextYear) +
        calculateProductPurchaseExpensesInRange(productPurchases, startOfYear, startOfNextYear);
    }

    setDetailsType(type);
    setDetailsData({
      period: periodName,
      income: incomeAmount,
      expenses: expensesAmount,
      balance: incomeAmount - expensesAmount,
      incomeTransactions: filteredIncome,
      expenseTransactions: filteredExpenses,
      productPurchaseTransactions: filteredProductPurchases
    });
    setShowDetailsDialog(true);
  };

  // Funciones auxiliares para filtrar transacciones por rango de fechas
  const filterPaymentsByDateRange = (payments: WorkPayment[], start: Date, end: Date): WorkPayment[] => {
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);

    return payments.filter(payment => {
      if (!payment.payment_date) return false;

      let paymentDateStr = typeof payment.payment_date === 'string'
        ? payment.payment_date.split('T')[0]
        : getLocalDateString(new Date(payment.payment_date));

      // Solo incluir pagos válidos
      const isValidPaymentStatus =
        payment.payment_status === "pagado" || payment.payment_status === "parcial";

      return isValidPaymentStatus && paymentDateStr >= startDateStr && paymentDateStr < endDateStr;
    });
  };

  const filterGastosByDateRange = (gastos: Gasto[], start: Date, end: Date): Gasto[] => {
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);

    return gastos.filter(gasto => {
      if (!gasto.expense_date) return false;

      let gastoDateStr = typeof gasto.expense_date === 'string'
        ? gasto.expense_date.split('T')[0]
        : getLocalDateString(new Date(gasto.expense_date));

      return gastoDateStr >= startDateStr && gastoDateStr < endDateStr;
    });
  };

  // Función para filtrar compras de productos por rango de fechas
  const filterProductPurchasesByDateRange = (productPurchases: any[], start: Date, end: Date): any[] => {
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);

    return productPurchases.filter(purchase => {
      if (!purchase.purchase_history?.purchase_date) return false;

      let purchaseDateStr = typeof purchase.purchase_history.purchase_date === 'string'
        ? purchase.purchase_history.purchase_date.split('T')[0]
        : getLocalDateString(new Date(purchase.purchase_history.purchase_date));

      // Solo incluir compras procesadas
      const isProcessed = purchase.purchase_status === "processed";
      const isInRange = purchaseDateStr >= startDateStr && purchaseDateStr < endDateStr;

      return isProcessed && isInRange;
    });
  };

  // Función para cargar y mostrar detalles de una orden de trabajo
  const handleViewWorkOrderDetails = async (workOrderId: number) => {
    try {
      // Obtenemos los detalles de la orden de trabajo completa
      const workOrderData = await getCompleteWorkOrderById(workOrderId);
      setSelectedWorkOrder(workOrderData);
    } catch (error) {
      console.error("Error al cargar detalles de la orden:", error);
      toast.error("No se pudieron cargar los detalles de la orden");
    }
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
                  onViewDetails={() => openDetailsDialog("daily")}
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
                  onViewDetails={() => openDetailsDialog("monthly")}
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
                  onViewDetails={() => openDetailsDialog("annual")}
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
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--stat-blue-bg)' }}>
                    <div className="text-2xl font-bold" style={{ color: 'var(--stat-blue-text)' }}>{todayStats.workOrdersToday}</div>
                    <div className="text-sm" style={{ color: 'var(--stat-blue-text-secondary)' }}>Órdenes Hoy</div>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--stat-green-bg)' }}>
                    <div className="text-2xl font-bold" style={{ color: 'var(--stat-green-text)' }}>{todayStats.quotationsToday}</div>
                    <div className="text-sm" style={{ color: 'var(--stat-green-text-secondary)' }}>Cotizaciones Hoy</div>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--stat-purple-bg)' }}>
                    <div className="text-2xl font-bold" style={{ color: 'var(--stat-purple-text)' }}>{todayStats.totalWorkOrders}</div>
                    <div className="text-sm" style={{ color: 'var(--stat-purple-text-secondary)' }}>Total Órdenes</div>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--stat-orange-bg)' }}>
                    <div className="text-2xl font-bold" style={{ color: 'var(--stat-orange-text)' }}>{todayStats.totalQuotations}</div>
                    <div className="text-sm" style={{ color: 'var(--stat-orange-text-secondary)' }}>Total Cotizaciones</div>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--stat-red-bg)' }}>
                    <div className="text-2xl font-bold" style={{ color: 'var(--stat-red-text)' }}>{lowStockProducts.length}</div>
                    <div className="text-sm" style={{ color: 'var(--stat-red-text-secondary)' }}>Productos Críticos</div>
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
                    <div key={product.stock_product_id} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'var(--stat-red-bg)', borderColor: 'var(--balance-expense-border)' }}>
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4" style={{ color: 'var(--stat-red-text)' }} />
                        <div>
                          <p className="font-medium text-sm">{product.product?.product_name}</p>
                          <p className="text-xs" style={{ color: 'var(--stat-red-text)' }}>Stock: {product.quantity} unidades</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">Bajo Stock</Badge>
                    </div>
                  ))}

                  {/* Notificaciones */}
                  {recentNotifications.slice(0, 2).map((notification, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'var(--stat-blue-bg)', borderColor: 'var(--balance-net-border)' }}>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4" style={{ color: 'var(--stat-blue-text)' }} />
                        <div>
                          <p className="font-medium text-sm">{notification.message}</p>
                          <p className="text-xs" style={{ color: 'var(--stat-blue-text)' }}>{formatDate(notification.created_at)}</p>
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

      {/* Diálogo de detalles del balance */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl">
              Detalles de Balance: {detailsData.period}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto pr-6 pl-2 py-4 flex-1">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card style={{ backgroundColor: 'var(--balance-income-bg)', borderColor: 'var(--balance-income-border)' }}>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--balance-income-text)' }}>
                    <ArrowUpIcon className="w-4 h-4" /> Ingresos
                  </h3>
                  <p className="text-xl font-bold" style={{ color: 'var(--balance-income-value)' }}>{formatPriceCLP(detailsData.income)}</p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: 'var(--balance-expense-bg)', borderColor: 'var(--balance-expense-border)' }}>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--balance-expense-text)' }}>
                    <ArrowDownIcon className="w-4 h-4" /> Gastos
                  </h3>
                  <p className="text-xl font-bold" style={{ color: 'var(--balance-expense-value)' }}>{formatPriceCLP(detailsData.expenses)}</p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: 'var(--balance-net-bg)', borderColor: 'var(--balance-net-border)' }}>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--balance-net-text)' }}>
                    Balance Neto
                  </h3>
                  <p className="text-xl font-bold" style={{ color: detailsData.balance >= 0 ? 'var(--balance-net-value)' : 'var(--balance-expense-value)' }}>
                    {formatPriceCLP(detailsData.balance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Listado de ingresos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Ingresos del período</h3>
              {detailsData.incomeTransactions.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Fecha</th>
                        <th className="px-4 py-2 text-left text-sm">Orden de Trabajo</th>
                        <th className="px-4 py-2 text-left text-sm">Descripción</th>
                        <th className="px-4 py-2 text-left text-sm">Estado</th>
                        <th className="px-4 py-2 text-right text-sm">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsData.incomeTransactions.map((payment, index) => (
                        <tr key={payment.work_payment_id || index} className="border-t">
                          <td className="px-4 py-3 text-sm">
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {payment.work_order ? (
                              <Button
                                variant="link"
                                className="p-0 h-auto font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                                onClick={() => payment.work_order && handleViewWorkOrderDetails(payment.work_order.work_order_id)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                #{payment.work_order.work_order_id}
                                {payment.work_order.vehicle?.license_plate ?
                                  ` - ${payment.work_order.vehicle.license_plate}` :
                                  ""}
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">Sin orden</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {payment.work_order?.description || `Pago #${payment.work_payment_id}`}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={payment.payment_status === "pagado" ? "default" : "secondary"}>
                              {payment.payment_status === "pagado" ? "Pagado" : "Parcial"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {formatPriceCLP(Number(payment.amount_paid))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
                  No hay ingresos registrados en este período
                </p>
              )}
            </div>

            {/* Listado de gastos */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Gastos del período</h3>
              {detailsData.expenseTransactions.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Fecha</th>
                        <th className="px-4 py-2 text-left text-sm">Descripción</th>
                        <th className="px-4 py-2 text-left text-sm">Tipo</th>
                        <th className="px-4 py-2 text-right text-sm">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsData.expenseTransactions.map((gasto, index) => (
                        <tr key={gasto.company_expense_id || index} className="border-t">
                          <td className="px-4 py-3 text-sm">
                            {formatDate(gasto.expense_date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {gasto.description || "Sin descripción"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {gasto.expense_type?.expense_type_name || "Otro"}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                            {formatPriceCLP(Number(gasto.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
                  No hay gastos registrados en este período
                </p>
              )}
            </div>

            {/* Listado de compras de productos */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Compras de productos del período</h3>
              {detailsData.productPurchaseTransactions.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Fecha</th>
                        <th className="px-4 py-2 text-left text-sm">Producto</th>
                        <th className="px-4 py-2 text-left text-sm">Cantidad</th>
                        <th className="px-4 py-2 text-left text-sm">Precio Unit.</th>
                        <th className="px-4 py-2 text-right text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsData.productPurchaseTransactions.map((purchase, index) => (
                        <tr key={purchase.product_purchase_id || index} className="border-t">
                          <td className="px-4 py-3 text-sm">
                            {formatDate(purchase.purchase_history?.purchase_date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <div className="font-medium">{purchase.product?.product_name || "Producto desconocido"}</div>
                              {purchase.product?.type?.type_name && (
                                <div className="text-xs text-muted-foreground">
                                  {purchase.product.type.type_name}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {purchase.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatPriceCLP(Number(purchase.purchase_price))}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                            {formatPriceCLP(Number(purchase.total_price))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
                  No hay compras de productos registradas en este período
                </p>
              )}
            </div>
          </div>

          {/* Botón para cerrar el diálogo */}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowDetailsDialog(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nuevo diálogo para mostrar detalles de la orden de trabajo */}
      {selectedWorkOrder && (
        <Dialog open={!!selectedWorkOrder} onOpenChange={(open) => !open && setSelectedWorkOrder(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <span className="text-primary">Orden de Trabajo</span>
                  <span className="text-muted-foreground ml-2">#{selectedWorkOrder.work_order_id}</span>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[75vh] pr-2">
              <div className="space-y-6 py-4">
                {/* Header con información principal */}
                <div className="bg-gradient-to-r from-primary/5 to-blue-50 rounded-xl p-6 border border-primary/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Fecha de creación
                      </div>
                      <p className="text-lg font-semibold">{formatDate(selectedWorkOrder.order_date)}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        Estado actual
                      </div>
                      <Badge
                        variant={
                          selectedWorkOrder.order_status === "finished" ? "default" :
                            selectedWorkOrder.order_status === "in_progress" ? "secondary" : "outline"
                        }
                        className="text-sm px-3 py-1"
                      >
                        {selectedWorkOrder.order_status === "finished" ? "✅ Finalizado" :
                          selectedWorkOrder.order_status === "in_progress" ? "🔄 En Progreso" : "⏳ No Iniciado"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        Valor total
                      </div>
                      <p className="text-2xl font-bold text-primary">{formatPriceCLP(Number(selectedWorkOrder.total_amount))}</p>
                    </div>
                  </div>
                </div>

                {/* Información del vehículo y cliente */}
                {selectedWorkOrder.vehicle && (
                  <Card className="border-0 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Car className="h-5 w-5 text-blue-600" />
                        Información del Vehículo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-700 font-bold text-sm">🚗</span>
                            </div>
                            <div>
                              <p className="text-sm text-blue-700">Matrícula</p>
                              <p className="font-semibold text-blue-900">{selectedWorkOrder.vehicle.license_plate}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-700 font-bold text-sm">🏭</span>
                            </div>
                            <div>
                              <p className="text-sm text-purple-700">Marca / Modelo</p>
                              <p className="font-semibold text-purple-900">
                                {selectedWorkOrder.vehicle.model?.brand?.brand_name} {selectedWorkOrder.vehicle.model?.model_name}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-700 font-bold text-sm">👤</span>
                            </div>
                            <div>
                              <p className="text-sm text-green-700">Propietario</p>
                              <p className="font-semibold text-green-900">
                                {selectedWorkOrder.vehicle.owner?.name || selectedWorkOrder.vehicle.company?.name || "No especificado"}
                              </p>
                            </div>
                          </div>

                          {selectedWorkOrder.vehicle.year && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-700 font-bold text-sm">📅</span>
                              </div>
                              <div>
                                <p className="text-sm text-orange-700">Año</p>
                                <p className="font-semibold text-orange-900">{selectedWorkOrder.vehicle.year}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Descripción del trabajo */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      Descripción del Trabajo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="bg-gray-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedWorkOrder.description || "Sin descripción proporcionada"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Productos y servicios */}
                {selectedWorkOrder.productDetails && selectedWorkOrder.productDetails.length > 0 ? (
                  <Card className="border-0 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-emerald-600" />
                        Productos y Servicios ({selectedWorkOrder.productDetails.length} items)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-emerald-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Producto</th>
                              <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-800">Cantidad</th>
                              <th className="px-6 py-4 text-right text-sm font-semibold text-emerald-800">Precio Unit.</th>
                              <th className="px-6 py-4 text-right text-sm font-semibold text-emerald-800">Mano de Obra</th>
                              <th className="px-6 py-4 text-right text-sm font-semibold text-emerald-800">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedWorkOrder.productDetails.map((detail, index) => {
                              const productName = detail.product?.product_name || `Producto #${detail.product_id}`;
                              const productPrice = Number(detail.sale_price);
                              const laborPrice = Number(detail.labor_price || 0);
                              const quantity = Number(detail.quantity || 1);
                              const subtotal = (productPrice * quantity) + laborPrice;

                              return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Package className="h-4 w-4 text-emerald-600" />
                                      </div>
                                      <span className="font-medium text-gray-900">{productName}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {quantity}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    {formatPriceCLP(productPrice)}
                                  </td>
                                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    {formatPriceCLP(laborPrice)}
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                    {formatPriceCLP(subtotal)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-gradient-to-r from-emerald-100 to-teal-100">
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-right font-bold text-emerald-800 text-lg">
                                TOTAL GENERAL:
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-2xl font-bold text-emerald-800">
                                  {formatPriceCLP(Number(selectedWorkOrder.total_amount))}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-md border-l-4 border-l-yellow-400">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Info className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-yellow-800">Sin productos registrados</h3>
                          <p className="text-sm text-yellow-700">
                            Esta orden de trabajo no tiene productos o servicios asociados.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Técnicos asignados */}
                {selectedWorkOrder.technicians && selectedWorkOrder.technicians.length > 0 && (
                  <Card className="border-0 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Wrench className="h-5 w-5 text-cyan-600" />
                        Técnicos Asignados ({selectedWorkOrder.technicians.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedWorkOrder.technicians.map((tech, index) => {
                          let techName = `Técnico #${index + 1}`;

                          if (tech && typeof tech === 'object') {
                            if ('employee' in tech && tech.employee) {
                              techName = typeof tech.employee === 'string' ? tech.employee : `Técnico #${index + 1}`;
                            } else if ('name' in tech && tech.name) {
                              techName = tech.name;
                            } else if ('employee_id' in tech && tech.employee_id) {
                              techName = `Técnico #${tech.employee_id}`;
                            }
                          }

                          return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
                              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                                <span className="text-cyan-700 font-bold text-sm">👨‍🔧</span>
                              </div>
                              <div>
                                <p className="font-semibold text-cyan-900">{techName}</p>
                                <p className="text-sm text-cyan-700">Técnico especializado</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Footer con botones de acción */}
            <div className="border-t pt-4 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Última actualización: {formatDate(selectedWorkOrder.order_date)}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/orden-trabajo/editar/${selectedWorkOrder.work_order_id}`)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Editar Orden
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedWorkOrder(null)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

interface DashboardCardProps {
  title: string
  amount: string
  percentage: number
  trend: "up" | "down"
  onViewDetails?: () => void
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, amount, percentage, trend, onViewDetails }) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary">{amount}</p>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center">
            {trend === "up" ? (
              <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
            )}
            <p className={`text-sm ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
              {percentage}% {trend === "up" ? "Crecimiento" : "Disminución"}
            </p>
          </div>

          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
              className="flex items-center text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Ver detalles
            </Button>
          )}
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

