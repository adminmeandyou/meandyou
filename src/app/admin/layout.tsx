import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminLayoutClient } from './AdminLayoutClient'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    return <AdminLayoutClient role="admin">{children}</AdminLayoutClient>
  }

  const { data: staff } = await supabase
    .from('staff_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  if (!staff?.role) redirect('/dashboard')

  return <AdminLayoutClient role={staff.role}>{children}</AdminLayoutClient>
}
