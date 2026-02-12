import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DateSelector } from '../components/DateSelector'
import { HeroFocusStatus } from '../components/HeroFocusStatus'
import { DailyGoalCompletion } from '../components/DailyGoalCompletion'
import { DailyFuel } from '../components/DailyFuel'
import { Layout } from '../components/Layout'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <Layout>
      <div className="space-y-3 md:space-y-6 p-1 sm:p-2 md:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
          <div className="flex flex-col xs:flex-row items-center gap-2 md:gap-6 w-full md:w-auto">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white self-start xs:self-auto">Dashboard</h1>
            <div className="w-full xs:w-auto">
              <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
          <HeroFocusStatus selectedDate={selectedDate} />
          <DailyGoalCompletion />
        </div>

        {/* Daily Fuel Section */}
        <DailyFuel selectedDate={selectedDate} />
      </div>
    </Layout>
  )
}
