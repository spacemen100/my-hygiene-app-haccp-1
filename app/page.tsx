// app/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
      {/* Section Traçabilité */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">TRAÇABILITÉ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium">CONTROLE À RÉCEPTION</h3>
            <div className="mt-2 grid gap-2">
              <div className="flex items-center">
                <span className="mr-2">•</span>
                <span>ENREGISTREMENT DES ÉTIQUETTES</span>
                <span className="ml-auto text-muted-foreground">ENREG</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">•</span>
                <span>IMPRESSION DES PLC SECONDAIRES</span>
                <span className="ml-auto text-muted-foreground">INFR</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Températures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">TEMPÉRATURES</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium">ENCEINTES FROIDES</h3>
            <div className="mt-2 grid gap-2">
              <div className="flex items-center">
                <span className="mr-2">•</span>
                <span>AVAIT 28H00</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium">SUIVI DE REFROIDISSEMENT</h3>
            <div className="mt-2 grid gap-2">
              <div className="flex items-center">
                <span className="mr-2">•</span>
                <span>EN ATTENTE</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Hygiène */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">HYGIÈNE ET AUDITS</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-medium">PLAN DE NETTOYAGE</h3>
        </CardContent>
      </Card>
    </div>
  )
}