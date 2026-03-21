import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function FamiliaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Familia</h1>
          <p className="text-muted-foreground mt-1">
            Miembros de la familia y administracion
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Miembros de la Familia
          </CardTitle>
          <CardDescription>
            Conecta tu base de datos de Supabase para ver los miembros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground space-y-2">
            <p>Miembros registrados:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Pablo</li>
              <li>Benjamin</li>
              <li>David</li>
              <li>Maricielo</li>
              <li>Mama (Admin)</li>
              <li>Papa Walter (Admin)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
