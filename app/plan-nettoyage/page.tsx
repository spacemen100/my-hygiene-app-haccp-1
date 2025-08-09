import {
  Card,
} from '@mui/material';
import { SprayCan } from "lucide-react"

export default function PlanNettoyagePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-3">
        <SprayCan className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Plan de nettoyage</h1>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Planification du nettoyage</h2>
        <p className="text-muted-foreground">
          Interface pour gérer et planifier les opérations de nettoyage.
        </p>
      </Card>
    </div>
  )
}