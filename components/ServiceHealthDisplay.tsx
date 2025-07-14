"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Server, // New icon for generic service
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator"; // Assuming you have this component

interface ServiceHealthData {
  service: string;
  status: string;
  uptime?: string; // Optional for services that don't provide it
  database_connections?: { // Optional for services that don't provide it
    redis?: { status: string; error: string | null };
    postgres: { status: string; error: string | null };
  };
  system_load?: { // Optional for services that don't provide it
    load_average_1min: number;
    load_average_5min: number;
    load_average_15min: number;
    cpu_count: number;
    memory_usage: {
      total_mb: string;
      free_mb: string;
      used_mb: string;
      used_percentage: string;
    };
  };
  timestamp: string;
  error?: string | null; // For network/proxy errors
}

// Define a type to hold health data for all monitored services
interface AllServicesHealth {
  sharedVariablesService: ServiceHealthData | null;
  planControllerService: ServiceHealthData | null;
}

export default function ServiceHealthDisplay() {
  const [allServicesHealth, setAllServicesHealth] = useState<AllServicesHealth>({
    sharedVariablesService: null,
    planControllerService: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchHealth = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch Shared Variables Service Health
      const sharedVariablesRes = await fetch(`/api/health?service=shared-variables`);
      const sharedVariablesData: ServiceHealthData = await sharedVariablesRes.json();
      // If the response is not OK, the error property will be populated by the API route
      // so we don't need to throw here, just set the data.
      
      // Fetch Plan Controller Service Health
      const planControllerRes = await fetch(`/api/health?service=plan-controller`);
      const planControllerData: ServiceHealthData = await planControllerRes.json();
      
      setAllServicesHealth({
        sharedVariablesService: sharedVariablesData,
        planControllerService: planControllerData,
      });

      if (isRefresh) {
        toast.success("All service health data refreshed successfully");
      }
    } catch (err: any) {
      console.error("Error fetching service health:", err);
      toast.error(`Failed to load service health: ${err.message}`);
      // This catch block would primarily handle network errors before the API route responds.
      // The API route itself now handles errors from the backend services and returns structured error data.
      setAllServicesHealth(prev => ({
        ...prev,
        sharedVariablesService: prev.sharedVariablesService || { service: "shared-variables-service", status: "error", timestamp: new Date().toISOString(), error: err.message },
        planControllerService: prev.planControllerService || { service: "plan-controller-service", status: "error", timestamp: new Date().toISOString(), error: err.message },
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const renderHealthCard = (serviceDisplayName: string, healthData: ServiceHealthData | null) => {
    const isLoading = loading && !healthData;
    const isError = healthData?.status === "error" || healthData?.error;
    
    // Determine overall health for the badge and card styling
    let isHealthy = false;
    if (healthData && !isError) {
      isHealthy = healthData.status === "healthy" &&
                  (healthData.database_connections?.postgres?.status === "connected");
      // Only check Redis for shared-variables-service
      if (healthData.service === "shared-variables-service" && healthData.database_connections?.redis) {
        isHealthy = isHealthy && healthData.database_connections.redis.status === "connected";
      }
    }

    const memoryUsagePercent = healthData?.system_load?.memory_usage?.used_percentage ? Number.parseFloat(healthData.system_load.memory_usage.used_percentage) : 0;

    return (
      <Card key={serviceDisplayName} className={`border-0 shadow-lg rounded-2xl ${
        isLoading ? 'border-gray-200' : isError ? 'border-red-200 bg-red-50' : isHealthy ? 'border-emerald-200' : 'border-orange-200'
      }`}>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isLoading ? 'bg-gray-100' : isError ? 'bg-red-100' : isHealthy ? 'bg-emerald-100' : 'bg-orange-100'
              }`}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-600" /> :
                 isError ? <WifiOff className="w-5 h-5 text-red-600" /> :
                 <Server className={`w-5 h-5 ${isHealthy ? "text-emerald-600" : "text-orange-600"}`} />}
              </div>
              <div>
                <CardTitle className={`text-xl ${isError ? 'text-red-900' : 'text-gray-900'}`}>
                  {serviceDisplayName}
                </CardTitle>
                <div className="flex items-center space-x-3 mt-1">
                  <Badge
                    className={`${
                      isError ? "bg-red-100 text-red-700 border-red-200" :
                      isHealthy ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      "bg-orange-100 text-orange-700 border-orange-200"
                    } rounded-lg px-3 py-1`}
                  >
                    {isError ? (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Error
                      </>
                    ) : isHealthy ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Healthy
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {healthData?.status?.toUpperCase() || 'UNKNOWN'}
                      </>
                    )}
                  </Badge>
                  <p className="text-gray-500 text-sm">
                    {healthData ? `Last updated: ${new Date(healthData.timestamp).toLocaleTimeString()}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => fetchHealth(true)} // Refresh all services with one button
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {isError && healthData?.error && (
          <CardContent>
            <div className="p-4 bg-red-100 rounded-xl border border-red-200">
              <p className="text-red-800 font-medium mb-2">{healthData.error}</p>
              <p className="text-red-700 text-sm">
                Please check the service URL and API key in your environment configuration, and ensure the service is running.
              </p>
            </div>
          </CardContent>
        )}

        {!isError && healthData && (
          <CardContent className="space-y-8">
            {/* Database Connections */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-gray-600" />
                Database Connections
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthData.database_connections?.redis && ( // Only show Redis if available
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
                )}

                {healthData.database_connections?.postgres && ( // Always show Postgres if available
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
                )}
              </div>
            </div>

            {/* System Metrics (Only for services that provide them, like shared-variables-service) */}
            {healthData.system_load && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Cpu className="w-5 h-5 mr-2 text-gray-600" />
                  System Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">CPU Load (1m)</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{healthData.system_load.load_average_1min.toFixed(2)}</p>
                    <p className="text-xs text-blue-700 mt-1">{healthData.system_load.cpu_count} cores available</p>
                  </div>

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

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Cpu className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-900">Load Avg (5m)</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">
                      {healthData.system_load.load_average_5min.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <HeartPulse className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Uptime</span>
                    </div>
                    <p className="text-lg font-bold text-orange-900">{healthData.uptime}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Shared Variables Service Health */}
      {renderHealthCard("Shared Variables Service", allServicesHealth.sharedVariablesService)}
      
      {/* Plan Controller Service Health */}
      {renderHealthCard("Plan Controller Service", allServicesHealth.planControllerService)}
    </div>
  );
}