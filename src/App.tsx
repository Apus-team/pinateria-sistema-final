import { ThemeProvider } from './hooks/useTheme.tsx'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}
