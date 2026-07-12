import { Box, Typography, Paper } from '@mui/material'

export function NotFoundPage() {
  return (
    <Box>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 1 }}>Página em construção</Typography>
        <Typography color="text.secondary">A rota solicitada ainda não possui conteúdo definido nesta etapa.</Typography>
      </Paper>
    </Box>
  )
}
