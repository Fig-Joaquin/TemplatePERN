"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpIcon,
  ArrowDownIcon,
  Minus,
  Filter
} from "lucide-react";
import { fetchWorkPayments } from "@/services/work/workPayment";
import { fetchGastos } from "@/services/gastoService";
import { getAllProductPurchases, type ProductPurchase } from "@/services/productPurchaseService";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { motion } from "framer-motion";
import { WorkPayment, Gasto } from "@/types/interfaces";

interface BalanceDetails {
  incomeTransactions: WorkPayment[];
  expenseTransactions: Gasto[];
  productPurchaseTransactions: ProductPurchase[];
}

interface BalanceData {
  period: string;
  periodType: "daily" | "weekly" | "monthly" | "annual";
  income: number;
  expenses: number;
  productPurchases: number;
  balance: number;
  trend: "up" | "down" | "neutral";
  percentage: number;
  details: BalanceDetails;
}

const BalancesPage = () => {
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<BalanceData[]>([]);
  const [totalBalance, setTotalBalance] = useState<BalanceData | null>(null);

  // Filtros
  const [periodType, setPeriodType] = useState<"daily" | "weekly" | "monthly" | "annual">("monthly");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // Datos originales
  const [payments, setPayments] = useState<WorkPayment[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [productPurchases, setProductPurchases] = useState<ProductPurchase[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (payments.length > 0 || gastos.length > 0 || productPurchases.length > 0) {
      calculateBalances();
    }
  }, [periodType, selectedYear, selectedMonth, payments, gastos, productPurchases]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, gastosData, purchasesData] = await Promise.all([
        fetchWorkPayments(),
        fetchGastos(),
        getAllProductPurchases()
      ]);

      setPayments(paymentsData);
      setGastos(gastosData);
      setProductPurchases(purchasesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toNumber = (value: number | string | undefined | null): number => {
    const numericValue = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const filterPaymentsByDateRange = (payments: WorkPayment[], start: Date, end: Date): WorkPayment[] => {
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);

    return payments.filter(payment => {
      if (!payment.payment_date) return false;

      let paymentDateStr = typeof payment.payment_date === 'string'
        ? payment.payment_date.split('T')[0]
        : getLocalDateString(new Date(payment.payment_date));

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

  const filterProductPurchasesByDateRange = (purchases: ProductPurchase[], start: Date, end: Date): ProductPurchase[] => {
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);

    return purchases.filter(purchase => {
      if (!purchase.purchase_history?.purchase_date) return false;

      let purchaseDateStr = typeof purchase.purchase_history.purchase_date === 'string'
        ? purchase.purchase_history.purchase_date.split('T')[0]
        : getLocalDateString(new Date(purchase.purchase_history.purchase_date));

      const isProcessed = purchase.purchase_status === "processed";
      const isInRange = purchaseDateStr >= startDateStr && purchaseDateStr < endDateStr;

      return isProcessed && isInRange;
    });
  };

  const sumPayments = (paymentList: WorkPayment[]): number => {
    return paymentList.reduce((sum, payment) => sum + toNumber(payment.amount_paid), 0);
  };

  const sumGastos = (gastoList: Gasto[]): number => {
    return gastoList.reduce((sum, gasto) => sum + toNumber(gasto.amount), 0);
  };

  const sumProductPurchases = (purchaseList: ProductPurchase[]): number => {
    return purchaseList.reduce((sum, purchase) => sum + toNumber(purchase.total_price), 0);
  };

  const calculateTrendMetrics = (
    current: number,
    previous: number,
    hasActivity: boolean
  ): { trend: BalanceData["trend"]; percentage: number } => {
    // If a period has no transactions at all, show a neutral state instead of synthetic +/-100% jumps.
    if (!hasActivity) {
      return { trend: "neutral", percentage: 0 };
    }

    if (previous === 0) {
      if (current === 0) {
        return { trend: "neutral", percentage: 0 };
      }
      return {
        trend: current > 0 ? "up" : "down",
        percentage: current > 0 ? 100 : -100,
      };
    }

    const percentageChange = ((current - previous) / Math.abs(previous)) * 100;
    const clampedPercentage = Math.max(-999, Math.min(999, percentageChange));

    if (current === previous) {
      return { trend: "neutral", percentage: 0 };
    }

    return {
      trend: current > previous ? "up" : "down",
      percentage: clampedPercentage,
    };
  };

  const calculateBalances = () => {
    const balanceData: BalanceData[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalProductPurchases = 0;

    if (periodType === "daily") {
      // Calcular balances diarios
      const year = selectedYear;
      const month = selectedMonth;
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day + 1);

        const incomeTransactions = filterPaymentsByDateRange(payments, startDate, endDate);
        const expenseTransactions = filterGastosByDateRange(gastos, startDate, endDate);
        const productPurchaseTransactions = filterProductPurchasesByDateRange(productPurchases, startDate, endDate);

        const income = sumPayments(incomeTransactions);
        const expenses = sumGastos(expenseTransactions);
        const productPurchaseExpenses = sumProductPurchases(productPurchaseTransactions);
        const balance = income - (expenses + productPurchaseExpenses);
        const hasActivity = income > 0 || expenses > 0 || productPurchaseExpenses > 0;

        // Calcular tendencia comparando con el día anterior
        const previousDay = day > 1 ? balanceData[day - 2]?.balance || 0 : 0;
        const { trend, percentage } = calculateTrendMetrics(balance, previousDay, hasActivity);

        totalIncome += income;
        totalExpenses += expenses;
        totalProductPurchases += productPurchaseExpenses;

        balanceData.push({
          period: `${day}/${month}/${year}`,
          periodType: "daily",
          income,
          expenses,
          productPurchases: productPurchaseExpenses,
          balance,
          trend,
          percentage,
          details: {
            incomeTransactions,
            expenseTransactions,
            productPurchaseTransactions,
          }
        });
      }
    } else if (periodType === "weekly") {
      // Calcular balances semanales del año
      const year = selectedYear;
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);

      // Encontrar el primer lunes del año
      let current = new Date(startOfYear);
      while (current.getDay() !== 1) {
        current.setDate(current.getDate() + 1);
      }

      let weekNumber = 1;
      while (current < endOfYear) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const incomeTransactions = filterPaymentsByDateRange(payments, weekStart, weekEnd);
        const expenseTransactions = filterGastosByDateRange(gastos, weekStart, weekEnd);
        const productPurchaseTransactions = filterProductPurchasesByDateRange(productPurchases, weekStart, weekEnd);

        const income = sumPayments(incomeTransactions);
        const expenses = sumGastos(expenseTransactions);
        const productPurchaseExpenses = sumProductPurchases(productPurchaseTransactions);
        const balance = income - (expenses + productPurchaseExpenses);
        const hasActivity = income > 0 || expenses > 0 || productPurchaseExpenses > 0;

        const previousBalance = weekNumber > 1 ? balanceData[weekNumber - 2]?.balance || 0 : 0;
        const { trend, percentage } = calculateTrendMetrics(balance, previousBalance, hasActivity);

        totalIncome += income;
        totalExpenses += expenses;
        totalProductPurchases += productPurchaseExpenses;

        balanceData.push({
          period: `Semana ${weekNumber} - ${year}`,
          periodType: "weekly",
          income,
          expenses,
          productPurchases: productPurchaseExpenses,
          balance,
          trend,
          percentage,
          details: {
            incomeTransactions,
            expenseTransactions,
            productPurchaseTransactions,
          }
        });

        current.setDate(current.getDate() + 7);
        weekNumber++;
      }
    } else if (periodType === "monthly") {
      // Calcular balances mensuales del año
      const year = selectedYear;

      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        const incomeTransactions = filterPaymentsByDateRange(payments, startDate, endDate);
        const expenseTransactions = filterGastosByDateRange(gastos, startDate, endDate);
        const productPurchaseTransactions = filterProductPurchasesByDateRange(productPurchases, startDate, endDate);

        const income = sumPayments(incomeTransactions);
        const expenses = sumGastos(expenseTransactions);
        const productPurchaseExpenses = sumProductPurchases(productPurchaseTransactions);
        const balance = income - (expenses + productPurchaseExpenses);
        const hasActivity = income > 0 || expenses > 0 || productPurchaseExpenses > 0;

        const previousBalance = month > 1 ? balanceData[month - 2]?.balance || 0 : 0;
        const { trend, percentage } = calculateTrendMetrics(balance, previousBalance, hasActivity);

        totalIncome += income;
        totalExpenses += expenses;
        totalProductPurchases += productPurchaseExpenses;

        balanceData.push({
          period: `${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(year, month - 1))} ${year}`,
          periodType: "monthly",
          income,
          expenses,
          productPurchases: productPurchaseExpenses,
          balance,
          trend,
          percentage,
          details: {
            incomeTransactions,
            expenseTransactions,
            productPurchaseTransactions,
          }
        });
      }
    } else if (periodType === "annual") {
      // Calcular balances anuales (últimos 10 años)
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 9;

      for (let year = startYear; year <= currentYear; year++) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const incomeTransactions = filterPaymentsByDateRange(payments, startDate, endDate);
        const expenseTransactions = filterGastosByDateRange(gastos, startDate, endDate);
        const productPurchaseTransactions = filterProductPurchasesByDateRange(productPurchases, startDate, endDate);

        const income = sumPayments(incomeTransactions);
        const expenses = sumGastos(expenseTransactions);
        const productPurchaseExpenses = sumProductPurchases(productPurchaseTransactions);
        const balance = income - (expenses + productPurchaseExpenses);
        const hasActivity = income > 0 || expenses > 0 || productPurchaseExpenses > 0;

        const previousBalance = balanceData.length > 0 ? balanceData[balanceData.length - 1]?.balance || 0 : 0;
        const { trend, percentage } = calculateTrendMetrics(balance, previousBalance, hasActivity);

        totalIncome += income;
        totalExpenses += expenses;
        totalProductPurchases += productPurchaseExpenses;

        balanceData.push({
          period: `Año ${year}`,
          periodType: "annual",
          income,
          expenses,
          productPurchases: productPurchaseExpenses,
          balance,
          trend,
          percentage,
          details: {
            incomeTransactions,
            expenseTransactions,
            productPurchaseTransactions,
          }
        });
      }
    }

    setBalances(balanceData);

    // Calcular balance total histórico
    const historicalStartDate = new Date(2000, 0, 1);
    const historicalEndDate = new Date(2099, 11, 31);
    const allTimeIncome = sumPayments(filterPaymentsByDateRange(payments, historicalStartDate, historicalEndDate));
    const allTimeExpenses = sumGastos(filterGastosByDateRange(gastos, historicalStartDate, historicalEndDate));
    const allTimeProductPurchases = sumProductPurchases(filterProductPurchasesByDateRange(productPurchases, historicalStartDate, historicalEndDate));
    const allTimeBalance = allTimeIncome - (allTimeExpenses + allTimeProductPurchases);

    setTotalBalance({
      period: "Histórico Total",
      periodType: "annual",
      income: allTimeIncome,
      expenses: allTimeExpenses,
      productPurchases: allTimeProductPurchases,
      balance: allTimeBalance,
      trend: allTimeBalance === 0 ? "neutral" : (allTimeBalance > 0 ? "up" : "down"),
      percentage: 0,
      details: {
        incomeTransactions: [],
        expenseTransactions: [],
        productPurchaseTransactions: [],
      }
    });
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  };

  const generateMonthOptions = () => {
    return [
      { value: 1, label: "Enero" },
      { value: 2, label: "Febrero" },
      { value: 3, label: "Marzo" },
      { value: 4, label: "Abril" },
      { value: 5, label: "Mayo" },
      { value: 6, label: "Junio" },
      { value: 7, label: "Julio" },
      { value: 8, label: "Agosto" },
      { value: 9, label: "Septiembre" },
      { value: 10, label: "Octubre" },
      { value: 11, label: "Noviembre" },
      { value: 12, label: "Diciembre" }
    ];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Balances Financieros</h1>
          <p className="text-muted-foreground mt-1">
            Análisis detallado de ingresos y gastos por períodos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tipo de Período</Label>
              <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodType !== "annual" && (
              <div>
                <Label>Año</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYearOptions().map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {periodType === "daily" && (
              <div>
                <Label>Mes</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonthOptions().map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button onClick={calculateBalances} disabled={loading} className="w-full">
                {loading ? "Calculando..." : "Actualizar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Total Histórico */}
      {totalBalance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <PieChart className="h-6 w-6 text-primary" />
                Balance Histórico Total
                <Badge variant="outline" className="ml-auto">
                  {totalBalance.trend === "up"
                    ? "Positivo"
                    : totalBalance.trend === "down"
                      ? "Negativo"
                      : "Neutral"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Ingresos Totales</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPriceCLP(totalBalance.income)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Gastos Totales</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatPriceCLP(totalBalance.expenses)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Compras Productos</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatPriceCLP(totalBalance.productPurchases)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Balance Final</div>
                  <div className={`text-3xl font-bold flex items-center justify-center gap-2 ${totalBalance.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {totalBalance.trend === "up" ? (
                      <TrendingUp className="h-6 w-6" />
                    ) : totalBalance.trend === "down" ? (
                      <TrendingDown className="h-6 w-6" />
                    ) : (
                      <Minus className="h-6 w-6" />
                    )}
                    {formatPriceCLP(Math.abs(totalBalance.balance))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Lista de Balances */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Balances {periodType === "daily" ? "Diarios" :
              periodType === "weekly" ? "Semanales" :
                periodType === "monthly" ? "Mensuales" : "Anuales"}
          </h2>
          <Badge variant="secondary">
            {balances.length} períodos
          </Badge>
        </div>

        <div className="space-y-3">
          {balances.map((balance, index) => (
            <motion.div
              key={balance.period}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{balance.period}</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Ingresos</div>
                      <div className="font-semibold text-green-600">
                        {formatPriceCLP(balance.income)}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Gastos</div>
                      <div className="font-semibold text-red-600">
                        {formatPriceCLP(balance.expenses)}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Compras</div>
                      <div className="font-semibold text-orange-600">
                        {formatPriceCLP(balance.productPurchases)}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Balance</div>
                      <div className={`font-bold flex items-center justify-center gap-1 ${balance.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {balance.trend === "up" ? (
                          <ArrowUpIcon className="h-4 w-4" />
                        ) : balance.trend === "down" ? (
                          <ArrowDownIcon className="h-4 w-4" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                        {formatPriceCLP(Math.abs(balance.balance))}
                      </div>
                    </div>

                    <div className="text-center">
                      <Badge
                        variant={
                          balance.trend === "up"
                            ? "default"
                            : balance.trend === "down"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {balance.percentage > 0 ? "+" : ""}{balance.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-3">
                    <Accordion type="single" collapsible>
                      <AccordionItem value={`details-${index}`} className="border-b-0">
                        <AccordionTrigger className="py-2 text-sm hover:no-underline">
                          <div className="flex w-full items-center justify-between gap-2 pr-2">
                            <span className="font-medium">Desglose de movimientos del periodo</span>
                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                              {balance.details.incomeTransactions.length + balance.details.expenseTransactions.length + balance.details.productPurchaseTransactions.length} movimientos
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
                            <div
                              className="rounded-lg border p-3"
                              style={{
                                backgroundColor: "var(--balance-income-bg)",
                                borderColor: "var(--balance-income-border)",
                              }}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-semibold" style={{ color: "var(--balance-income-text)" }}>Ingresos</p>
                                <Badge variant="outline">{balance.details.incomeTransactions.length}</Badge>
                              </div>
                              <div className="mb-2 text-sm font-medium" style={{ color: "var(--balance-income-value)" }}>
                                Total: {formatPriceCLP(balance.income)}
                              </div>
                              {balance.details.incomeTransactions.length > 0 ? (
                                <div className="max-h-56 space-y-2 overflow-auto pr-1">
                                  {balance.details.incomeTransactions.map((payment, txIndex) => (
                                    <div key={`${payment.work_payment_id ?? txIndex}-income`} className="rounded-md border bg-background p-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium">
                                            {payment.work_order
                                              ? `Orden #${payment.work_order.work_order_id}`
                                              : `Pago #${payment.work_payment_id ?? txIndex + 1}`}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {formatDate(payment.payment_date)}
                                          </p>
                                          <p className="line-clamp-2 text-xs text-muted-foreground">
                                            {payment.work_order?.description || payment.payment_type?.type_name || "Ingreso sin descripción"}
                                          </p>
                                        </div>
                                        <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--balance-income-value)" }}>
                                          {formatPriceCLP(toNumber(payment.amount_paid))}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="py-4 text-center text-xs text-muted-foreground">Sin ingresos en este período</p>
                              )}
                            </div>

                            <div
                              className="rounded-lg border p-3"
                              style={{
                                backgroundColor: "var(--balance-expense-bg)",
                                borderColor: "var(--balance-expense-border)",
                              }}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-semibold" style={{ color: "var(--balance-expense-text)" }}>Gastos</p>
                                <Badge variant="outline">{balance.details.expenseTransactions.length}</Badge>
                              </div>
                              <div className="mb-2 text-sm font-medium" style={{ color: "var(--balance-expense-value)" }}>
                                Total: {formatPriceCLP(balance.expenses)}
                              </div>
                              {balance.details.expenseTransactions.length > 0 ? (
                                <div className="max-h-56 space-y-2 overflow-auto pr-1">
                                  {balance.details.expenseTransactions.map((expense, txIndex) => (
                                    <div key={`${expense.company_expense_id ?? txIndex}-expense`} className="rounded-md border bg-background p-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="line-clamp-2 text-sm font-medium">
                                            {expense.description || "Gasto sin descripción"}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {formatDate(expense.expense_date)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Tipo: {expense.expense_type?.expense_type_name || "Otro"}
                                          </p>
                                        </div>
                                        <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--balance-expense-value)" }}>
                                          {formatPriceCLP(toNumber(expense.amount))}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="py-4 text-center text-xs text-muted-foreground">Sin gastos en este período</p>
                              )}
                            </div>

                            <div
                              className="rounded-lg border p-3"
                              style={{
                                backgroundColor: "var(--stat-orange-bg)",
                                borderColor: "var(--stat-orange-text)",
                              }}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-semibold" style={{ color: "var(--stat-orange-text-secondary)" }}>Compras</p>
                                <Badge variant="outline">{balance.details.productPurchaseTransactions.length}</Badge>
                              </div>
                              <div className="mb-2 text-sm font-medium" style={{ color: "var(--stat-orange-text-secondary)" }}>
                                Total: {formatPriceCLP(balance.productPurchases)}
                              </div>
                              {balance.details.productPurchaseTransactions.length > 0 ? (
                                <div className="max-h-56 space-y-2 overflow-auto pr-1">
                                  {balance.details.productPurchaseTransactions.map((purchase, txIndex) => (
                                    <div key={`${purchase.product_purchase_id ?? txIndex}-purchase`} className="rounded-md border bg-background p-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="line-clamp-2 text-sm font-medium">
                                            {purchase.product?.product_name || `Compra #${purchase.product_purchase_id ?? txIndex + 1}`}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {formatDate(purchase.purchase_history?.purchase_date)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Cantidad: {purchase.quantity}
                                          </p>
                                        </div>
                                        <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--stat-orange-text-secondary)" }}>
                                          {formatPriceCLP(toNumber(purchase.total_price))}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="py-4 text-center text-xs text-muted-foreground">Sin compras en este período</p>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {balances.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay datos disponibles para el período seleccionado
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BalancesPage;
