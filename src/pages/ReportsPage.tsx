import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { PageHeader } from '../components/PageHeader'
import { checklistService, nonConformityService } from '../services/firestore'
import type { ChecklistDoc, ChecklistTurno, EquipmentType, NonConformity, NonConformityStatus } from '../types/firestore'

export function ReportsPage() {
  const [checklists, setChecklists] = useState<ChecklistDoc[]>([])
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([])
  const [filters, setFilters] = useState({ start: '', end: '', turno: 'Todos' as ChecklistTurno | 'Todos', tipoEquipamento: 'Todos' as EquipmentType | 'Todos', frota: '', status: 'Todos' as NonConformityStatus | 'Todos' })
  const [view, setView] = useState<'checklists' | 'defeitos'>('checklists')

  useEffect(() => {
    void Promise.all([checklistService.list(), nonConformityService.list()]).then(([checklistsData, defectsData]) => {
      setChecklists(checklistsData)
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

  const filteredDefects = useMemo(() => {
    return nonConformities.filter((item) => {
      const withinDate = (!filters.start || item.data >= filters.start) && (!filters.end || item.data <= filters.end)
      const matchesTurno = filters.turno === 'Todos' || item.turno === filters.turno
      const matchesType = filters.tipoEquipamento === 'Todos' || item.tipoEquipamento === filters.tipoEquipamento
      const matchesFrota = !filters.frota || item.frota.toLowerCase().includes(filters.frota.toLowerCase())
      const matchesStatus = filters.status === 'Todos' || item.status === filters.status
      return withinDate && matchesTurno && matchesType && matchesFrota && matchesStatus
    })
  }, [nonConformities, filters])

  const buildPdf = () => {
    const printable = view === 'checklists' ? filteredChecklists : filteredDefects
    const content = `Relatório ${view === 'checklists' ? 'de Checklists' : 'de Não Conformidades'}\nPeríodo: ${filters.start || 'início'} até ${filters.end || 'fim'}\nTurno: ${filters.turno}\nTipo: ${filters.tipoEquipamento}\nFrota: ${filters.frota || 'Todos'}\nStatus: ${filters.status}\n\n${JSON.stringify(printable, null, 2)}`
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${view === 'checklists' ? 'checklists' : 'nao-conformidades'}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const rows = view === 'checklists'
      ? filteredChecklists.map((item) => ({ Data: item.data, Hora: item.hora, Turno: item.turno, Frota: item.frota, Tipo: item.tipoEquipamento, 'Total de itens': item.quantidadeItens, 'Conformes': item.quantidadeConformes, 'Não conforme': item.quantidadeNaoConformes, 'Percentual': `${Math.round((item.quantidadeConformes / Math.max(item.quantidadeItens, 1)) * 100)}%` }))
      : filteredDefects.map((item) => ({ Data: item.data, Hora: item.hora, Turno: item.turno, Frota: item.frota, Categoria: item.categoria, Item: item.item, Defeito: item.descricaoDefeito, Prioridade: item.prioridade, 'O.S. GATEC': item.numeroOSGATEC ?? '', Status: item.status }))

    const csv = [Object.keys(rows[0] ?? {}).join(';'), ...rows.map((row) => Object.values(row).join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${view === 'checklists' ? 'checklists' : 'nao-conformidades'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const summary = useMemo(() => {
    if (view === 'checklists') {
      const totalItens = filteredChecklists.reduce((sum, item) => sum + item.quantidadeItens, 0)
      const conformes = filteredChecklists.reduce((sum, item) => sum + item.quantidadeConformes, 0)
      return {
        total: filteredChecklists.length,
        itens: totalItens,
        conformes,
        naoConformes: filteredChecklists.reduce((sum, item) => sum + item.quantidadeNaoConformes, 0),
        percentual: totalItens > 0 ? Math.round((conformes / totalItens) * 100) : 0,
      }
    }

    return {
      total: filteredDefects.length,
      itens: filteredDefects.length,
      conformes: 0,
      naoConformes: filteredDefects.length,
      percentual: 0,
    }
  }, [filteredChecklists, filteredDefects, view])

  return (
    <Box>
      <PageHeader title="Relatórios" description="Consulte os dados de checklists e não conformidades com filtros e exportação." />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Data inicial" type="date" value={filters.start} onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value }))} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Data final" type="date" value={filters.end} onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value }))} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Turno</InputLabel>
              <Select value={filters.turno} label="Turno" onChange={(event) => setFilters((current) => ({ ...current, turno: event.target.value as ChecklistTurno | 'Todos' }))}>
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
          <Button variant={view === 'checklists' ? 'contained' : 'outlined'} onClick={() => setView('checklists')}>Visualizar Checklists</Button>
          <Button variant={view === 'defeitos' ? 'contained' : 'outlined'} onClick={() => setView('defeitos')}>Visualizar Não Conformidades</Button>
          <Button variant="outlined" onClick={buildPdf}>Gerar PDF</Button>
          <Button variant="outlined" onClick={exportExcel}>Exportar Excel</Button>
        </Stack>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Resumo</Typography>
            <Typography color="text.secondary">Registros: {summary.total}</Typography>
            <Typography color="text.secondary">Itens analisados: {summary.itens}</Typography>
            <Typography color="text.secondary">Conformes: {summary.conformes}</Typography>
            <Typography color="text.secondary">Não conformes: {summary.naoConformes}</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>{view === 'checklists' ? `${summary.percentual}%` : '—'}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Relatório Diário de Inspeção</Typography>
            <Typography color="text.secondary">Consolida os checklists e defeitos do período selecionado para comunicação diária.</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        {view === 'checklists' ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Turno</TableCell>
                <TableCell>Frota</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Conforme</TableCell>
                <TableCell>Não conforme</TableCell>
                <TableCell>Percentual</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredChecklists.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.data}</TableCell>
                  <TableCell>{item.hora}</TableCell>
                  <TableCell>{item.turno}</TableCell>
                  <TableCell>{item.frota}</TableCell>
                  <TableCell>{item.tipoEquipamento}</TableCell>
                  <TableCell>{item.quantidadeItens}</TableCell>
                  <TableCell>{item.quantidadeConformes}</TableCell>
                  <TableCell>{item.quantidadeNaoConformes}</TableCell>
                  <TableCell>{`${Math.round((item.quantidadeConformes / Math.max(item.quantidadeItens, 1)) * 100)}%`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Turno</TableCell>
                <TableCell>Frota</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Defeito</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>O.S.</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDefects.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.data}</TableCell>
                  <TableCell>{item.hora}</TableCell>
                  <TableCell>{item.turno}</TableCell>
                  <TableCell>{item.frota}</TableCell>
                  <TableCell>{item.categoria}</TableCell>
                  <TableCell>{item.item}</TableCell>
                  <TableCell>{item.descricaoDefeito}</TableCell>
                  <TableCell>{item.prioridade}</TableCell>
                  <TableCell>{item.numeroOSGATEC ?? '—'}</TableCell>
                  <TableCell>{item.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  )
}
