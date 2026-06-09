import { Stack } from 'expo-router'
import { AppShell } from '@neomovies/ui'
import '../global.css'
import '../assets/neo-ui.css'

export default function RootLayout() {
  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  )
}
