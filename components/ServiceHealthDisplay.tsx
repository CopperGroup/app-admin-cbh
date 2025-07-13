"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  HeartPulse,
  WifiOff,
  Cpu,
  MemoryStick,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"

interface HealthData {
  service: string
  status: string
  uptime: string
  database_connections: {
    redis: { status: string; error: string | null }
    postgres: { status: string; error: string | null }
  }
  system_load: {
    load_average_1min: number
    load_average_5min: number
    load_average_15min: number
    cpu_count: number
    memory_usage: {
      total_mb: string
      free_mb: string
      used_mb: string
      used_percentage: string
    }
  }
  timestamp: string
}

export default function ServiceHealthDisplay() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const res = await fetch(`/api/health`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to fetch health data.")
      }
      const data: HealthData = await res.json()
      setHealthData(data)
      if (isRefresh) {
        toast.success("Health data refreshed successfully")
      }
    } catch (err: any) {
      setError(err.message)
      toast.error(`Health check failed: ${err.message}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(() => fetchHealth(), 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className="border-0 shadow-lg rounded-2xl">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Service Health Monitor</CardTitle>
              <p className="text-gray-500 text-sm">Loading system health data...</p>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg rounded-2xl border-red-200 bg-red-50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-red-900">Service Health Error</CardTitle>
                <p className="text-red-700 text-sm">Unable to connect to health service</p>
              </div>
            </div>
            <Button
              onClick={() => fetchHealth()}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-100 rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-100 rounded-xl border border-red-200">
            <p className="text-red-800 font-medium mb-2">{error}</p>
            <p className="text-red-700 text-sm">
              Please check the service URL and API key in your environment configuration, and ensure the
              shared-variables-service is running.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!healthData) {
    return null
  }

  const isHealthy =
    healthData.status === "healthy" &&
    healthData.database_connections.redis.status === "connected" &&
    healthData.database_connections.postgres.status === "connected"

  const memoryUsagePercent = Number.parseFloat(healthData.system_load.memory_usage.used_percentage)

  return (
    <Card className={`border-0 shadow-lg rounded-2xl ${isHealthy ? "border-emerald-200" : "border-orange-200"}`}>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isHealthy ? "bg-emerald-100" : "bg-orange-100"
              }`}
            >
              <HeartPulse className={`w-5 h-5 ${isHealthy ? "text-emerald-600" : "text-orange-600"}`} />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Service Health Monitor</CardTitle>
              <div className="flex items-center space-x-3 mt-1">
                <Badge
                  className={`${
                    isHealthy
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-orange-100 text-orange-700 border-orange-200"
                  } rounded-lg px-3 py-1`}
                >
                  {isHealthy ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Healthy
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {healthData.status.toUpperCase()}
                    </>
                  )}
                </Badge>
                <p className="text-gray-500 text-sm">
                  Last updated: {new Date(healthData.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => fetchHealth(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Database Connections */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2 text-gray-600" />
            Database Connections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Redis Status */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      healthData.database_connections.redis.status === "connected" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="font-medium text-gray-900">Redis</span>
                </div>
                <Badge
                  className={`${
                    healthData.database_connections.redis.status === "connected"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  } rounded-lg px-2 py-1 text-xs`}
                >
                  {healthData.database_connections.redis.status}
                </Badge>
              </div>
              {healthData.database_connections.redis.error && (
                <p className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded-lg">
                  {healthData.database_connections.redis.error}
                </p>
              )}
            </div>

            {/* PostgreSQL Status */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      healthData.database_connections.postgres.status === "connected" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="font-medium text-gray-900">PostgreSQL</span>
                </div>
                <Badge
                  className={`${
                    healthData.database_connections.postgres.status === "connected"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  } rounded-lg px-2 py-1 text-xs`}
                >
                  {healthData.database_connections.postgres.status}
                </Badge>
              </div>
              {healthData.database_connections.postgres.error && (
                <p className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded-lg">
                  {healthData.database_connections.postgres.error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-gray-600" />
            System Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Load */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">CPU Load (1m)</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{healthData.system_load.load_average_1min.toFixed(2)}</p>
              <p className="text-xs text-blue-700 mt-1">{healthData.system_load.cpu_count} cores available</p>
            </div>

            {/* Memory Usage */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <MemoryStick className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Memory Usage</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{memoryUsagePercent.toFixed(1)}%</p>
              <p className="text-xs text-purple-700 mt-1">
                {healthData.system_load.memory_usage.used_mb} MB / {healthData.system_load.memory_usage.total_mb} MB
              </p>
            </div>

            {/* Load Average 5m */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center space-x-2 mb-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">Load Avg (5m)</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                {healthData.system_load.load_average_5min.toFixed(2)}
              </p>
            </div>

            {/* Uptime */}
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <HeartPulse className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Uptime</span>
              </div>
              <p className="text-lg font-bold text-orange-900">{healthData.uptime}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
