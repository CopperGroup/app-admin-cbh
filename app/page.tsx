"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, LogOut, Shield, Settings, Activity, Database } from "lucide-react"
import { toast } from "sonner"
import ServiceHealthDisplay from "@/components/ServiceHealthDisplay"
import VariableManager from "@/components/VariableManager"

export default function HomePage() {
  const [password, setPassword] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const router = useRouter()

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

  useEffect(() => {
    const token = Cookies.get("auth_token")
    if (token === "authenticated") {
      setIsAuthenticated(true)
    }
    setIsAuthenticating(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)

    if (!ADMIN_PASSWORD) {
      toast.error("Admin password not set in environment!")
      setLoginLoading(false)
      return
    }

    try {
      if (password === ADMIN_PASSWORD) {
        Cookies.set("auth_token", "authenticated", { expires: 1 })
        setIsAuthenticated(true)
        toast.success("Welcome to the admin panel!")
      } else {
        toast.error("Invalid password. Please try again.")
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("An error occurred during login.")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    Cookies.remove("auth_token")
    setIsAuthenticated(false)
    setPassword("")
    toast.info("Successfully logged out.")
  }

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
          <p className="text-gray-600 font-medium">Initializing admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Enter your credentials to access the dashboard</p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-xl rounded-2xl bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl text-center text-gray-900">Secure Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                    Admin Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your admin password"
                    className="h-12 bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg font-semibold"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Access Dashboard
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-gray-100 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              This is a secure admin area. All access attempts are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">System management and configuration</p>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl px-4 py-2"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}


        {/* Service Health Section */}
        <div className="space-y-8">
          <ServiceHealthDisplay />

          <Separator className="my-8 bg-gray-200" />

          <VariableManager />
        </div>
      </main>
    </div>
  )
}
