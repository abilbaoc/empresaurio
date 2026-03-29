import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, FileText, TrendingUp, CalendarDays } from 'lucide-react'

const statCards = [
  {
    title: 'Videos en pipeline',
    value: '—',
    description: 'Scripts pendientes de producir',
    icon: FileText,
  },
  {
    title: 'Tendencias tracked',
    value: '—',
    description: 'Topics en Viral Tracker',
    icon: TrendingUp,
  },
  {
    title: 'Publicaciones este mes',
    value: '—',
    description: 'Across TikTok, IG, YouTube',
    icon: BarChart3,
  },
  {
    title: 'Próxima publicación',
    value: '—',
    description: 'Scheduled in calendar',
    icon: CalendarDays,
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido, {user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Módulos disponibles</CardTitle>
            <CardDescription>
              Las herramientas del Tech Content Engine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { emoji: '🔥', name: 'Viral Tracker', desc: 'Monitoriza tendencias y topics virales' },
              { emoji: '✍️', name: 'Script Generator', desc: 'Genera guiones con Claude AI' },
              { emoji: '📅', name: 'Calendario', desc: 'Planifica y gestiona tu contenido' },
              { emoji: '📊', name: 'Analytics', desc: 'Métricas y rendimiento de canales' },
            ].map((mod) => (
              <div key={mod.name} className="flex items-center gap-3 p-2 rounded-lg border">
                <span className="text-xl">{mod.emoji}</span>
                <div>
                  <p className="font-medium text-sm">{mod.name}</p>
                  <p className="text-xs text-muted-foreground">{mod.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick start</CardTitle>
            <CardDescription>Primeros pasos recomendados</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Añade topics trending en <strong className="text-foreground">Viral Tracker</strong></li>
              <li>Genera un script con <strong className="text-foreground">Script Generator</strong></li>
              <li>Programa la publicación en el <strong className="text-foreground">Calendario</strong></li>
              <li>Revisa el rendimiento en <strong className="text-foreground">Analytics</strong></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
