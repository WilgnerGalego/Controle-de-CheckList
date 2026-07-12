import { useState } from 'react'
import { AppBar, Box, IconButton, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const drawerWidth = 240

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} drawerWidth={drawerWidth} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          ml: { xs: 0, md: `${drawerWidth}px` },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          boxSizing: 'border-box',
          overflowX: 'auto',
        }}
      >
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: 'white',
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Gestão de Checklists Agrícolas
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: { xs: 2, md: 3 }, width: '100%', boxSizing: 'border-box' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
