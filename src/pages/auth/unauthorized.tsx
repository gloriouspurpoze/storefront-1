import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, VStack, HStack } from '../../components/ui'
import {
  Lock as LockIcon,
  Home as HomeIcon,
  ArrowLeft as ArrowBackIcon,
  HelpCircle as ContactSupportIcon
} from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'

export function Unauthorized() {
  const location = useLocation()
  const navigate = useNavigate()
  const { userRole } = usePermissions()
  
  const state = location.state as {
    from?: { pathname: string }
    requiredPermissions?: string[]
    userRole?: string
  } | null

  const attemptedPath = state?.from?.pathname || 'this page'
  const requiredPermissions = state?.requiredPermissions || []
  console.log(state)

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center">
          <VStack spacing={6}>
            {/* Icon */}
            <LockIcon className="h-24 w-24 text-destructive mx-auto" />
            
            {/* Error Code */}
            <h1 className="text-6xl font-bold">403</h1>
            
            {/* Title */}
            <h2 className="text-3xl font-semibold">Access Denied</h2>
            
            {/* Description */}
            <p className="text-muted-foreground">
              You don't have permission to access {attemptedPath}.
            </p>

            {/* Required Permissions */}
            {requiredPermissions.length > 0 && (
              <>
                <div className="w-full border-t pt-6">
                  <div className="text-left">
                    <h3 className="text-sm font-semibold mb-3">Required Permissions:</h3>
                    <div className="flex flex-wrap gap-2">
                      {requiredPermissions.map((permission, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-destructive/10 text-destructive rounded-md text-sm font-medium"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Your role: <strong className="text-foreground">{userRole}</strong>
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Contact Message */}
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact your system administrator
              or try logging in with a different account.
            </p>

            {/* Action Buttons */}
            <HStack spacing={3} className="justify-center flex-wrap">
              <Button
                variant="default"
                size="lg"
                leftIcon={<HomeIcon className="h-4 w-4" />}
                onClick={() => navigate('/')}
                className="min-w-[150px]"
              >
                Go Home
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                leftIcon={<ArrowBackIcon className="h-4 w-4" />}
                onClick={() => navigate(-1)}
                className="min-w-[150px]"
              >
                Go Back
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                leftIcon={<ContactSupportIcon className="h-4 w-4" />}
                onClick={() => navigate('/settings')}
                className="min-w-[150px]"
              >
                Contact Support
              </Button>
            </HStack>

            {/* Help Section */}
            <div className="w-full border-t pt-6">
              <div className="text-left">
                <h3 className="text-sm font-semibold mb-3">What you can do:</h3>
                <ul className="text-sm text-muted-foreground space-y-2 pl-5 list-disc">
                  <li>Request access from your administrator</li>
                  <li>Check if you're using the correct account</li>
                  <li>Return to the dashboard and try another action</li>
                  <li>Contact support if you need immediate access</li>
                </ul>
              </div>
            </div>
          </VStack>
        </CardContent>
      </Card>
    </div>
  )
}

export default Unauthorized
