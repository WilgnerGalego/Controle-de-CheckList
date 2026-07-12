import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { seedFirestoreBaseData } from '../services/seedService'
import { PageHeader } from '../components/PageHeader'

export function DatabaseSetupPage() {
  const [status, setStatus] = useState('Aguardando inicialização')

  const handleSeed = async () => {
    try {
      await seedFirestoreBaseData()
      setStatus('Dados iniciais carregados no Firestore.')
    } catch (error) {
      setStatus(`Erro ao carregar dados: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <Box>
      <PageHeader title="Banco de Dados" description="Inicialização da estrutura Firestore para equipamentos, categorias, itens e checklists." />
      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Stack spacing={2}>
          <Typography color="text.secondary">Esta tela permite popular a estrutura base de dados sem criar regras de negócio adicionais.</Typography>
          <Button variant="contained" onClick={handleSeed}>Popular estrutura Firestore</Button>
          <Typography variant="body2" color="primary.main">{status}</Typography>
        </Stack>
      </Paper>
    </Box>
  )
}
