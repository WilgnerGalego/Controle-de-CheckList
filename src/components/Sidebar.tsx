import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Box } from '@mui/material'
import { Dashboard, Build, FactCheck, History, ReportProblem, Assessment, Settings, Storage, Groups } from '@mui/icons-material'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', path: '/', icon: Dashboard },
  { label: 'Equipamentos', path: '/equipamentos', icon: Build },
  { label: 'Novo Checklist', path: '/novo-checklist', icon: FactCheck },
  { label: 'Histórico', path: '/historico', icon: History },
  { label: 'Não Conformidades', path: '/nao-conformidades', icon: ReportProblem },
  { label: 'Relatórios', path: '/relatorios', icon: Assessment },
  { label: 'Frentes de Serviço', path: '/frentes-servico', icon: Groups },
  { label: 'Configurações', path: '/configuracoes', icon: Settings },
  { label: 'Banco de Dados', path: '/database', icon: Storage },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
  drawerWidth: number
}

export function Sidebar({ mobileOpen, onClose, drawerWidth }: SidebarProps) {
  const location = useLocation()

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Checklist Agrícola
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => {
          const Icon = item.icon
          const selected = location.pathname === item.path
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={selected}
              onClick={onClose}
            >
              <ListItemIcon><Icon color={selected ? 'primary' : 'inherit'} /></ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  )
}
