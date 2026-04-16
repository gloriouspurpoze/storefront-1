import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, CardTitle, VStack } from '../../components/ui'
import { PageHeader } from '../../components/common/PageHeader'
import { MessageSquare, ArrowRight } from 'lucide-react'

/**
 * Admin messaging: real-time chat lives on `/chat`.
 * This page routes operators to the chat workspace instead of a placeholder “coming soon” marketing screen.
 */
export function Messages() {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <VStack spacing={6}>
        <PageHeader
          title="Messages"
          subtitle="Chat with customers and providers using the admin chat workspace."
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Open chat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Conversations, attachments, and provider lookup are available in the dedicated Chat section.
              Use it to respond to support threads tied to bookings and accounts.
            </p>
            <Button size="lg" onClick={() => navigate('/chat')} className="gap-2">
              Go to Chat
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </VStack>
    </div>
  )
}
