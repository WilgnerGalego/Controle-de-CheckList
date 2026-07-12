import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { TrendingUp, Build, ReportProblem, FactCheck } from '@mui/icons-material'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { PageHeader } from '../components/PageHeader'
import { checklistResponseService, checklistService, equipmentService, nonConformityService } from '../services/firestore'
import type { ChecklistDoc, ChecklistResponse, EquipmentType, NonConformity } from '../types/firestore'

const COLORS = ['#2e7d32', '#1565c0', '#c62828', '#f57c00', '#6a1b9a']

export function DashboardPage() {
  const [checklists, setChecklists] = useState<ChecklistDoc[]>([])
  const [responses, setResponses] = useState<ChecklistResponse[]>([])
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([])
  const [filters, setFilters] = useState({ start: '', end: '', turno: 'Todos' as 'Todos' | 'A' | 'B' | 'C', tipoEquipamento: 'Todos' as EquipmentType | 'Todos', frota: '' })

  useEffect(() => {
    void Promise.all([
      checklistService.list(),
      checklistResponseService.listAll(),
      nonConformityService.list(),
      equipmentService.list(),
    ]).then(([checklistData, responseData, defectsData]) => {
      setChecklists(checklistData)
      setResponses(responseData)
      setNonConformities(defectsData)
    })
  }, [])

  const filteredChecklists = useMemo(() => {
    return checklists.filter((item) => {
      const withinDate = (!filters.start || item.data >= filters.start) && (!filters.end || item.data <= filters.end)
      const matchesTurno = filters.turno === 'Todos' || item.turno === filters.turno
      const matchesType = filters.tipoEquipamento === 'Todos' || item.tipoEquipamento === filters.tipoEquipamento
      const matchesFrota = !filters.frota || item.frota.toLowerCase().includes(filters.frota.toLowerCase())
      return withinDate && matchesTurno && matchesType && matchesFrota
    })
  }, [checklists, filters])

  const filteredResponses = useMemo(() => {
    return responses.filter((item) => filteredChecklists.some((checklist) => checklist.id === item.checklistId))
  }, [responses, filteredChecklists])

  const filteredDefects = useMemo(() => {
    return nonConformities.filter((item) => {
      const withinDate = (!filters.start || item.data >= filters.start) && (!filters.end || item.data <= filters.end)
      const matchesTurno = filters.turno === 'Todos' || item.turno === filters.turno
      const matchesType = filters.tipoEquipamento === 'Todos' || item.tipoEquipamento === filters.tipoEquipamento
      const matchesFrota = !filters.frota || item.frota.toLowerCase().includes(filters.frota.toLowerCase())
      return withinDate && matchesTurno && matchesType && matchesFrota
    })
  }, [nonConformities, filters])

  const totalItens = filteredResponses.length
  const conformes = filteredResponses.filter((item) => item.resultado === 'Conforme').length
  const naoConformes = filteredResponses.filter((item) => item.resultado === 'Não Conforme').length
  const percentualConformidade = totalItens > 0 ? Math.round((conformes / totalItens) * 100) : 0

  const byType = useMemo(() => {
    const report = new Map<string, { total: number; conformes: number; naoConformes: number }>()
    filteredResponses.forEach((response) => {
      const checklist = filteredChecklists.find((item) => item.id === response.checklistId)
      const key = checklist?.tipoEquipamento ?? 'Não identificado'
      const current = report.get(key) ?? { total: 0, conformes: 0, naoConformes: 0 }
      current.total += 1
      if (response.resultado === 'Conforme') current.conformes += 1
      else current.naoConformes += 1
      report.set(key, current)
    })
    return Array.from(report.entries()).map(([name, values]) => ({ name, percentual: values.total ? Math.round((values.conformes / values.total) * 100) : 0 }))
  }, [filteredChecklists, filteredResponses])

  const defectsByCategory = useMemo(() => {
    const report = new Map<string, number>()
    filteredDefects.forEach((item) => report.set(item.categoria, (report.get(item.categoria) ?? 0) + 1))
    return Array.from(report.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredDefects])

  const defectsByFrota = useMemo(() => {
    const report = new Map<string, number>()
    filteredDefects.forEach((item) => report.set(item.frota, (report.get(item.frota) ?? 0) + 1))
    return Array.from(report.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredDefects])

  const turnos = useMemo(() => {
    const values = ['A', 'B', 'C'] as const
    return values.map((turno) => {
      const checklistsByTurno = filteredChecklists.filter((item) => item.turno === turno)
      const defectsByTurno = filteredDefects.filter((item) => item.turno === turno)
      const totalItems = filteredResponses.filter((item) => {
        const checklist = filteredChecklists.find((check) => check.id === item.checklistId)
        return checklist?.turno === turno
      }).length
      const conformesByTurno = filteredResponses.filter((item) => {
        const checklist = filteredChecklists.find((check) => check.id === item.checklistId)
        return checklist?.turno === turno && item.resultado === 'Conforme'
      }).length
      const percentual = totalItems > 0 ? Math.round((conformesByTurno / totalItems) * 100) : 0
      return { turno, checklists: checklistsByTurno.length, defeitos: defectsByTurno.length, percentual }
    })
  }, [filteredChecklists, filteredDefects, filteredResponses])

  const dailyEvolution = useMemo(() => {
    const report = new Map<string, { checklists: number; defeitos: number }>()
    filteredChecklists.forEach((item) => {
      const current = report.get(item.data) ?? { checklists: 0, defeitos: 0 }
      current.checklists += 1
      report.set(item.data, current)
    })
    filteredDefects.forEach((item) => {
      const current = report.get(item.data) ?? { checklists: 0, defeitos: 0 }
      current.defeitos += 1
      report.set(item.data, current)
    })
    return Array.from(report.entries()).map(([date, values]) => ({ date, checklists: values.checklists, defeitos: values.defeitos }))
  }, [filteredChecklists, filteredDefects])

  const rankingFrotas = [...defectsByFrota].sort((a, b) => b.value - a.value).slice(0, 5)
  const rankingCategorias = [...defectsByCategory].sort((a, b) => b.value - a.value).slice(0, 5)

  const cards = [
    { label: 'Checklists realizados', value: filteredChecklists.length, icon: FactCheck, color: '#2e7d32' },
    { label: 'Equipamentos inspecionados', value: new Set(filteredChecklists.map((item) => item.frota)).size, icon: Build, color: '#1565c0' },
    { label: 'Itens verificados', value: totalItens, icon: TrendingUp, color: '#f57c00' },
    { label: 'Itens conforme', value: conformes, icon: TrendingUp, color: '#2e7d32' },
    { label: 'Itens não conforme', value: naoConformes, icon: ReportProblem, color: '#c62828' },
    { label: 'Não conformidades abertas', value: filteredDefects.filter((item) => item.status === 'Pendente' || item.status === 'O.S. aberta' || item.status === 'Em manutenção').length, icon: ReportProblem, color: '#c62828' },
    { label: 'O.S. informadas', value: filteredDefects.filter((item) => item.numeroOSGATEC).length, icon: FactCheck, color: '#1565c0' },
    { label: 'O.S. pendentes de informação', value: filteredDefects.filter((item) => !item.numeroOSGATEC && (item.status === 'Pendente' || item.status === 'O.S. aberta')).length, icon: ReportProblem, color: '#f57c00' },
  ]

  return (
    <Box>
      <PageHeader title="Dashboard" description="Visão gerencial dos checklists, defeitos e conformidade." />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Período inicial" type="date" value={filters.start} onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value }))} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Período final" type="date" value={filters.end} onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value }))} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Turno</InputLabel>
              <Select value={filters.turno} label="Turno" onChange={(event) => setFilters((current) => ({ ...current, turno: event.target.value as 'Todos' | 'A' | 'B' | 'C' }))}>
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={filters.tipoEquipamento} label="Tipo" onChange={(event) => setFilters((current) => ({ ...current, tipoEquipamento: event.target.value as EquipmentType | 'Todos' }))}>
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Colhedora">Colhedora</MenuItem>
                <MenuItem value="Trator">Trator</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField label="Frota" value={filters.frota} onChange={(event) => setFilters((current) => ({ ...current, frota: event.target.value }))} fullWidth />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={card.label}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
                  <Icon sx={{ color: card.color }} />
                  <Typography variant="subtitle1">{card.label}</Typography>
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{card.value}</Typography>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Percentual geral de conformidade</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>{percentualConformidade}%</Typography>
            <Typography color="text.secondary">Baseado em {totalItens} itens verificados.</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Percentual por tipo</Typography>
            <Stack spacing={1}>
              {byType.map((item) => (
                <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>{item.name}</Typography>
                  <Chip label={`${item.percentual}%`} color="success" size="small" />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Não conformidades por categoria</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={defectsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#c62828" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Não conformidades por frota</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={defectsByFrota} dataKey="value" nameKey="name" outerRadius={90}>
                  {defectsByFrota.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Comparativo por turno</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={turnos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="turno" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="checklists" fill="#2e7d32" />
                <Bar dataKey="defeitos" fill="#c62828" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Evolução diária</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="checklists" stroke="#2e7d32" />
                <Line type="monotone" dataKey="defeitos" stroke="#c62828" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Frotas com mais defeitos</Typography>
            <Stack spacing={1}>
              {rankingFrotas.map((item) => (
                <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>{item.name}</Typography>
                  <Chip label={`${item.value} defeitos`} color="error" size="small" />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Categorias com mais ocorrências</Typography>
            <Stack spacing={1}>
              {rankingCategorias.map((item) => (
                <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>{item.name}</Typography>
                  <Chip label={`${item.value} ocorrências`} color="warning" size="small" />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
