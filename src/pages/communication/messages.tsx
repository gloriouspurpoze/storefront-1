import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  VStack,
  HStack,
} from '../../components/ui'
import {
  MessageCircle,
  MessageSquare,
  Bell,
  Mail,
  Phone,
  Video,
  Paperclip,
  Smile,
  Search,
  Archive,
  Trash2,
  Reply,
  Send,
  FileText,
  Flag,
  Star,
  Check,
  Clock,
  Sparkles,
  Bot,
  Globe,
  Mic,
  Users,
  CheckCircle,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'

interface MessageFeature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: 'communication' | 'automation' | 'analytics' | 'integration'
  color: string
}

interface MessageType {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  color: string
  count: number
}

interface ConversationPreview {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  unread: number
  status: 'online' | 'offline' | 'away'
  priority: 'high' | 'medium' | 'low'
}

export function Messages() {
  const [showContent, setShowContent] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const messageTypes: MessageType[] = [
    {
      id: 'inbox',
      name: 'Inbox',
      icon: <Mail className="h-6 w-6" />,
      description: 'All incoming messages',
      color: 'blue',
      count: 24,
    },
    {
      id: 'sent',
      name: 'Sent',
      icon: <Send className="h-6 w-6" />,
      description: 'Messages you sent',
      color: 'green',
      count: 156,
    },
    {
      id: 'drafts',
      name: 'Drafts',
      icon: <FileText className="h-6 w-6" />,
      description: 'Unsent messages',
      color: 'yellow',
      count: 8,
    },
    {
      id: 'spam',
      name: 'Spam',
      icon: <Flag className="h-6 w-6" />,
      description: 'Filtered messages',
      color: 'red',
      count: 3,
    },
  ]

  const upcomingFeatures: MessageFeature[] = [
    {
      id: 'real-time-chat',
      title: 'Real-Time Chat',
      description: 'Instant messaging with typing indicators, read receipts, and message status',
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'blue',
      category: 'communication',
    },
    {
      id: 'video-calls',
      title: 'Video & Voice Calls',
      description: 'Integrated video calling with screen sharing and recording capabilities',
      icon: <Video className="h-6 w-6" />,
      color: 'indigo',
      category: 'communication',
    },
    {
      id: 'ai-assistant',
      title: 'AI Message Assistant',
      description: 'Smart reply suggestions, auto-translation, and intelligent message categorization',
      icon: <Bot className="h-6 w-6" />,
      color: 'purple',
      category: 'automation',
    },
    {
      id: 'message-analytics',
      title: 'Message Analytics',
      description: 'Track response times, engagement metrics, and communication patterns',
      icon: <Sparkles className="h-6 w-6" />,
      color: 'green',
      category: 'analytics',
    },
    {
      id: 'bulk-messaging',
      title: 'Bulk Messaging',
      description: 'Send personalized messages to multiple recipients with scheduling options',
      icon: <Clock className="h-6 w-6" />,
      color: 'orange',
      category: 'automation',
    },
    {
      id: 'integrations',
      title: 'Third-Party Integrations',
      description: 'Connect with WhatsApp, SMS, email, and other communication platforms',
      icon: <Users className="h-6 w-6" />,
      color: 'red',
      category: 'integration',
    },
  ]

  const conversationPreviews: ConversationPreview[] = [
    {
      id: '1',
      name: 'John Smith',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      lastMessage: 'Thanks for the quick response!',
      timestamp: '2 min ago',
      unread: 0,
      status: 'online',
      priority: 'medium',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      lastMessage: 'Can we schedule a call for tomorrow?',
      timestamp: '15 min ago',
      unread: 2,
      status: 'away',
      priority: 'high',
    },
    {
      id: '3',
      name: 'Mike Wilson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      lastMessage: 'The project is looking great!',
      timestamp: '1 hour ago',
      unread: 0,
      status: 'offline',
      priority: 'low',
    },
  ]

  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(selectedFeature === featureId ? null : featureId)
  }

  const handleGetNotified = () => {
    console.log('Get notified for messages feature')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 hover:bg-green-100',
      yellow: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
      red: 'bg-red-50 text-red-600 hover:bg-red-100',
      indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
      purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="p-6 animate-in fade-in duration-500">
      <VStack spacing={6}>
        {/* Header */}
        <PageHeader
          title="Messages"
          subtitle="Stay connected with customers, providers, and team members through our unified messaging platform"
          action={
            <Button
              size="lg"
              onClick={handleGetNotified}
              leftIcon={<Bell className="h-4 w-4" />}
            >
              Get Early Access
            </Button>
          }
        />

        {/* Coming Soon Alert */}
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            💬 Revolutionary Messaging Platform Coming Soon!
          </h3>
          <p className="text-blue-700">
            We're building the most advanced messaging system for home service businesses. 
            Get ready for real-time chat, video calls, AI assistance, and seamless integrations!
          </p>
        </div>

        {/* Message Types Overview */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Message Management</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {messageTypes.map((type) => (
              <Card 
                key={type.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-full ${getColorClasses(type.color)} flex items-center justify-center mx-auto mb-4`}>
                    {type.icon}
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{type.name}</h3>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {type.description}
                  </p>
                  
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getColorClasses(type.color)}`}>
                    {type.count} Messages
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Conversation Preview */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Live Conversations Preview</h2>
          
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle>Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {conversationPreviews.map((conversation) => (
                  <div 
                    key={conversation.id}
                    className="p-4 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img 
                          src={conversation.avatar} 
                          alt={conversation.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(conversation.status)}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{conversation.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(conversation.priority)}`}>
                            {conversation.priority}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1">
                          {conversation.lastMessage}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {conversation.timestamp}
                          </span>
                          {conversation.unread > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                              {conversation.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Features */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Powerful Features Coming Soon</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingFeatures.map((feature) => (
              <Card
                key={feature.id}
                className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  selectedFeature === feature.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleFeatureSelect(feature.id)}
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-lg ${getColorClasses(feature.color)} flex items-center justify-center flex-shrink-0`}>
                      {feature.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{feature.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getColorClasses(feature.color)}`}>
                          {feature.category}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="text-center p-8">
          <div className="text-primary mb-4">
            <MessageCircle className="h-24 w-24 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Ready to Transform Your Communication?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of businesses already using our messaging platform. 
            Get early access to advanced features like AI assistance, video calls, and seamless integrations.
          </p>
          <Button size="lg" onClick={handleGetNotified}>
            Join Waitlist
          </Button>
        </Card>

        {/* Feature Highlights */}
        <div>
          <h3 className="text-xl font-semibold text-center mb-6">
            Why Choose Our Messaging Platform?
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <CheckCircle className="h-6 w-6" />, text: 'End-to-End Encryption', color: 'green' },
              { icon: <Sparkles className="h-6 w-6" />, text: 'AI-Powered Features', color: 'purple' },
              { icon: <Users className="h-6 w-6" />, text: 'Team Collaboration', color: 'blue' },
              { icon: <Globe className="h-6 w-6" />, text: 'Multi-Language Support', color: 'orange' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 rounded-full ${getColorClasses(item.color)} flex items-center justify-center mx-auto mb-2`}>
                  {item.icon}
                </div>
                <p className="text-sm font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">
            Questions About Our Messaging Platform?
          </h3>
          
          <HStack spacing={4} className="justify-center mb-6">
            <button className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors">
              <MessageSquare className="h-5 w-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
              <Mail className="h-5 w-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-colors">
              <Phone className="h-5 w-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors">
              <Video className="h-5 w-5" />
            </button>
          </HStack>
          
          <p className="text-sm text-muted-foreground">
            © 2024 HomeService Platform. All rights reserved.
          </p>
        </div>
      </VStack>
    </div>
  )
}
