import { useMemo, useState } from 'react'
import { Box, Button, Chip, Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import { PageHeader } from '../components/PageHeader'
import { frenteServicoService } from '../services/frenteServicoService'

export function FrentesServicoPage() {
  const [frentes, setFrentes] = useState<string[]>(() => frenteServicoService.list())
  const [novaFrente, setNovaFrente] = useState('')
  const [mensagem, setMensagem] = useState('')

  const sortedFrentes = useMemo(() => [...frentes].sort(), [frentes])

  const cadastrarFrente = () => {
    const nextValue = novaFrente.trim().toUpperCase()
    if (!nextValue) {
      setMensagem('Informe um número para a frente de serviço.')
      return
    }

    const nextFrentes = frenteServicoService.add(nextValue)
    setFrentes(nextFrentes)
    setNovaFrente('')
    setMensagem(`Frente de serviço ${nextValue} cadastrada com sucesso.`)
  }

  return (
    <Box>
      <PageHeader title="Frentes de Serviço" description="Cadastre e gerencie as frentes de serviço disponíveis no sistema." />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Adicionar nova frente</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField label="Número da frente" value={novaFrente} onChange={(event) => setNovaFrente(event.target.value)} fullWidth />
          <Button variant="contained" onClick={cadastrarFrente}>Cadastrar</Button>
        </Stack>
        {mensagem && <Typography color="primary.main" sx={{ mt: 2 }}>{mensagem}</Typography>}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Frentes cadastradas</Typography>
        <Grid container spacing={2}>
          {sortedFrentes.map((frente) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={frente}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Chip label={frente} color="primary" />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  )
}
