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
import { frenteServicoService } from '../services/frenteServicoService'
import { auditService } from '../services/auditService'
import type { ChecklistDoc, ChecklistResponse, ChecklistResponseResult, ChecklistTurno, Equipment, ItemChecklist, NonConformity, NonConformityPriority, NonConformityStatus } from '../types/firestore'

interface ChecklistItemWithResponse extends ItemChecklist {
  response: ChecklistResponseResult
  defectDescription?: string
  defectObservation?: string
  defectOsNumber?: string
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

const buildWhatsAppReport = (checklist: ChecklistDoc, equipment: Equipment | null, items: ChecklistItemWithResponse[], defects: ChecklistItemWithResponse[]) => {
  const totalItens = items.length
  const conformes = items.filter((item) => item.response === 'Conforme').length
  const naoConformes = items.filter((item) => item.response === 'Não Conforme').length
  const percentual = totalItens > 0 ? Math.round((conformes / totalItens) * 100) : 0
  const statusGeral = naoConformes > 0 ? '🟡 Equipamento com Pendências' : '🟢 Equipamento Aprovado'

  const defectLines = defects.length > 0
    ? defects.map((item) => [
        '━━━━━━━━━━━━━━━━━━━━━━',
        `📂 Categoria: ${item.categoria}`,
        `🔍 Item: ${item.descricao}`,
        `📝 Defeito: ${item.defectDescription ?? '—'}`,
        `🔥 Prioridade: ${item.defectPriority ?? 'Média'}`,
        `📄 O.S. GATEC: ${item.defectOsNumber ?? '—'}`,
        `📌 Status: Pendente`,
        '',
      ].join('\n')).join('\n')
    : '✅ Equipamento inspecionado sem não conformidades.\n'

  return [
    '━━━━━━━━━━━━━━━━━━━━━━',
    '📋 RELATÓRIO DE CHECKLIST',
    '',
    `📅 Data: ${checklist.data}`,
    `🕒 Hora: ${checklist.hora || '—'}`,
    `👷 Turno: ${checklist.turno}`,
    `🚜 Frota: ${checklist.frota}`,
    `🔧 Tipo do Equipamento: ${equipment?.tipoEquipamento ?? '—'}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '📊 RESUMO DA INSPEÇÃO',
    '',
    `✅ Total de Itens: ${totalItens}`,
    `✔️ Conforme: ${conformes}`,
    `❌ Não Conforme: ${naoConformes}`,
    `📈 Percentual de Conformidade: ${percentual}%`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '⚠️ NÃO CONFORMIDADES',
    '',
    defectLines,
    '━━━━━━━━━━━━━━━━━━━━━━',
    '📌 RESUMO FINAL',
    '',
    `Total de Defeitos: ${defects.length}`,
    `Status Geral: ${statusGeral}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    'Checklist registrado no sistema em:',
    '',
    `📅 Data: ${checklist.data}`,
    `🕒 Hora: ${checklist.hora || '—'}`,
    '',
  ].join('\n')
}

export function NewChecklistPage() {
  const [header, setHeader] = useState(emptyHeader)
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [items, setItems] = useState<ChecklistItemWithResponse[]>([])
  const [selectedItem, setSelectedItem] = useState<ChecklistItemWithResponse | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [defectForm, setDefectForm] = useState({ descricaoDefeito: '', observacao: '', numeroOSGATEC: '', prioridade: 'Média' as NonConformityPriority })
  const [message, setMessage] = useState<FeedbackState | null>(null)
  const [loadingItems, setLoadingItems] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [frentesServico, setFrentesServico] = useState<string[]>([])
  const [novaFrente, setNovaFrente] = useState('')
  const [reportText, setReportText] = useState('')
  const [reportDialogOpen, setReportDialogOpen] = useState(false)

  useEffect(() => {
    const defaultFrentes = frenteServicoService.list()
    setFrentesServico(defaultFrentes)

    void equipmentService.listActive().then((loadedEquipments) => {
      const fallbackEquipments = defaultFrentes.map((frente, index) => ({
        id: frente,
        frota: frente,
        tipoEquipamento: index % 2 === 0 ? 'Trator' : 'Colhedora' as Equipment['tipoEquipamento'],
        status: 'Ativo' as Equipment['status'],
      }))

      const mergedEquipments = [
        ...loadedEquipments,
        ...fallbackEquipments.filter((item) => !loadedEquipments.some((equipment) => equipment.frota === item.frota)),
      ]

      setEquipments(mergedEquipments)
    })
  }, [])

  useEffect(() => {
    const selected = equipments.find((item) => item.frota === header.frota)
    const activeEquipment = selected ?? null
    setSelectedEquipment(activeEquipment)

    if (!activeEquipment) {
      setItems([])
      return
    }

    setLoadingItems(true)
    void itemChecklistService.listByEquipment(activeEquipment.tipoEquipamento).then((loadedItems) => {
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
    setDefectForm({ descricaoDefeito: item.defectDescription ?? '', observacao: item.defectObservation ?? '', numeroOSGATEC: item.defectOsNumber ?? '', prioridade: item.defectPriority ?? 'Média' })
    setDialogOpen(true)
  }

  const saveDefect = async () => {
    if (!selectedItem || !defectForm.descricaoDefeito.trim()) {
      setMessage({ text: 'Descreva o defeito antes de salvar.', severity: 'error' })
      return
    }

    setItems((current) => current.map((item) => item.id === selectedItem.id ? { ...item, response: 'Não Conforme', defectDescription: defectForm.descricaoDefeito.trim(), defectObservation: defectForm.observacao.trim(), defectOsNumber: defectForm.numeroOSGATEC.trim(), defectPriority: defectForm.prioridade } : item))
    setDialogOpen(false)
    setSelectedItem(null)
    setMessage({ text: 'Item marcado como não conforme.', severity: 'success' })
  }

  const markAsConforme = (itemId: string) => {
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, response: 'Conforme', defectDescription: undefined, defectObservation: undefined, defectOsNumber: undefined, defectPriority: undefined } : item))
  }

  const copyReport = async () => {
    if (!reportText) {
      return
    }

    try {
      await navigator.clipboard.writeText(reportText)
      setMessage({ text: '✅ Relatório copiado com sucesso! Basta abrir o WhatsApp e colar.', severity: 'success' })
    } catch {
      setMessage({ text: 'Não foi possível copiar o relatório. Tente novamente.', severity: 'error' })
    }
  }

  const handleFinish = async () => {
    if (!header.data || !header.turno || !header.frota) {
      setMessage({ text: 'Preencha data, turno e frota para finalizar o checklist.', severity: 'error' })
      return
    }

    if (!selectedEquipment) {
      setMessage({ text: 'Selecione uma frota com equipamento cadastrado para iniciar o checklist.', severity: 'error' })
      return
    }

    if (!window.confirm('Confirma o salvamento deste checklist com os itens marcados?')) {
      return
    }

    setSubmitting(true)
    try {
      const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const checklistPayload: ChecklistDoc = {
        data: header.data,
        hora: header.hora || horaAtual,
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

      const defectItems = items.filter((item) => item.response === 'Não Conforme')
      const defects: NonConformity[] = defectItems.map((item) => ({
        checklistId,
        data: header.data,
        hora: checklistPayload.hora,
        turno: header.turno as ChecklistTurno,
        frota: header.frota,
        tipoEquipamento: selectedEquipment.tipoEquipamento,
        categoria: item.categoria,
        item: item.descricao,
        descricaoDefeito: item.defectDescription ?? '',
        prioridade: item.defectPriority ?? 'Média',
        numeroOSGATEC: item.defectOsNumber?.trim() || undefined,
        status: 'Pendente' as NonConformityStatus,
      }))

      await Promise.all(defects.map((defect) => nonConformityService.create(defect)))
      setFrentesServico(frenteServicoService.add(header.frota))
      auditService.add(`Checklist salvo para ${header.frota}.`, 'checklist')
      const generatedReport = buildWhatsAppReport(checklistPayload, selectedEquipment, items, defectItems)
      setReportText(generatedReport)
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
            <TextField className="date-input-field" label="Data" type="date" value={header.data} onChange={(event) => setHeader((current) => ({ ...current, data: event.target.value }))} fullWidth required slotProps={{ inputLabel: { shrink: true } }} />
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
              <InputLabel>Frente de Serviço</InputLabel>
              <Select value={header.frota} label="Frente de Serviço" onChange={(event) => setHeader((current) => ({ ...current, frota: event.target.value }))}>
                {frentesServico.map((item) => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <TextField label="Nova frente de serviço" value={novaFrente} onChange={(event) => setNovaFrente(event.target.value)} size="small" />
          <Button variant="outlined" onClick={() => {
            const nextValue = novaFrente.trim().toUpperCase()
            if (!nextValue) {
              setMessage({ text: 'Informe um número para a frente de serviço.', severity: 'error' })
              return
            }
            setFrentesServico(frenteServicoService.add(nextValue))
            setHeader((current) => ({ ...current, frota: nextValue }))
            setNovaFrente('')
            setMessage({ text: `Frente de serviço ${nextValue} cadastrada.`, severity: 'success' })
          }}>
            Cadastrar frente
          </Button>
        </Stack>
      </Paper>

      {selectedEquipment && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}>
            <Box>
              <Typography variant="h6">{header.frota || selectedEquipment.frota}</Typography>
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

      {reportText && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => setReportDialogOpen(true)}>
            📄 Visualizar Relatório
          </Button>
          <Button variant="outlined" color="primary" onClick={() => void copyReport()}>
            📋 Copiar Relatório
          </Button>
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar defeito</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Descrição do defeito" value={defectForm.descricaoDefeito} onChange={(event) => setDefectForm((current) => ({ ...current, descricaoDefeito: event.target.value }))} multiline minRows={2} required />
            <TextField label="Observação" value={defectForm.observacao} onChange={(event) => setDefectForm((current) => ({ ...current, observacao: event.target.value }))} multiline minRows={2} />
            <TextField label="Número da O.S. GATEC" value={defectForm.numeroOSGATEC} onChange={(event) => setDefectForm((current) => ({ ...current, numeroOSGATEC: event.target.value }))} fullWidth />
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

      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Relatório para WhatsApp</DialogTitle>
        <DialogContent>
          <TextField
            value={reportText}
            onChange={(event) => setReportText(event.target.value)}
            multiline
            minRows={16}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Fechar</Button>
          <Button variant="contained" onClick={() => void copyReport()}>Copiar relatório</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
