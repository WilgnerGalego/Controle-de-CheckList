import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { categoryChecklistService, itemChecklistService } from '../services/firestore'
import { auditService } from '../services/auditService'
import { defaultSystemSettings, systemSettingsService } from '../services/systemSettings'
import type { CategoryChecklist, EquipmentType, ItemChecklist, NonConformityPriority } from '../types/firestore'

interface FeedbackState {
  text: string
  severity: 'success' | 'info' | 'error'
}

const emptyCategory = { nome: '', tipoEquipamento: 'Colhedora' as EquipmentType, ordem: 1, ativo: true }
const emptyItem = { categoria: '', descricao: '', tipoEquipamento: 'Colhedora' as EquipmentType, ordem: 1, ativo: true }

export function SettingsPage() {
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('Colhedora')
  const [categories, setCategories] = useState<CategoryChecklist[]>([])
  const [items, setItems] = useState<ItemChecklist[]>([])
  const [categoryForm, setCategoryForm] = useState(emptyCategory)
  const [itemForm, setItemForm] = useState(emptyItem)
  const [message, setMessage] = useState<FeedbackState | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [systemSettings, setSystemSettings] = useState(defaultSystemSettings)
  const [priorityDraft, setPriorityDraft] = useState('')
  const [recentActivities, setRecentActivities] = useState(auditService.list())

  const loadData = async (type: EquipmentType) => {
    setLoading(true)
    try {
      const [categoryData, itemData] = await Promise.all([
        categoryChecklistService.listByEquipment(type),
        itemChecklistService.listByEquipment(type),
      ])
      setCategories(categoryData)
      setItems(itemData)
    } catch (error) {
      setMessage({ text: `Não foi possível carregar as configurações: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSystemSettings(systemSettingsService.get())
    void loadData(equipmentType)
  }, [equipmentType])

  const categoriesByType = useMemo(() => categories.filter((category) => category.tipoEquipamento === equipmentType), [categories, equipmentType])
  const itemsByType = useMemo(() => items.filter((item) => item.tipoEquipamento === equipmentType), [items, equipmentType])

  const handleSaveCategory = async () => {
    if (!categoryForm.nome.trim()) {
      setMessage({ text: 'Informe o nome da categoria.', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      if (editingCategoryId) {
        await categoryChecklistService.update(editingCategoryId, {
          nome: categoryForm.nome.trim(),
          tipoEquipamento: equipmentType,
          ordem: categoryForm.ordem,
          ativo: categoryForm.ativo,
        })
        auditService.add(`Categoria ${categoryForm.nome.trim()} atualizada.`, 'category')
        setMessage({ text: 'Categoria atualizada com sucesso.', severity: 'success' })
      } else {
        await categoryChecklistService.create({
          nome: categoryForm.nome.trim(),
          tipoEquipamento: equipmentType,
          ordem: categoryForm.ordem,
          ativo: categoryForm.ativo,
        })
        auditService.add(`Categoria ${categoryForm.nome.trim()} criada.`, 'category')
        setMessage({ text: 'Categoria criada com sucesso.', severity: 'success' })
      }
      setCategoryForm(emptyCategory)
      setEditingCategoryId(null)
      await loadData(equipmentType)
      setRecentActivities(auditService.list())
    } catch (error) {
      setMessage({ text: `Erro ao salvar categoria: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveItem = async () => {
    if (!itemForm.descricao.trim() || !itemForm.categoria.trim()) {
      setMessage({ text: 'Informe a categoria e o nome do item.', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      if (editingItemId) {
        await itemChecklistService.update(editingItemId, {
          categoria: itemForm.categoria.trim(),
          descricao: itemForm.descricao.trim(),
          tipoEquipamento: equipmentType,
          ordem: itemForm.ordem,
          ativo: itemForm.ativo,
        })
        auditService.add(`Item ${itemForm.descricao.trim()} atualizado.`, 'item')
        setMessage({ text: 'Item atualizado com sucesso.', severity: 'success' })
      } else {
        await itemChecklistService.create({
          categoria: itemForm.categoria.trim(),
          descricao: itemForm.descricao.trim(),
          tipoEquipamento: equipmentType,
          ordem: itemForm.ordem,
          ativo: itemForm.ativo,
        })
        auditService.add(`Item ${itemForm.descricao.trim()} criado.`, 'item')
        setMessage({ text: 'Item criado com sucesso.', severity: 'success' })
      }
      setItemForm(emptyItem)
      setEditingItemId(null)
      await loadData(equipmentType)
      setRecentActivities(auditService.list())
    } catch (error) {
      setMessage({ text: `Erro ao salvar item: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const toggleItemStatus = async (item: ItemChecklist) => {
    try {
      await itemChecklistService.update(item.id!, { ativo: !item.ativo })
      await loadData(equipmentType)
      setMessage({ text: 'Status do item alterado com sucesso.', severity: 'success' })
      setRecentActivities(auditService.list())
    } catch (error) {
      setMessage({ text: `Erro ao alterar status: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' })
    }
  }

  const handleDeleteCategory = async (category: CategoryChecklist) => {
    if (!window.confirm(`Excluir a categoria ${category.nome}?`)) {
      return
    }

    try {
      await categoryChecklistService.remove(category.id!)
      await loadData(equipmentType)
      auditService.add(`Categoria ${category.nome} removida.`, 'category')
      setMessage({ text: 'Categoria removida com sucesso.', severity: 'success' })
      setRecentActivities(auditService.list())
    } catch (error) {
      setMessage({ text: `Erro ao remover categoria: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' })
    }
  }

  const handleDeleteItem = async (item: ItemChecklist) => {
    if (!window.confirm(`Excluir o item ${item.descricao}?`)) {
      return
    }

    try {
      await itemChecklistService.remove(item.id!)
      await loadData(equipmentType)
      auditService.add(`Item ${item.descricao} removido.`, 'item')
      setMessage({ text: 'Item removido com sucesso.', severity: 'success' })
      setRecentActivities(auditService.list())
    } catch (error) {
      setMessage({ text: `Erro ao remover item: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' })
    }
  }

  const addPriority = () => {
    const next = priorityDraft.trim()
    if (!next) {
      setMessage({ text: 'Informe uma prioridade antes de adicionar.', severity: 'error' })
      return
    }

    if (systemSettings.priorities.includes(next as NonConformityPriority)) {
      setMessage({ text: 'Essa prioridade já existe.', severity: 'info' })
      return
    }

    const updated = [...systemSettings.priorities, next as NonConformityPriority]
    setSystemSettings((current) => ({ ...current, priorities: updated }))
    setPriorityDraft('')
    setMessage({ text: 'Prioridade adicionada localmente. Clique em salvar para persistir.', severity: 'info' })
  }

  const removePriority = (priority: NonConformityPriority) => {
    const updated = systemSettings.priorities.filter((item) => item !== priority)
    setSystemSettings((current) => ({ ...current, priorities: updated }))
  }

  const saveSystemSettings = () => {
    const persisted = systemSettingsService.save(systemSettings)
    setSystemSettings(persisted)
    auditService.add('Configurações gerais salvas.', 'settings')
    setMessage({ text: 'Configurações gerais salvas com sucesso.', severity: 'success' })
    setRecentActivities(auditService.list())
  }

  return (
    <Box>
      <PageHeader title="Configurações" description="Gerencie estruturas, prioridades e definições gerais do sistema." />
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Tipo de checklist</Typography>
            <FormControl fullWidth>
              <InputLabel>Tipo de equipamento</InputLabel>
              <Select value={equipmentType} label="Tipo de equipamento" onChange={(event) => setEquipmentType(event.target.value as EquipmentType)}>
                <MenuItem value="Colhedora">Colhedora</MenuItem>
                <MenuItem value="Trator">Trator</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{editingCategoryId ? 'Editar categoria' : 'Nova categoria'}</Typography>
            <Stack spacing={2}>
              <TextField label="Nome da categoria" value={categoryForm.nome} onChange={(event) => setCategoryForm((current) => ({ ...current, nome: event.target.value }))} fullWidth />
              <TextField label="Ordem" type="number" value={categoryForm.ordem} onChange={(event) => setCategoryForm((current) => ({ ...current, ordem: Number(event.target.value) }))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={categoryForm.ativo ? 'Ativo' : 'Inativo'} label="Status" onChange={(event) => setCategoryForm((current) => ({ ...current, ativo: event.target.value === 'Ativo' }))}>
                  <MenuItem value="Ativo">Ativo</MenuItem>
                  <MenuItem value="Inativo">Inativo</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" disabled={saving} onClick={() => void handleSaveCategory()}>{editingCategoryId ? 'Salvar categoria' : 'Adicionar categoria'}</Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{editingItemId ? 'Editar item' : 'Novo item'}</Typography>
            <Stack spacing={2}>
              <TextField label="Categoria" value={itemForm.categoria} onChange={(event) => setItemForm((current) => ({ ...current, categoria: event.target.value }))} fullWidth />
              <TextField label="Descrição do item" value={itemForm.descricao} onChange={(event) => setItemForm((current) => ({ ...current, descricao: event.target.value }))} fullWidth />
              <TextField label="Ordem" type="number" value={itemForm.ordem} onChange={(event) => setItemForm((current) => ({ ...current, ordem: Number(event.target.value) }))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={itemForm.ativo ? 'Ativo' : 'Inativo'} label="Status" onChange={(event) => setItemForm((current) => ({ ...current, ativo: event.target.value === 'Ativo' }))}>
                  <MenuItem value="Ativo">Ativo</MenuItem>
                  <MenuItem value="Inativo">Inativo</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" disabled={saving} onClick={() => void handleSaveItem()}>{editingItemId ? 'Salvar item' : 'Adicionar item'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Configurações gerais</Typography>
            <Stack spacing={2}>
              <TextField label="Nome da empresa" value={systemSettings.companyName} onChange={(event) => setSystemSettings((current) => ({ ...current, companyName: event.target.value }))} fullWidth />
              <TextField label="Responsável" value={systemSettings.responsibleName} onChange={(event) => setSystemSettings((current) => ({ ...current, responsibleName: event.target.value }))} fullWidth />
              <TextField label="Observação padrão do checklist" value={systemSettings.checklistNote} onChange={(event) => setSystemSettings((current) => ({ ...current, checklistNote: event.target.value }))} multiline minRows={2} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Prioridade padrão</InputLabel>
                <Select value={systemSettings.defaultPriority} label="Prioridade padrão" onChange={(event) => setSystemSettings((current) => ({ ...current, defaultPriority: event.target.value as NonConformityPriority }))}>
                  {systemSettings.priorities.map((priority) => <MenuItem key={priority} value={priority}>{priority}</MenuItem>)}
                </Select>
              </FormControl>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField label="Adicionar prioridade" value={priorityDraft} onChange={(event) => setPriorityDraft(event.target.value)} fullWidth />
                <Button variant="outlined" onClick={addPriority}>Adicionar</Button>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {systemSettings.priorities.map((priority) => (
                  <Chip key={priority} label={priority} onDelete={() => removePriority(priority)} color={systemSettings.defaultPriority === priority ? 'primary' : 'default'} />
                ))}
              </Stack>
              <Button variant="contained" onClick={saveSystemSettings}>Salvar configurações gerais</Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, mb: 3, overflowX: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Categorias</Typography>
            {loading ? <CircularProgress /> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Ordem</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoriesByType.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.nome}</TableCell>
                      <TableCell>{category.ordem}</TableCell>
                      <TableCell><Chip label={category.ativo ? 'Ativo' : 'Inativo'} color={category.ativo ? 'success' : 'default'} size="small" /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => { setEditingCategoryId(category.id ?? null); setCategoryForm({ nome: category.nome, tipoEquipamento: category.tipoEquipamento, ordem: category.ordem, ativo: category.ativo }) }}>
                            Editar
                          </Button>
                          <Button size="small" color="error" variant="text" onClick={() => void handleDeleteCategory(category)}>
                            Excluir
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>

          <Paper sx={{ p: 3, overflowX: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Itens de inspeção</Typography>
            {loading ? <CircularProgress /> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Ordem</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itemsByType.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.categoria}</TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>{item.ordem}</TableCell>
                      <TableCell><Chip label={item.ativo ? 'Ativo' : 'Inativo'} color={item.ativo ? 'success' : 'default'} size="small" /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => { setEditingItemId(item.id ?? null); setItemForm({ categoria: item.categoria, descricao: item.descricao, tipoEquipamento: item.tipoEquipamento, ordem: item.ordem, ativo: item.ativo }) }}>
                            Editar
                          </Button>
                          <Button size="small" variant="text" onClick={() => void toggleItemStatus(item)}>
                            {item.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button size="small" color="error" variant="text" onClick={() => void handleDeleteItem(item)}>
                            Excluir
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Atividades recentes</Typography>
            <Stack spacing={1}>
              {recentActivities.map((activity) => (
                <Box key={activity.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                  <Typography variant="body2">{activity.message}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(activity.timestamp).toLocaleString('pt-BR')}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
