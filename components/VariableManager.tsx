"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Save, Loader2, XCircle, Settings, Database, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

interface Variable {
  name: string
  value: any
}

export default function VariableManager() {
  const [variables, setVariables] = useState<Variable[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newVarName, setNewVarName] = useState("")
  const [newVarValue, setNewVarValue] = useState("")
  const [editingVarName, setEditingVarName] = useState<string | null>(null)
  const [editingVarValue, setEditingVarValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const fetchAllVariables = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const res = await fetch("/api/variables")
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || errorData.message || "Failed to fetch all variables.")
      }
      const data = await res.json()
      if (data && Array.isArray(data.variables)) {
        setVariables(data.variables)
        if (isRefresh) {
          toast.success("Variables refreshed successfully")
        }
      } else {
        console.warn("API response for all variables did not contain an array under 'variables' key:", data)
        setVariables([])
      }
    } catch (error) {
      console.error("Failed to fetch variables:", error)
      toast.error("Failed to load variables.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAllVariables()
  }, [])

  const parseValue = (value: string) => {
    try {
      if (value.startsWith("{") || value.startsWith("[")) {
        return JSON.parse(value)
      } else if (!isNaN(Number(value)) && !isNaN(Number.parseFloat(value))) {
        return Number(value)
      } else if (value.toLowerCase() === "true") {
        return true
      } else if (value.toLowerCase() === "false") {
        return false
      }
    } catch (e) {
      // Keep as string if parsing fails
    }
    return value
  }

  const handleCreateVariable = async () => {
    if (!newVarName || newVarValue === "") {
      toast.error("Name and value cannot be empty.")
      return
    }

    setIsSaving(true)
    try {
      const parsedValue = parseValue(newVarValue)

      const res = await fetch("/api/variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newVarName, value: parsedValue }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to create variable.")
      }
      toast.success("Variable created successfully!")
      setNewVarName("")
      setNewVarValue("")
      fetchAllVariables()
    } catch (error: any) {
      console.error("Error creating variable:", error)
      toast.error(error.message || "Failed to create variable.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateVariable = async (name: string) => {
    if (editingVarValue === "") {
      toast.error("Value cannot be empty.")
      return
    }

    setIsSaving(true)
    try {
      const parsedValue = parseValue(editingVarValue)

      // NEW: Pass name in the body, targetting /api/variables with PUT method
      const res = await fetch("/api/variables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, value: parsedValue }), // Name now in body
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to update variable.")
      }
      toast.success("Variable updated successfully!")
      setEditingVarName(null)
      setEditingVarValue("")
      fetchAllVariables()
    } catch (error: any) {
      console.error("Error updating variable:", error)
      toast.error(error.message || "Failed to update variable.")
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = (variable: Variable) => {
    setEditingVarName(variable.name)
    setEditingVarValue(typeof variable.value === "object" ? JSON.stringify(variable.value) : String(variable.value))
  }

  const cancelEditing = () => {
    setEditingVarName(null)
    setEditingVarValue("")
  }

  const getValueType = (value: any) => {
    if (typeof value === "object" && value !== null) return "object"
    if (typeof value === "number") return "number"
    if (typeof value === "boolean") return "boolean"
    return "string"
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "object":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "number":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "boolean":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg rounded-2xl">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Configuration Variables</CardTitle>
              <p className="text-gray-500 text-sm">Loading variables...</p>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Configuration Variables</CardTitle>
              <p className="text-gray-500 text-sm">Manage shared configuration variables for your microservices</p>
            </div>
          </div>
          <Button
            onClick={() => fetchAllVariables(true)}
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
        {/* Create New Variable Section */}
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Create New Variable</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="newVarName" className="text-gray-700 font-medium text-sm">
                Variable Name
              </Label>
              <Input
                id="newVarName"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                placeholder="e.g., FREE_TRIAL_DURATION_DAYS"
                className="h-12 bg-white border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newVarValue" className="text-gray-700 font-medium text-sm">
                Variable Value
              </Label>
              <Input
                id="newVarValue"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                placeholder="e.g., 14 or 'https://api.example.com'"
                className="h-12 bg-white border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl font-mono"
              />
            </div>
            <Button
              onClick={handleCreateVariable}
              disabled={isSaving}
              className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Variable
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Tip:</strong> Values are automatically parsed. Use JSON for objects/arrays, numbers for numeric
              values, and true/false for booleans.
            </p>
          </div>
        </div>

        <Separator className="bg-gray-200" />

        {/* Existing Variables Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Existing Variables</h3>
            <Badge className="bg-gray-100 text-gray-700 border-gray-200 rounded-lg px-3 py-1">
              {variables.length} variables
            </Badge>
          </div>

          {variables.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Settings className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No variables configured</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first configuration variable above to start managing shared settings across your
                microservices.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {variables.map((variable) => {
                const valueType = getValueType(variable.value)
                const isEditing = editingVarName === variable.name

                return (
                  <Card
                    key={variable.name}
                    className="border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Variable Name */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Label className="text-xs text-gray-500 font-medium">VARIABLE NAME</Label>
                              <Badge className={`text-xs rounded-lg px-2 py-1 ${getTypeColor(valueType)}`}>
                                {valueType}
                              </Badge>
                            </div>
                            <p className="font-mono text-sm text-gray-900 break-words bg-gray-50 p-3 rounded-lg">
                              {variable.name}
                            </p>
                          </div>

                          {/* Variable Value */}
                          <div className="space-y-2 mt-2">
                            <Label className="text-xs text-gray-500 font-medium">VALUE</Label>
                            {isEditing ? (
                              <Input
                                value={editingVarValue}
                                onChange={(e) => setEditingVarValue(e.target.value)}
                                className="font-mono text-sm bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                                placeholder="Enter new value..."
                              />
                            ) : (
                              <div className="font-mono text-sm text-gray-900 break-words bg-gray-50 p-3 rounded-lg max-h-20 overflow-y-auto">
                                {typeof variable.value === "object"
                                  ? JSON.stringify(variable.value, null, 2)
                                  : String(variable.value)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0 flex space-x-2">
                          {isEditing ? (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleUpdateVariable(variable.name)}
                                disabled={isSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                              >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditing}
                                className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl bg-transparent"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(variable)}
                              className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}