import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { equipmentService } from '../services/firestore'
import type { Equipment, EquipmentStatus, EquipmentType } from '../types/firestore'

const emptyForm = {
  frota: '',
  tipoEquipamento: 'Trator' as EquipmentType,
  status: 'Ativo' as EquipmentStatus,
}

export function EquipmentsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'Todos' | EquipmentType>('Todos')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadEquipment = async () => {
    setLoading(true)
    try {
      const items = await equipmentService.list()
      setEquipments(items)
    } catch (error) {
      setMessage(`Não foi possível carregar os equipamentos: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEquipment()
  }, [])

  const filteredEquipments = useMemo(() => {
    return equipments.filter((item) => {
      const matchesSearch = item.frota.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'Todos' || item.tipoEquipamento === typeFilter
      return matchesSearch && matchesType
    })
  }, [equipments, search, typeFilter])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const frota = form.frota.trim()

    if (!frota) {
      setMessage('Informe a frota do equipamento.')
      return
    }

    const duplicated = equipments.some((item) => item.id !== editingId && item.frota.trim().toLowerCase() === frota.toLowerCase())
    if (duplicated) {
      setMessage('Já existe um equipamento com essa frota.')
      return
    }

    try {
      if (editingId) {
        await equipmentService.update(editingId, { frota, tipoEquipamento: form.tipoEquipamento, status: form.status })
        setMessage('Equipamento atualizado com sucesso.')
      } else {
        await equipmentService.create({ frota, tipoEquipamento: form.tipoEquipamento, status: form.status })
        setMessage('Equipamento cadastrado com sucesso.')
      }

      setForm(emptyForm)
      setEditingId(null)
      await loadEquipment()
    } catch (error) {
      setMessage(`Erro ao salvar equipamento: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleEdit = (item: Equipment) => {
    setEditingId(item.id ?? null)
    setForm({
      frota: item.frota,
      tipoEquipamento: item.tipoEquipamento,
      status: item.status,
    })
    setMessage(null)
  }

  const handleToggleStatus = async (item: Equipment) => {
    const nextStatus: EquipmentStatus = item.status === 'Ativo' ? 'Inativo' : 'Ativo'
    try {
      await equipmentService.update(item.id!, { status: nextStatus })
      setMessage(`Status alterado para ${nextStatus}.`)
      await loadEquipment()
    } catch (error) {
      setMessage(`Erro ao alterar status: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <Box>
      <PageHeader
        title="Equipamentos"
        description="Cadastre e gerencie as frotas de tratores e colhedoras utilizadas nos checklists."
        actionLabel="Novo Equipamento"
        onAction={() => {
          setEditingId(null)
          setForm(emptyForm)
          setMessage(null)
        }}
      />

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{editingId ? 'Editar equipamento' : 'Adicionar equipamento'}</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Frota"
                  value={form.frota}
                  onChange={(event) => setForm((current) => ({ ...current, frota: event.target.value }))}
                  required
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Tipo do equipamento</InputLabel>
                  <Select
                    value={form.tipoEquipamento}
                    label="Tipo do equipamento"
                    onChange={(event) => setForm((current) => ({ ...current, tipoEquipamento: event.target.value as EquipmentType }))}
                  >
                    <MenuItem value="Colhedora">Colhedora</MenuItem>
                    <MenuItem value="Trator">Trator</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={form.status}
                    label="Status"
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as EquipmentStatus }))}
                  >
                    <MenuItem value="Ativo">Ativo</MenuItem>
                    <MenuItem value="Inativo">Inativo</MenuItem>
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">{editingId ? 'Salvar' : 'Cadastrar'}</Button>
                  {editingId && (
                    <Button variant="outlined" onClick={() => { setEditingId(null); setForm(emptyForm) }}>
                      Cancelar
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Pesquisar frota"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                fullWidth
              />
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Filtrar por tipo</InputLabel>
                <Select
                  value={typeFilter}
                  label="Filtrar por tipo"
                  onChange={(event) => setTypeFilter(event.target.value as 'Todos' | EquipmentType)}
                >
                  <MenuItem value="Todos">Todos</MenuItem>
                  <MenuItem value="Colhedora">Colhedora</MenuItem>
                  <MenuItem value="Trator">Trator</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Frota</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4}>Carregando equipamentos…</TableCell>
                  </TableRow>
                ) : filteredEquipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>Nenhum equipamento encontrado.</TableCell>
                  </TableRow>
                ) : (
                  filteredEquipments.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.frota}</TableCell>
                      <TableCell>{item.tipoEquipamento}</TableCell>
                      <TableCell>
                        <Chip label={item.status} color={item.status === 'Ativo' ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => handleEdit(item)}>
                            Editar
                          </Button>
                          <Button size="small" variant="text" onClick={() => void handleToggleStatus(item)}>
                            {item.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
