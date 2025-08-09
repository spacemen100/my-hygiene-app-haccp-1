import { Card } from "@/components/ui/card"
import { Thermometer } from "lucide-react"

export default function SuiviRefroidissementPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-3">
        <Thermometer className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Suivi de refroidissement</h1>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Courbe de refroidissement</h2>
        <p className="text-muted-foreground">
          Interface pour suivre les courbes de refroidissement des produits.
        </p>
      </Card>
    </div>
  )
}