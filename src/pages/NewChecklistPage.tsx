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
  TextField,
  Typography,
} from '@mui/material'
import { PageHeader } from '../components/PageHeader'
import { checklistResponseService, checklistService, equipmentService, itemChecklistService, nonConformityService } from '../services/firestore'
import { auditService } from '../services/auditService'
import type { ChecklistDoc, ChecklistResponse, ChecklistResponseResult, ChecklistTurno, Equipment, ItemChecklist, NonConformity, NonConformityPriority, NonConformityStatus } from '../types/firestore'

interface ChecklistItemWithResponse extends ItemChecklist {
  response: ChecklistResponseResult
  defectDescription?: string
  defectObservation?: string
  defectPriority?: NonConformityPriority
}

interface FeedbackState {
  text: string
  severity: 'success' | 'info' | 'error'
}

const emptyHeader = {
  data: '',
  hora: '',
  turno: '' as ChecklistTurno | '',
  frota: '',
}

export function NewChecklistPage() {
  const [header, setHeader] = useState(emptyHeader)
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [items, setItems] = useState<ChecklistItemWithResponse[]>([])
  const [selectedItem, setSelectedItem] = useState<ChecklistItemWithResponse | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [defectForm, setDefectForm] = useState({ descricaoDefeito: '', observacao: '', prioridade: 'Média' as NonConformityPriority })
  const [message, setMessage] = useState<FeedbackState | null>(null)
  const [loadingItems, setLoadingItems] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void equipmentService.listActive().then(setEquipments)
  }, [])

  useEffect(() => {
    const selected = equipments.find((item) => item.frota === header.frota)
    setSelectedEquipment(selected ?? null)
    if (!selected) {
      setItems([])
      return
    }

    setLoadingItems(true)
    void itemChecklistService.listByEquipment(selected.tipoEquipamento).then((loadedItems) => {
      const mapped = loadedItems.filter((item) => item.ativo).map((item) => ({ ...item, response: 'Conforme' as ChecklistResponseResult }))
      setItems(mapped)
    }).finally(() => setLoadingItems(false))
  }, [equipments, header.frota])

  const groupedItems = useMemo(() => {
    const groups = new Map<string, ChecklistItemWithResponse[]>()
    items.forEach((item) => {
      const current = groups.get(item.categoria) ?? []
      current.push(item)
      groups.set(item.categoria, current)
    })
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  const conformes = items.filter((item) => item.response === 'Conforme').length
  const naoConformes = items.filter((item) => item.response === 'Não Conforme').length

  const openDefectDialog = (item: ChecklistItemWithResponse) => {
    setSelectedItem(item)
    setDefectForm({ descricaoDefeito: item.defectDescription ?? '', observacao: item.defectObservation ?? '', prioridade: item.defectPriority ?? 'Média' })
    setDialogOpen(true)
  }

  const saveDefect = async () => {
    if (!selectedItem || !defectForm.descricaoDefeito.trim()) {
      setMessage({ text: 'Descreva o defeito antes de salvar.', severity: 'error' })
      return
    }

    setItems((current) => current.map((item) => item.id === selectedItem.id ? { ...item, response: 'Não Conforme', defectDescription: defectForm.descricaoDefeito.trim(), defectObservation: defectForm.observacao.trim(), defectPriority: defectForm.prioridade } : item))
    setDialogOpen(false)
    setSelectedItem(null)
    setMessage({ text: 'Item marcado como não conforme.', severity: 'success' })
  }

  const markAsConforme = (itemId: string) => {
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, response: 'Conforme', defectDescription: undefined, defectObservation: undefined, defectPriority: undefined } : item))
  }

  const handleFinish = async () => {
    if (!selectedEquipment) {
      setMessage({ text: 'Selecione uma frota antes de finalizar.', severity: 'error' })
      return
    }

    if (!header.data || !header.hora || !header.turno || !header.frota) {
      setMessage({ text: 'Preencha data, hora, turno e frota para finalizar o checklist.', severity: 'error' })
      return
    }

    if (!window.confirm('Confirma o salvamento deste checklist com os itens marcados?')) {
      return
    }

    setSubmitting(true)
    try {
      const checklistPayload: ChecklistDoc = {
        data: header.data,
        hora: header.hora,
        turno: header.turno as ChecklistTurno,
        frota: header.frota,
        tipoEquipamento: selectedEquipment.tipoEquipamento,
        quantidadeItens: items.length,
        quantidadeConformes: conformes,
        quantidadeNaoConformes: naoConformes,
        status: 'Finalizado',
      }

      const checklistId = await checklistService.create(checklistPayload)

      const responses: ChecklistResponse[] = items.map((item) => ({
        checklistId,
        itemId: item.id ?? '',
        categoria: item.categoria,
        item: item.descricao,
        resultado: item.response,
        observacao: item.response === 'Não Conforme' ? item.defectObservation ?? '' : '',
      }))

      await Promise.all(responses.map((response) => checklistResponseService.create(response)))

      const defects: NonConformity[] = items.filter((item) => item.response === 'Não Conforme').map((item) => ({
        checklistId,
        data: header.data,
        hora: header.hora,
        turno: header.turno as ChecklistTurno,
        frota: header.frota,
        tipoEquipamento: selectedEquipment.tipoEquipamento,
        categoria: item.categoria,
        item: item.descricao,
        descricaoDefeito: item.defectDescription ?? '',
        prioridade: item.defectPriority ?? 'Média',
        status: 'Pendente' as NonConformityStatus,
      }))

      await Promise.all(defects.map((defect) => nonConformityService.create(defect)))
      auditService.add(`Checklist salvo para ${header.frota}.`, 'checklist')
      setMessage({ text: `Checklist finalizado com ${naoConformes} item(ns) não conforme(s).`, severity: 'success' })
      setHeader(emptyHeader)
      setSelectedEquipment(null)
      setItems([])
    } catch (error) {
      setMessage({ text: `Erro ao finalizar checklist: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      <PageHeader title="Novo Checklist" description="Lançamento rápido por exceção, marcando apenas os itens com problema." />
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Data" type="date" value={header.data} onChange={(event) => setHeader((current) => ({ ...current, data: event.target.value }))} fullWidth required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Hora" type="time" value={header.hora} onChange={(event) => setHeader((current) => ({ ...current, hora: event.target.value }))} fullWidth required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth required>
              <InputLabel>Turno</InputLabel>
              <Select value={header.turno} label="Turno" onChange={(event) => setHeader((current) => ({ ...current, turno: event.target.value as ChecklistTurno }))}>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth required>
              <InputLabel>Frota</InputLabel>
              <Select value={header.frota} label="Frota" onChange={(event) => setHeader((current) => ({ ...current, frota: event.target.value }))}>
                {equipments.map((item) => (
                  <MenuItem key={item.id} value={item.frota}>{item.frota}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {selectedEquipment && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}>
            <Box>
              <Typography variant="h6">{selectedEquipment.frota}</Typography>
              <Typography color="text.secondary">{selectedEquipment.tipoEquipamento}</Typography>
            </Box>
            <Chip label={`${conformes}/${items.length} itens conforme`} color="success" />
            <Chip label={`${naoConformes} item(ns) com problema`} color="error" />
          </Stack>
        </Paper>
      )}

      {loadingItems ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box> : null}

      {selectedEquipment && groupedItems.length > 0 && (
        <Stack spacing={3}>
          {groupedItems.map(([category, categoryItems]) => (
            <Paper key={category} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{category}</Typography>
              <Stack spacing={1.5}>
                {categoryItems.map((item) => (
                  <Box key={item.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
                      <Typography>{item.descricao}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Button variant={item.response === 'Conforme' ? 'contained' : 'outlined'} color="success" onClick={() => markAsConforme(item.id!)}>
                          ✅ Conforme
                        </Button>
                        <Button variant={item.response === 'Não Conforme' ? 'contained' : 'outlined'} color="error" onClick={() => openDefectDialog(item)}>
                          ❌ Não Conforme
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {selectedEquipment && (
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" size="large" disabled={submitting} onClick={() => void handleFinish()}>
            {submitting ? 'Salvando…' : 'Finalizar Checklist'}
          </Button>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar defeito</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Descrição do defeito" value={defectForm.descricaoDefeito} onChange={(event) => setDefectForm((current) => ({ ...current, descricaoDefeito: event.target.value }))} multiline minRows={2} required />
            <TextField label="Observação" value={defectForm.observacao} onChange={(event) => setDefectForm((current) => ({ ...current, observacao: event.target.value }))} multiline minRows={2} />
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select value={defectForm.prioridade} label="Prioridade" onChange={(event) => setDefectForm((current) => ({ ...current, prioridade: event.target.value as NonConformityPriority }))}>
                <MenuItem value="Baixa">Baixa</MenuItem>
                <MenuItem value="Média">Média</MenuItem>
                <MenuItem value="Alta">Alta</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => void saveDefect()}>Salvar defeito</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
