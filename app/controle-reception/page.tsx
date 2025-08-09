import { Card } from "@/components/ui/card"
import { ClipboardCheck } from "lucide-react"

export default function ControleReceptionPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Contrôle à réception</h1>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Nouveau contrôle</h2>
        <p className="text-muted-foreground">
          Interface pour effectuer les contrôles à la réception des marchandises.
        </p>
      </Card>
    </div>
  )
}