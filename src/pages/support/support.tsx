import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  useTheme,
  alpha,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Support as SupportIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  Article as ArticleIcon,
  BugReport as BugReportIcon,
  Lightbulb as LightbulbIcon,
  School as SchoolIcon,
  ContactSupport as ContactSupportIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Book as BookIcon,
  VideoLibrary as VideoLibraryIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

interface SupportOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  action: string
  available: boolean
}

export function Support() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [expandedFAQ, setExpandedFAQ] = useState<string | false>(false)
  const [searchQuery, setSearchQuery] = useState('')

  const supportOptions: SupportOption[] = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: <EmailIcon />,
      color: theme.palette.primary.main,
      action: 'mailto:support@fixer.com',
      available: true,
    },
    {
      id: 'phone',
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      icon: <PhoneIcon />,
      color: theme.palette.success.main,
      action: 'tel:+1-555-0123',
      available: true,
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Open the in-app chat console to message customers and providers',
      icon: <ChatIcon />,
      color: theme.palette.info.main,
      action: '/chat',
      available: true,
    },
    {
      id: 'video',
      title: 'Video Call',
      description: 'Request a scheduled call — email us with your preferred time',
      icon: <VideoCallIcon />,
      color: theme.palette.warning.main,
      action: 'mailto:support@fixer.com?subject=Video%20support%20request',
      available: true,
    },
  ]

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How do I add a new product to the platform?',
      answer: 'To add a new product, navigate to the Products section, click "Add Product", fill in the required information including name, description, price, and images, then click "Save". Make sure to include proper SEO details for better visibility.',
      category: 'Products',
    },
    {
      id: '2',
      question: 'How can I manage user permissions and roles?',
      answer: 'User roles and permissions can be managed in the Users section. Click on a user to edit their profile, then use the Role dropdown to assign appropriate permissions. Super admins can modify all permissions.',
      category: 'Users',
    },
    {
      id: '3',
      question: 'What is the difference between service requests and platform services?',
      answer: 'Service requests are customer-submitted requests for specific services, while platform services are the predefined service categories and offerings that customers can choose from when submitting requests.',
      category: 'Services',
    },
    {
      id: '4',
      question: 'How do I configure notification settings?',
      answer: 'Go to Settings > Notifications to configure email, push, and SMS notifications. You can also set up automated notifications for specific events like new orders or user registrations.',
      category: 'Settings',
    },
    {
      id: '5',
      question: 'Can I export data from the admin panel?',
      answer: 'Yes, most data tables have export functionality. Look for the "Export" button in the top-right corner of data tables. You can export data in CSV, Excel, or PDF formats.',
      category: 'Data',
    },
    {
      id: '6',
      question: 'How do I reset a user\'s password?',
      answer: 'In the Users section, click on the user you want to reset the password for, then click "Reset Password". An email with reset instructions will be sent to the user\'s email address.',
      category: 'Users',
    },
  ]

  const resources = [
    {
      title: 'User Manual',
      description: 'Complete guide to using the admin panel',
      icon: <BookIcon />,
      action: '#',
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      icon: <VideoLibraryIcon />,
      action: '#',
    },
    {
      title: 'API Documentation',
      description: 'Technical documentation for developers',
      icon: <ArticleIcon />,
      action: '#',
    },
    {
      title: 'System Status',
      description: 'Check current system status and uptime',
      icon: <BugReportIcon />,
      action: '#',
    },
  ]

  const handleFAQChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFAQ(isExpanded ? panel : false)
  }

  const filteredFAQs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box sx={{ flexGrow: 1 }}>
      <PageHeader
        title="Help & Support"
        subtitle="Get assistance and find answers to common questions"
        icon={<SupportIcon />}
      />

      <Grid container spacing={3}>
        {/* Support Options */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ContactSupportIcon />
                Contact Support
              </Typography>
              <Grid container spacing={2}>
                {supportOptions.map((option) => (
                  <Grid item xs={12} sm={6} key={option.id}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: option.available ? 'pointer' : 'not-allowed',
                        opacity: option.available ? 1 : 0.6,
                        transition: 'all 0.2s',
                        '&:hover': option.available ? {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        } : {},
                      }}
                      onClick={() => {
                        if (!option.available) return
                        const a = option.action
                        if (a.startsWith('mailto:') || a.startsWith('tel:') || a.startsWith('http')) {
                          window.open(a, '_blank', 'noopener,noreferrer')
                        } else {
                          navigate(a)
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: alpha(option.color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                          color: option.color,
                        }}
                      >
                        {option.icon}
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {option.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {option.description}
                      </Typography>
                      {!option.available && (
                        <Chip label="Coming Soon" size="small" color="default" />
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LightbulbIcon />
                Quick Stats
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <QuestionAnswerIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="FAQ Articles"
                    secondary={`${faqItems.length} available`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SupportIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Response Time"
                    secondary="< 24 hours"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Resources"
                    secondary={`${resources.length} guides`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* FAQ Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <HelpIcon />
                <Typography variant="h6">Frequently Asked Questions</Typography>
              </Box>
              
              <TextField
                fullWidth
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <HelpIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              {filteredFAQs.map((item) => (
                <Accordion
                  key={item.id}
                  expanded={expandedFAQ === item.id}
                  onChange={handleFAQChange(item.id)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ flex: 1 }}>
                        {item.question}
                      </Typography>
                      <Chip label={item.category} size="small" color="primary" variant="outlined" />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Resources */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArticleIcon />
                Resources & Documentation
              </Typography>
              <Grid container spacing={2}>
                {resources.map((resource, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                      }}
                      onClick={() => window.open(resource.action)}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          color: theme.palette.primary.main,
                        }}
                      >
                        {resource.icon}
                      </Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {resource.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {resource.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Support
