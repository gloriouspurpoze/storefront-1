import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  GetApp as GetAppIcon,
  Share as ShareIcon,
  Print as PrintIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { formatCurrency, formatDate } from '../../lib/utils'

interface ReportType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  category: 'financial' | 'operational' | 'user' | 'product'
  lastGenerated?: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
}

interface ReportData {
  id: string
  name: string
  type: string
  generatedAt: string
  status: 'completed' | 'processing' | 'failed'
  size: string
  format: 'pdf' | 'excel' | 'csv'
}

export function Reports() {
  const theme = useTheme()
  const [selectedReport, setSelectedReport] = useState('')
  const [dateRange, setDateRange] = useState('last_30_days')
  const [reportFormat, setReportFormat] = useState('pdf')

  const reportTypes: ReportType[] = [
    {
      id: 'revenue',
      name: 'Revenue Report',
      description: 'Detailed revenue breakdown by period and source',
      icon: <TrendingUpIcon />,
      color: theme.palette.success.main,
      category: 'financial',
      lastGenerated: '2024-01-15',
      frequency: 'monthly',
    },
    {
      id: 'orders',
      name: 'Orders Report',
      description: 'Order statistics and fulfillment metrics',
      icon: <TableIcon />,
      color: theme.palette.primary.main,
      category: 'operational',
      lastGenerated: '2024-01-14',
      frequency: 'weekly',
    },
    {
      id: 'users',
      name: 'User Analytics',
      description: 'User registration, activity, and engagement metrics',
      icon: <BarChartIcon />,
      color: theme.palette.info.main,
      category: 'user',
      lastGenerated: '2024-01-13',
      frequency: 'weekly',
    },
    {
      id: 'products',
      name: 'Product Performance',
      description: 'Product sales, inventory, and performance metrics',
      icon: <PieChartIcon />,
      color: theme.palette.warning.main,
      category: 'product',
      lastGenerated: '2024-01-12',
      frequency: 'monthly',
    },
    {
      id: 'providers',
      name: 'Service Provider Report',
      description: 'Provider performance and service quality metrics',
      icon: <AssessmentIcon />,
      color: theme.palette.secondary.main,
      category: 'operational',
      lastGenerated: '2024-01-11',
      frequency: 'monthly',
    },
    {
      id: 'financial',
      name: 'Financial Summary',
      description: 'Complete financial overview with P&L and cash flow',
      icon: <TrendingUpIcon />,
      color: theme.palette.error.main,
      category: 'financial',
      lastGenerated: '2024-01-10',
      frequency: 'quarterly',
    },
  ]

  const recentReports: ReportData[] = [
    {
      id: '1',
      name: 'Revenue Report - January 2024',
      type: 'Revenue Report',
      generatedAt: '2024-01-15T10:30:00Z',
      status: 'completed',
      size: '2.3 MB',
      format: 'pdf',
    },
    {
      id: '2',
      name: 'User Analytics - Week 2',
      type: 'User Analytics',
      generatedAt: '2024-01-14T14:20:00Z',
      status: 'completed',
      size: '1.8 MB',
      format: 'excel',
    },
    {
      id: '3',
      name: 'Orders Report - January 2024',
      type: 'Orders Report',
      generatedAt: '2024-01-13T09:15:00Z',
      status: 'processing',
      size: '-',
      format: 'csv',
    },
    {
      id: '4',
      name: 'Product Performance - Q4 2023',
      type: 'Product Performance',
      generatedAt: '2024-01-12T16:45:00Z',
      status: 'completed',
      size: '3.1 MB',
      format: 'pdf',
    },
  ]

  const handleGenerateReport = () => {
    if (!selectedReport) return
    
    // Simulate report generation
    console.log('Generating report:', {
      type: selectedReport,
      dateRange,
      format: reportFormat,
    })
    
    // Show success message or handle error
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main
      case 'processing':
        return theme.palette.warning.main
      case 'failed':
        return theme.palette.error.main
      default:
        return theme.palette.grey[500]
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <PdfIcon />
      case 'excel':
        return <TableIcon />
      case 'csv':
        return <TableIcon />
      default:
        return <GetAppIcon />
    }
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate and manage business reports"
        icon={<AssessmentIcon />}
      />

      <Grid container spacing={3}>
        {/* Report Generation */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Generate New Report
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={selectedReport}
                      onChange={(e) => setSelectedReport(e.target.value)}
                      label="Report Type"
                    >
                      {reportTypes.map((report) => (
                        <MenuItem key={report.id} value={report.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ color: report.color }}>{report.icon}</Box>
                            <Box>
                              <Typography variant="body1">{report.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {report.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      label="Date Range"
                    >
                      <MenuItem value="last_7_days">Last 7 days</MenuItem>
                      <MenuItem value="last_30_days">Last 30 days</MenuItem>
                      <MenuItem value="last_3_months">Last 3 months</MenuItem>
                      <MenuItem value="last_6_months">Last 6 months</MenuItem>
                      <MenuItem value="last_year">Last year</MenuItem>
                      <MenuItem value="custom">Custom range</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={reportFormat}
                      onChange={(e) => setReportFormat(e.target.value)}
                      label="Format"
                    >
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="excel">Excel</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AssessmentIcon />}
                  onClick={handleGenerateReport}
                  disabled={!selectedReport}
                >
                  Generate Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                >
                  Refresh Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Quick Stats
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Total Reports</Typography>
                  <Chip label={recentReports.length} color="primary" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">This Month</Typography>
                  <Chip label="12" color="success" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Pending</Typography>
                  <Chip label="2" color="warning" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Failed</Typography>
                  <Chip label="0" color="error" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Report Types Grid */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Available Reports
              </Typography>
              <Grid container spacing={2}>
                {reportTypes.map((report) => (
                  <Grid item xs={12} sm={6} md={4} key={report.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: selectedReport === report.id ? `2px solid ${report.color}` : '1px solid',
                        borderColor: selectedReport === report.id ? report.color : 'divider',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                      }}
                      onClick={() => setSelectedReport(report.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: alpha(report.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: report.color,
                          }}
                        >
                          {report.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {report.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.frequency}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {report.description}
                      </Typography>
                      {report.lastGenerated && (
                        <Typography variant="caption" color="text.secondary">
                          Last generated: {formatDate(report.lastGenerated)}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Reports */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Recent Reports</Typography>
                <Button variant="outlined" startIcon={<RefreshIcon />}>
                  Refresh
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Report Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Generated</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {report.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {report.type}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(report.generatedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.status}
                            size="small"
                            sx={{
                              backgroundColor: alpha(getStatusColor(report.status), 0.1),
                              color: getStatusColor(report.status),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {report.size}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getFormatIcon(report.format)}
                            <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
                              {report.format}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Download">
                              <IconButton size="small" disabled={report.status !== 'completed'}>
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Share">
                              <IconButton size="small" disabled={report.status !== 'completed'}>
                                <ShareIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print">
                              <IconButton size="small" disabled={report.status !== 'completed'}>
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Reports
