import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { nonConformityService } from '../services/firestore'
import { auditService } from '../services/auditService'
import type { EquipmentType, NonConformity, NonConformityStatus, ChecklistTurno } from '../types/firestore'

const statusOptions: NonConformityStatus[] = ['Pendente', 'O.S. aberta', 'Em manutenção', 'Concluída']

interface FeedbackState {
  text: string
  severity: 'success' | 'info' | 'error'
}

export function NonConformitiesPage() {
  const [records, setRecords] = useState<NonConformity[]>([])
  const [filters, setFilters] = useState({ data: '', turno: 'Todos' as ChecklistTurno | 'Todos', frota: '', tipoEquipamento: 'Todos' as EquipmentType | 'Todos', status: 'Todos' as NonConformityStatus | 'Todos', withOs: 'Todos' as 'Todos' | 'Sim' | 'Não' })
  const [selectedRecord, setSelectedRecord] = useState<NonConformity | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [gatecNumber, setGatecNumber] = useState('')
  const [status, setStatus] = useState<NonConformityStatus>('Pendente')
  const [message, setMessage] = useState<FeedbackState | null>(null)
  const [loading, setLoading] = useState(false)

  const loadRecords = async () => {
    setLoading(true)
    try {
      const items = await nonConformityService.list()
      setRecords(items)
    } catch (error) {
      setMessage({ text: `Não foi possível carregar os registros: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [])

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchesDate = !filters.data || item.data === filters.data
      const matchesTurno = filters.turno === 'Todos' || item.turno === filters.turno
      const matchesFrota = !filters.frota || item.frota.toLowerCase().includes(filters.frota.toLowerCase())
      const matchesType = filters.tipoEquipamento === 'Todos' || item.tipoEquipamento === filters.tipoEquipamento
      const matchesStatus = filters.status === 'Todos' || item.status === filters.status
      const matchesOs = filters.withOs === 'Todos' || (filters.withOs === 'Sim' ? Boolean(item.numeroOSGATEC) : !item.numeroOSGATEC)
      return matchesDate && matchesTurno && matchesFrota && matchesType && matchesStatus && matchesOs
    })
  }, [records, filters])

  const summary = useMemo(() => ({
    total: records.length,
    pendentes: records.filter((item) => item.status === 'Pendente').length,
    osAbertas: records.filter((item) => item.status === 'O.S. aberta').length,
    concluidas: records.filter((item) => item.status === 'Concluída').length,
  }), [records])

  const openEditor = (record: NonConformity) => {
    setSelectedRecord(record)
    setGatecNumber(record.numeroOSGATEC ?? '')
    setStatus(record.status)
    setDialogOpen(true)
  }

  const saveRecord = async () => {
    if (!selectedRecord) return

    if (!window.confirm('Deseja registrar a atualização desta não conformidade?')) {
      return
    }

    const nextStatus: NonConformityStatus = gatecNumber.trim() && selectedRecord.status === 'Pendente' ? 'O.S. aberta' : status
    try {
      await nonConformityService.update(selectedRecord.id!, {
        numeroOSGATEC: gatecNumber.trim() || undefined,
        status: nextStatus,
      })
      auditService.add(`Não conformidade ${selectedRecord.item} atualizada.`, 'nonconformity')
      setMessage({ text: 'Não conformidade atualizada com sucesso.', severity: 'success' })
      setDialogOpen(false)
      await loadRecords()
    } catch (error) {
      setMessage({ text: `Erro ao salvar: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' })
    }
  }

  return (
    <Box>
      <PageHeader title="Não Conformidades" description="Consulte, filtre e acompanhe todos os defeitos registrados no sistema." />
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}><Typography variant="h6">{summary.total}</Typography><Typography color="text.secondary">Total de defeitos</Typography></Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}><Typography variant="h6">{summary.pendentes}</Typography><Typography color="text.secondary">Pendentes</Typography></Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}><Typography variant="h6">{summary.osAbertas}</Typography><Typography color="text.secondary">O.S. abertas</Typography></Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}><Typography variant="h6">{summary.concluidas}</Typography><Typography color="text.secondary">Concluídas</Typography></Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField label="Data" type="date" value={filters.data} onChange={(event) => setFilters((current) => ({ ...current, data: event.target.value }))} fullWidth sx={{ '& .MuiInputBase-root': { minWidth: { xs: '100%', sm: 180 } }, '& .MuiInputBase-input': { boxSizing: 'border-box', pr: 4 } }} />
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
            <TextField label="Frota" value={filters.frota} onChange={(event) => setFilters((current) => ({ ...current, frota: event.target.value }))} fullWidth />
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
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={filters.status} label="Status" onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as NonConformityStatus | 'Todos' }))}>
                <MenuItem value="Todos">Todos</MenuItem>
                {statusOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>O.S.</InputLabel>
              <Select value={filters.withOs} label="O.S." onChange={(event) => setFilters((current) => ({ ...current, withOs: event.target.value as 'Todos' | 'Sim' | 'Não' }))}>
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Sim">Com O.S.</MenuItem>
                <MenuItem value="Não">Sem O.S.</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        {loading ? <CircularProgress sx={{ my: 2 }} /> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Turno</TableCell>
                <TableCell>Frota</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Defeito</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>O.S.</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.data}</TableCell>
                  <TableCell>{item.hora}</TableCell>
                  <TableCell>{item.turno}</TableCell>
                  <TableCell>{item.frota}</TableCell>
                  <TableCell>{item.tipoEquipamento}</TableCell>
                  <TableCell>{item.categoria}</TableCell>
                  <TableCell>{item.item}</TableCell>
                  <TableCell>{item.descricaoDefeito}</TableCell>
                  <TableCell><Chip label={item.prioridade} size="small" /></TableCell>
                  <TableCell>{item.numeroOSGATEC ?? '—'}</TableCell>
                  <TableCell><Chip label={item.status} size="small" /></TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => openEditor(item)}>Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Atualizar não conformidade</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Número da O.S. GATEC" value={gatecNumber} onChange={(event) => setGatecNumber(event.target.value)} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value as NonConformityStatus)}>
                {statusOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void saveRecord()}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
