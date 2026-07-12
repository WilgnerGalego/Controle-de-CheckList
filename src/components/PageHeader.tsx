import { Box, Button, Stack, Typography } from '@mui/material'
import { Add } from '@mui/icons-material'

interface PageHeaderProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function PageHeader({ title, description, actionLabel, onAction }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
          <Typography variant="body1" color="text.secondary">{description}</Typography>
        </Box>
        {actionLabel && (
          <Button variant="contained" startIcon={<Add />} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  )
}
