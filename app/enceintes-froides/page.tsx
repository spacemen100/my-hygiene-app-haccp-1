'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Paper,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  AcUnit as SnowflakeIcon,
  Thermostat,
  Warning,
  TrendingDown,
  Wifi,
  WifiOff,
} from '@mui/icons-material';

export default function EnceintesFroidesPage() {
  const chambers = [
    { id: "CF-A", name: "Chambre froide A", temp: "2.1°C", target: "2°C", status: "normal", connected: true },
    { id: "CF-B", name: "Chambre froide B", temp: "1.8°C", target: "2°C", status: "normal", connected: true },
    { id: "CF-C", name: "Chambre froide C", temp: "4.2°C", target: "4°C", status: "warning", connected: true },
    { id: "CONG-1", name: "Congélateur 1", temp: "-18.5°C", target: "-18°C", status: "normal", connected: false }
  ];

  const stats = [
    { label: "Enceintes", value: "4", icon: SnowflakeIcon, color: "#2196f3" },
    { label: "Normales", value: "3", icon: Thermostat, color: "#4caf50" },
    { label: "Alertes", value: "1", icon: Warning, color: "#ff9800" },
    { label: "Moyenne", value: "2.3°C", icon: TrendingDown, color: "#00bcd4" }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Snowflake className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Enceintes froides</h1>
            <p className="text-cyan-100 text-lg">Surveillance des températures en temps réel</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Enceintes</p>
                <p className="text-3xl font-bold text-gray-900">4</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <Snowflake className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Normales</p>
                <p className="text-3xl font-bold text-green-600">3</p>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <Thermometer className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Alertes</p>
                <p className="text-3xl font-bold text-orange-600">1</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Moyenne</p>
                <p className="text-3xl font-bold text-cyan-600">2.3°C</p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-50">
                <TrendingDown className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chambers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chambers.map((chamber) => (
          <Card key={chamber.id} className={`shadow-md transition-all duration-200 ${
            chamber.status === 'warning' ? 'border-orange-200 bg-orange-50/30' :
            chamber.status === 'alert' ? 'border-red-200 bg-red-50/30' : 'hover:shadow-lg'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{chamber.name}</CardTitle>
                  <CardDescription>ID: {chamber.id}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {chamber.connected ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  )}
                  <div className={`w-3 h-3 rounded-full ${
                    chamber.status === 'normal' ? 'bg-green-500' :
                    chamber.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{chamber.temp}</p>
                    <p className="text-sm text-gray-500">Température actuelle</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-gray-600">{chamber.target}</p>
                    <p className="text-sm text-gray-500">Consigne</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${
                    chamber.status === 'normal' ? 'bg-green-500' :
                    chamber.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                  }`} style={{ width: '85%' }} />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Dernière mesure : Il y a 2 minutes
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Temperature History */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Historique des températures</CardTitle>
          <CardDescription>
            Évolution des températures sur les dernières 24h
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center text-gray-500">
              <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Graphique des températures</p>
              <p className="text-sm">Interface à implémenter</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}