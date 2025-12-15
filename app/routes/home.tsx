import type { Route } from "./+types/home";
import { DashboardLayout } from "~/components/templates";
import { AccountBanner, ExpensePieChart, IncomeExpenseBarChart, MonthlyExpenseChart } from "~/components/molecules";
import { motion } from "framer-motion";
import { CreditCard, TrendingUp, TrendingDown, PiggyBank, Target, Calendar, Zap, Award } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Personal Expense Dashboard" },
    { name: "description", content: "Manage your personal expenses" },
  ];
}

export default function Home() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-12 gap-4 h-full">
        
        {/* Main Content Area */}
        <div className="col-span-9 space-y-4">
          
          {/* Account Banner con tarjeta integrada */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AccountBanner />
          </motion.div>

          {/* Cards informativas con animación */}
          <motion.div 
            className="grid grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div 
              className="bg-secondary rounded-xl p-5 text-white"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Transacciones</div>
                  <div className="text-2xl font-bold">24</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-secondary rounded-xl p-5 text-white"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Ingresos</div>
                  <div className="text-2xl font-bold">$1.2M</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-secondary rounded-xl p-5 text-white"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Gastos</div>
                  <div className="text-2xl font-bold">$925K</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-secondary rounded-xl p-5 text-white"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Ahorro</div>
                  <div className="text-2xl font-bold">$275K</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Charts Grid - 2 gráficos centrales con animación */}
          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Gráfico Central - Ingresos vs Egresos */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <IncomeExpenseBarChart />
            </motion.div>
            
            {/* Segundo gráfico central */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <ExpensePieChart />
            </motion.div>
          </motion.div>
        </div>

        {/* Right Sidebar - Stats Panel */}
        <motion.div 
          className="col-span-3 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.div 
            className="bg-secondary rounded-2xl p-3 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="text-xs text-gray-400 mb-2">Total Ingresos</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span className="text-xl font-bold">$ 200.000</span>
            </div>
          </motion.div>
          <motion.div 
            className="bg-secondary rounded-2xl p-3 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <div className="text-xs text-gray-400 mb-2">Total Egresos</div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-purple-400" />
              <span className="text-xl font-bold">$ 200.000</span>
            </div>
          </motion.div>
          
          {/* Gráfico Radial de Egresos por Categoría */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <MonthlyExpenseChart />
          </motion.div>
          
          {/* Resumen Mensual */}
          <motion.div 
            className="bg-secondary rounded-2xl p-3 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold">Resumen Mensual</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Balance</span>
                <span className="text-sm font-bold text-cyan-400">+$50.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Ahorro Meta</span>
                <span className="text-sm font-bold">75%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1.5, delay: 1.2 }}
                ></motion.div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Días restantes</span>
                </div>
                <span className="text-sm font-bold">16</span>
              </div>
            </div>
          </motion.div>
          
          {/* Nuevo card - Actividad Reciente */}
          <motion.div 
            className="bg-secondary rounded-2xl p-3 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold">Actividad Reciente</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Transacciones hoy</span>
                <span className="text-sm font-bold text-purple-400">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Mayor gasto</span>
                <span className="text-sm font-bold">$45.000</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  transition={{ duration: 1.5, delay: 1.4 }}
                ></motion.div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Meta diaria</span>
                </div>
                <span className="text-sm font-bold">60%</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
