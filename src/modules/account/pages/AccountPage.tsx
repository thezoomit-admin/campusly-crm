import { accountForm, adminBanner, adminCard, adminForm, adminPage } from '../../../styles/admin'
import { useState, type FormEvent } from 'react'
import { PrimaryButton } from '@/components/ui'
import { FormInput } from '@/components/common/Forms'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useChangePasswordMutation } from '../../../redux/features/auth/authApi'

export default function AccountPage() {
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    try {
      const data = await changePassword({ currentPassword, newPassword }).unwrap()
      setMessage(data?.message || 'Password updated.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (error) {
      const err = error as { data?: { error?: string } }
      setMessage(err?.data?.error || 'Unable to update password.')
    }
  }

  return (
    <div className={`${adminPage}`}>
      <PageMeta
        title="Change Password"
        description="Update your EduConsult CRM password. Credentials are stored securely and never in plain text."
      />
      <PageHeader
        title="Password"
        subtitle="Set or change your password. Passwords are stored hashed, never as plain text."
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Profile', path: '/profile' },
          { title: 'Password' },
        ]}
      />
      <form className={`${adminCard} ${adminForm} ${accountForm}`} onSubmit={handleSubmit}>
        <label>
          Current password
          <FormInput.Password
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>
        <label>
          New password
          <FormInput.Password
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>
        {message ? <p className={`${adminBanner}`}>{message}</p> : null}
        <PrimaryButton type="submit" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Change password'}
        </PrimaryButton>
      </form>
    </div>
  )
}
