import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthService } from '../../services/api/auth.service'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

const STRONG =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/

/**
 * Public route: user lands here from team-invite email (?token=...).
 * Sets a new password via POST /auth/reset-password (same token flow as backend invite).
 */
export function AcceptTeamInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('This link is missing a token. Use the link from your invitation email.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!STRONG.test(password)) {
      setError('Use upper & lowercase, a number, and a special character (@$!%*?&).')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await AuthService.resetPassword({ token, password })
      navigate('/auth', { replace: true, state: { inviteComplete: true } })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Could not update password. The link may have expired — ask an admin to resend your invite.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            Choose a strong password for your dashboard account. After this, sign in with your username from the
            invite and this password — not your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-destructive">
              Invalid or missing invite link. Open the link from your email, or go to{' '}
              <Link to="/auth" className="font-medium text-primary underline-offset-4 hover:underline">
                sign in
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="np">New password</Label>
                <Input
                  id="np"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="npc">Confirm password</Label>
                <Input
                  id="npc"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                8+ characters with upper, lower, number, and special (@$!%*?&)
              </p>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save password'
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/auth" className="text-primary underline-offset-4 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
