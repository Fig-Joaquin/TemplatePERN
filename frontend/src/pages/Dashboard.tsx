import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid"
import { motion, AnimatePresence } from "framer-motion"

export const Dashboard = () => {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <DashboardCard title="Ventas Diarias" amount="$249.95" percentage={67} trend="up" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <DashboardCard title="Ventas Mensuales" amount="$2,942.32" percentage={36} trend="down" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <DashboardCard title="Ventas Anuales" amount="$8,638.32" percentage={80} trend="up" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
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

export default Dashboard

