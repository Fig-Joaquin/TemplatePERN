"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Filter
} from "lucide-react";
import { fetchWorkPayments } from "@/services/work/workPayment";
import { fetchGastos } from "@/services/gastoService";
import { getAllProductPurchases } from "@/services/productPurchaseService";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { motion } from "framer-motion";
import { WorkPayment, Gasto } from "@/types/interfaces";

interface BalanceData {
  period: string;
  periodType: "daily" | "weekly" | "monthly" | "annual";
  income: number;
  expenses: number;
  productPurchases: number;
  balance: number;
  trend: "up" | "down";
  percentage: number;
}

interface ProductPurchase {
  product_purchase_id: number;
  purchase_status: string;
  total_price: number;
  purchase_history: {
    purchase_date: string;
  };
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

  const calculateIncomeInRange = (payments: WorkPayment[], start: Date, end: Date): number => {
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);

    const filteredPayments = payments.filter(payment => {
      if (!payment.payment_date) return false;

      let paymentDateStr = typeof payment.payment_date === 'string'
        ? payment.payment_date.split('T')[0]
        : getLocalDateString(new Date(payment.payment_date));

      const isValidPaymentStatus =
        payment.payment_status === "pagado" || payment.payment_status === "parcial";

      return isValidPaymentStatus && paymentDateStr >= startDateStr && paymentDateStr < endDateStr;
    });

    return filteredPayments.reduce((sum, payment) => {
      const montoNumerico = typeof payment.amount_paid === 'string' ? parseFloat(payment.amount_paid) : Number(payment.amount_paid);
      return sum + montoNumerico;
    }, 0);
  };

  const calculateExpensesInRange = (gastos: Gasto[], start: Date, end: Date): number => {
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);

    const filteredGastos = gastos.filter(gasto => {
      if (!gasto.expense_date) return false;

      let gastoDateStr = typeof gasto.expense_date === 'string'
        ? gasto.expense_date.split('T')[0]
        : getLocalDateString(new Date(gasto.expense_date));

      return gastoDateStr >= startDateStr && gastoDateStr < endDateStr;
    });

    return filteredGastos.reduce((sum, gasto) => {
      const montoNumerico = typeof gasto.amount === 'string' ? parseFloat(gasto.amount) : Number(gasto.amount);
      return sum + montoNumerico;
    }, 0);
  };

  const calculateProductPurchaseExpensesInRange = (productPurchases: ProductPurchase[], start: Date, end: Date): number => {
    const startDateStr = getLocalDateString(start);
    const endDateStr = getLocalDateString(end);

    const filteredPurchases = productPurchases.filter(purchase => {
      if (!purchase.purchase_history?.purchase_date) return false;

      let purchaseDateStr = typeof purchase.purchase_history.purchase_date === 'string'
        ? purchase.purchase_history.purchase_date.split('T')[0]
        : getLocalDateString(new Date(purchase.purchase_history.purchase_date));

      const isProcessed = purchase.purchase_status === "processed";
      const isInRange = purchaseDateStr >= startDateStr && purchaseDateStr < endDateStr;

      return isProcessed && isInRange;
    });

    return filteredPurchases.reduce((sum, purchase) => {
      const totalPrice = typeof purchase.total_price === 'string' ? parseFloat(purchase.total_price) : Number(purchase.total_price);
      return sum + totalPrice;
    }, 0);
  };

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (current === 0 && previous === 0) return 0;
    if (previous === 0) {
      return current > 0 ? 100 : (current < 0 ? -100 : 0);
    }
    const percentageChange = ((current - previous) / Math.abs(previous)) * 100;
    return Math.max(-999, Math.min(999, percentageChange));
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

        const income = calculateIncomeInRange(payments, startDate, endDate);
        const expenses = calculateExpensesInRange(gastos, startDate, endDate);
        const productPurchaseExpenses = calculateProductPurchaseExpensesInRange(productPurchases, startDate, endDate);
        const balance = income - (expenses + productPurchaseExpenses);

        // Calcular tendencia comparando con el día anterior
        const previousDay = day > 1 ? balanceData[day - 2]?.balance || 0 : 0;
        const percentage = calculatePercentageChange(balance, previousDay);

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
          trend: balance >= previousDay ? "up" : "down",
          percentage
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

        const income = calculateIncomeInRange(payments, weekStart, weekEnd);
        const expenses = calculateExpensesInRange(gastos, weekStart, weekEnd);
        const productPurchaseExpenses = calculateProductPurchaseExpensesInRange(productPurchases, weekStart, weekEnd);
        const balance = income - (expenses + productPurchaseExpenses);

        const previousBalance = weekNumber > 1 ? balanceData[weekNumber - 2]?.balance || 0 : 0;
        const percentage = calculatePercentageChange(balance, previousBalance);

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
          trend: balance >= previousBalance ? "up" : "down",
          percentage
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

        const income = calculateIncomeInRange(payments, startDate, endDate);
        const expenses = calculateExpensesInRange(gastos, startDate, endDate);
        const productPurchaseExpenses = calculateProductPurchaseExpensesInRange(productPurchases, startDate, endDate);
        const balance = income - (expenses + productPurchaseExpenses);

        const previousBalance = month > 1 ? balanceData[month - 2]?.balance || 0 : 0;
        const percentage = calculatePercentageChange(balance, previousBalance);

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
          trend: balance >= previousBalance ? "up" : "down",
          percentage
        });
      }
    } else if (periodType === "annual") {
      // Calcular balances anuales (últimos 10 años)
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 9;

      for (let year = startYear; year <= currentYear; year++) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const income = calculateIncomeInRange(payments, startDate, endDate);
        const expenses = calculateExpensesInRange(gastos, startDate, endDate);
        const productPurchaseExpenses = calculateProductPurchaseExpensesInRange(productPurchases, startDate, endDate);
        const balance = income - (expenses + productPurchaseExpenses);

        const previousBalance = balanceData.length > 0 ? balanceData[balanceData.length - 1]?.balance || 0 : 0;
        const percentage = calculatePercentageChange(balance, previousBalance);

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
          trend: balance >= previousBalance ? "up" : "down",
          percentage
        });
      }
    }

    setBalances(balanceData);

    // Calcular balance total histórico
    const allTimeIncome = calculateIncomeInRange(payments, new Date(2000, 0, 1), new Date(2099, 11, 31));
    const allTimeExpenses = calculateExpensesInRange(gastos, new Date(2000, 0, 1), new Date(2099, 11, 31));
    const allTimeProductPurchases = calculateProductPurchaseExpensesInRange(productPurchases, new Date(2000, 0, 1), new Date(2099, 11, 31));
    const allTimeBalance = allTimeIncome - (allTimeExpenses + allTimeProductPurchases);

    setTotalBalance({
      period: "Histórico Total",
      periodType: "annual",
      income: allTimeIncome,
      expenses: allTimeExpenses,
      productPurchases: allTimeProductPurchases,
      balance: allTimeBalance,
      trend: allTimeBalance >= 0 ? "up" : "down",
      percentage: 0
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
                  {totalBalance.trend === "up" ? "Positivo" : "Negativo"}
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
                    ) : (
                      <TrendingDown className="h-6 w-6" />
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
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" />
                        )}
                        {formatPriceCLP(Math.abs(balance.balance))}
                      </div>
                    </div>

                    <div className="text-center">
                      <Badge variant={balance.trend === "up" ? "default" : "destructive"}>
                        {balance.percentage > 0 ? "+" : ""}{balance.percentage.toFixed(1)}%
                      </Badge>
                    </div>
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
