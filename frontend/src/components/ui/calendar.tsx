"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"
import { setMonth, setYear } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [month, setMonthState] = React.useState<Date>(props.defaultMonth || new Date())
  
  const currentYear = new Date().getFullYear()
  // Rango de 50 años: 30 años atrás y 20 años adelante
  const years = Array.from({ length: 51 }, (_, i) => currentYear - 30 + i)

  const handleMonthChange = (newMonth: string) => {
    const monthIndex = parseInt(newMonth)
    setMonthState(prev => setMonth(prev, monthIndex))
  }

  const handleYearChange = (newYear: string) => {
    const year = parseInt(newYear)
    setMonthState(prev => setYear(prev, year))
  }

  return (
    <div className={cn("p-3", className)}>
      {/* Custom Header with Select dropdowns */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setMonthState(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <div className="flex gap-2">
          <Select value={month.getMonth().toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-8 w-[120px]" style={{ backgroundColor: 'var(--card)' }}>
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'var(--card)' }}>
              {MONTHS.map((monthName, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={month.getFullYear().toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 w-[90px]" style={{ backgroundColor: 'var(--card)' }}>
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'var(--card)' }}>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <button
          type="button"
          onClick={() => setMonthState(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      <DayPicker
        locale={es}
        showOutsideDays={showOutsideDays}
        month={month}
        onMonthChange={setMonthState}
        hideNavigation
        classNames={{
          months: "flex flex-col",
          month: "space-y-2",
          month_caption: "hidden",
          month_grid: "w-full border-collapse",
          weekdays: "flex",
          weekday: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] text-center",
          week: "flex w-full mt-2",
          day: "h-10 w-10 text-center text-sm p-0 relative",
          day_button: cn(
            buttonVariants({ variant: "ghost" }),
            "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground"
          ),
          selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
          today: "bg-accent text-accent-foreground rounded-md",
          outside: "text-muted-foreground opacity-50",
          disabled: "text-muted-foreground opacity-50",
          hidden: "invisible",
          ...classNames,
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
