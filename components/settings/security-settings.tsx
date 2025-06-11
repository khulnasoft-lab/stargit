"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Shield, Key, Smartphone, AlertTriangle, Eye, EyeOff, Clock, MapPin } from "lucide-react"

interface SecuritySession {
  id: string
  device: string
  location: string
  ip_address: string
  last_active: string
  is_current: boolean
  user_agent: string
}

interface LoginAttempt {
  id: string
  ip_address: string
  location: string
  timestamp: string
  success: boolean
  user_agent: string
}

export function SecuritySettings() {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isEnabling2FA, setIsEnabling2FA] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [show2FADialog, setShow2FADialog] = useState(false)

  const [sessions] = useState<SecuritySession[]>([
    {
      id: "1",
      device: "Chrome on macOS",
      location: "San Francisco, CA",
      ip_address: "192.168.1.100",
      last_active: "2024-01-20T14:22:00Z",
      is_current: true,
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    {
      id: "2",
      device: "Firefox on Windows",
      location: "New York, NY",
      ip_address: "10.0.0.50",
      last_active: "2024-01-19T09:15:00Z",
      is_current: false,
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
    },
  ])

  const [loginAttempts] = useState<LoginAttempt[]>([
    {
      id: "1",
      ip_address: "192.168.1.100",
      location: "San Francisco, CA",
      timestamp: "2024-01-20T14:22:00Z",
      success: true,
      user_agent: "Chrome on macOS",
    },
    {
      id: "2",
      ip_address: "203.0.113.1",
      location: "Unknown",
      timestamp: "2024-01-20T10:30:00Z",
      success: false,
      user_agent: "Unknown",
    },
    {
      id: "3",
      ip_address: "10.0.0.50",
      location: "New York, NY",
      timestamp: "2024-01-19T09:15:00Z",
      success: true,
      user_agent: "Firefox on Windows",
    },
  ])

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleEnable2FA = async () => {
    setIsEnabling2FA(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate backup codes
      const codes = Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 8).toUpperCase())
      setBackupCodes(codes)
      setTwoFactorEnabled(true)

      toast({
        title: "Two-factor authentication enabled",
        description: "Your account is now more secure with 2FA.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable 2FA. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEnabling2FA(false)
      setShow2FADialog(false)
    }
  }

  const handleDisable2FA = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setTwoFactorEnabled(false)
      setBackupCodes([])

      toast({
        title: "Two-factor authentication disabled",
        description: "2FA has been disabled for your account.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable 2FA. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast({
        title: "Session revoked",
        description: "The session has been successfully revoked.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke session. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={handleChangePassword} disabled={isChangingPassword}>
            {isChangingPassword ? "Changing Password..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account with 2FA.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Two-Factor Authentication</span>
                <Badge variant={twoFactorEnabled ? "secondary" : "outline"}>
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled
                  ? "Your account is protected with 2FA"
                  : "Secure your account with an authenticator app"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {twoFactorEnabled ? (
                <Button variant="outline" onClick={handleDisable2FA}>
                  Disable 2FA
                </Button>
              ) : (
                <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
                  <DialogTrigger asChild>
                    <Button>Enable 2FA</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                      <DialogDescription>Scan the QR code with your authenticator app to set up 2FA.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-muted-foreground">QR Code Placeholder</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Manual Entry Key</Label>
                        <Input value="JBSWY3DPEHPK3PXP" readOnly className="font-mono text-sm" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verification-code">Verification Code</Label>
                        <Input id="verification-code" placeholder="Enter 6-digit code from your app" maxLength={6} />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShow2FADialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEnable2FA} disabled={isEnabling2FA}>
                        {isEnabling2FA ? "Enabling..." : "Enable 2FA"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {twoFactorEnabled && backupCodes.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4" />
                Backup Codes
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Save these backup codes in a safe place. You can use them to access your account if you lose your
                authenticator device.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>Manage your active sessions across different devices and locations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{session.device}</span>
                    {session.is_current && <Badge variant="secondary">Current Session</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(session.last_active)}
                    </span>
                    <span>{session.ip_address}</span>
                  </div>
                </div>
                {!session.is_current && (
                  <Button variant="outline" size="sm" onClick={() => handleRevokeSession(session.id)}>
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Login Attempts</CardTitle>
          <CardDescription>Monitor recent login attempts to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loginAttempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={attempt.success ? "secondary" : "destructive"}>
                      {attempt.success ? "Success" : "Failed"}
                    </Badge>
                    <span className="text-sm">{attempt.user_agent}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {attempt.location}
                    </span>
                    <span>{attempt.ip_address}</span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{formatDate(attempt.timestamp)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
