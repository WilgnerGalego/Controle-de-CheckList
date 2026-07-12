import { useEffect, useMemo, useState } from 'react'
import { Box, Chip, CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { PageHeader } from '../components/PageHeader'
import { checklistService, nonConformityService } from '../services/firestore'
import type { ChecklistDoc, NonConformity } from '../types/firestore'

export function ChecklistHistoryPage() {
  const [checklists, setChecklists] = useState<ChecklistDoc[]>([])
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      try {
        const [checklistData, defectsData] = await Promise.all([checklistService.list(), nonConformityService.list()])
        setChecklists(checklistData)
        setNonConformities(defectsData)
      } finally {
        setLoading(false)
      }
    }

    void loadHistory()
  }, [])

  const summary = useMemo(() => ({
    totalChecklists: checklists.length,
    totalDefeitos: nonConformities.length,
    pendentes: nonConformities.filter((item) => item.status === 'Pendente').length,
    osAbertas: nonConformities.filter((item) => item.status === 'O.S. aberta').length,
  }), [checklists, nonConformities])

  return (
    <Box>
      <PageHeader title="Histórico de Checklists" description="Acompanhe o histórico consolidado de lançamentos e não conformidades." />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}><Typography variant="h6">{summary.totalChecklists}</Typography><Typography color="text.secondary">Checklists salvos</Typography></Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}><Typography variant="h6">{summary.totalDefeitos}</Typography><Typography color="text.secondary">Não conformidades</Typography></Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}><Typography variant="h6">{summary.pendentes}</Typography><Typography color="text.secondary">Pendentes</Typography></Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}><Typography variant="h6">{summary.osAbertas}</Typography><Typography color="text.secondary">O.S. abertas</Typography></Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3, overflowX: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Checklists finalizados</Typography>
        {loading ? <CircularProgress /> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Turno</TableCell>
                <TableCell>Frota</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Itens</TableCell>
                <TableCell>Conformes</TableCell>
                <TableCell>Não conformes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checklists.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.data}</TableCell>
                  <TableCell>{item.hora}</TableCell>
                  <TableCell>{item.turno}</TableCell>
                  <TableCell>{item.frota}</TableCell>
                  <TableCell>{item.tipoEquipamento}</TableCell>
                  <TableCell><Chip label={item.status} size="small" /></TableCell>
                  <TableCell>{item.quantidadeItens}</TableCell>
                  <TableCell>{item.quantidadeConformes}</TableCell>
                  <TableCell>{item.quantidadeNaoConformes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Histórico de não conformidades</Typography>
        {loading ? <CircularProgress /> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
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
              {nonConformities.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.data}</TableCell>
                  <TableCell>{item.frota}</TableCell>
                  <TableCell>{item.categoria}</TableCell>
                  <TableCell>{item.item}</TableCell>
                  <TableCell>{item.descricaoDefeito}</TableCell>
                  <TableCell><Chip label={item.prioridade} size="small" /></TableCell>
                  <TableCell>{item.numeroOSGATEC ?? '—'}</TableCell>
                  <TableCell><Chip label={item.status} size="small" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  )
}
