import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function ConsecuenciasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consecuencias</h1>
          <p className="text-muted-foreground mt-1">
            Consecuencias activas y por cumplir
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Consecuencias Activas
          </CardTitle>
          <CardDescription>
            Conecta tu base de datos de Supabase para ver consecuencias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Las consecuencias pendientes y en progreso se mostraran aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
