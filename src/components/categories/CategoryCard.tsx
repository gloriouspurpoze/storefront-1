import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  IconButton,
  Chip,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Fade,
  Grow,
  Tooltip,
  Badge,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  FolderOpen as FolderIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import { Category } from '../../types'
import { formatDistanceToNow } from 'date-fns'

// Enhanced CategoryCard with animations and visual elements
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isExpanded' && prop !== 'isActive',
})<{ isExpanded?: boolean; isActive?: boolean }>(({ theme, isExpanded, isActive }) => ({
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
  boxShadow: isExpanded 
    ? theme.shadows[8] 
    : isActive 
      ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
      : theme.shadows[2],
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  background: isActive 
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
    : 'inherit',
  border: isActive ? `2px solid ${alpha(theme.palette.primary.main, 0.2)}` : '2px solid transparent',
  
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[12],
    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}))

const StatusIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: 'active' | 'inactive' }>(({ theme, status }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: status === 'active' 
    ? theme.palette.success.main 
    : theme.palette.error.main,
  border: `2px solid ${theme.palette.background.paper}`,
  zIndex: 1,
  animation: status === 'active' ? 'pulse 2s infinite' : 'none',
  
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      opacity: 1,
    },
    '50%': {
      transform: 'scale(1.2)',
      opacity: 0.7,
    },
    '100%': {
      transform: 'scale(1)',
      opacity: 1,
    },
  },
}))

const CategoryHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
}))

const CategoryContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

const CategoryStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.grey[100], 0.5),
  borderRadius: theme.spacing(1),
  marginTop: theme.spacing(1),
}))

export interface CategoryCardProps {
  category: Category & { 
    productCount?: number
    subcategoryCount?: number 
    createdAt?: string
    updatedAt?: string
  }
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
  onView?: (category: Category) => void
  onToggleExpand?: (category: Category) => void
  isExpanded?: boolean
  showActions?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  showStats?: boolean
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  onView,
  onToggleExpand,
  isExpanded = false,
  showActions = true,
  variant = 'default',
  showStats = true,
}) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleAction = (action: () => void) => {
    action()
    handleMenuClose()
  }

  const getCategoryIcon = () => {
    if (category.productCount && category.productCount > 0) {
      return <FolderIcon color="primary" />
    }
    return <CategoryIcon color="action" />
  }

  const getStatusChip = () => {
    return (
      <Chip
        icon={category.status === 'active' ? <ActiveIcon /> : <InactiveIcon />}
        label={category.status}
        size="small"
        color={category.status === 'active' ? 'success' : 'error'}
        variant="outlined"
        sx={{
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-icon': {
            fontSize: '0.875rem',
          },
        }}
      />
    )
  }

  const renderCompactVariant = () => (
    <StyledCard 
      isActive={category.status === 'active'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ minHeight: 120 }}
    >
      <StatusIndicator status={category.status} />
      
      <CardContent sx={{ p: 2, pb: 1 }}>
        <CategoryHeader>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 32,
              height: 32,
            }}
          >
            {getCategoryIcon()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight={600}
              noWrap
              sx={{ 
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
              }}
            >
              {category.name}
            </Typography>
            {getStatusChip()}
          </Box>
          {showActions && (
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ 
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </CategoryHeader>
      </CardContent>
    </StyledCard>
  )

  const renderDetailedVariant = () => (
    <StyledCard 
      isExpanded={isExpanded}
      isActive={category.status === 'active'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <StatusIndicator status={category.status} />
      
      {category.image && (
        <CardMedia
          component="img"
          height="140"
          image={category.image}
          alt={category.name}
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        />
      )}
      
      <CardContent>
        <CategoryHeader>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 48,
              height: 48,
            }}
          >
            {getCategoryIcon()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={600} noWrap>
              {category.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {category.description || 'No description'}
            </Typography>
          </Box>
          {showActions && (
            <IconButton
              onClick={handleMenuOpen}
              sx={{ 
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </CategoryHeader>

        <CategoryContent>
          {getStatusChip()}
          
          {category.parentId && (
            <Chip
              label="Subcategory"
              size="small"
              variant="outlined"
              color="info"
              sx={{ fontSize: '0.75rem', height: 20 }}
            />
          )}
          
          {showStats && (
            <CategoryStats>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {category.productCount !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon fontSize="small" color="primary" />
                    <Typography variant="caption" color="text.secondary">
                      {category.productCount} products
                    </Typography>
                  </Box>
                )}
                
                {category.subcategoryCount !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FolderIcon fontSize="small" color="secondary" />
                    <Typography variant="caption" color="text.secondary">
                      {category.subcategoryCount} subcategories
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {category.updatedAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(category.updatedAt), { addSuffix: true })}
                  </Typography>
                </Box>
              )}
            </CategoryStats>
          )}
        </CategoryContent>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onView && (
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => onView(category)}>
                <ViewIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {onToggleExpand && (
            <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
              <IconButton size="small" onClick={() => onToggleExpand(category)}>
                {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {category.status === 'active' && (
            <LinearProgress
              variant="determinate"
              value={Math.min((category.productCount || 0) * 10, 100)}
              sx={{ 
                width: 60, 
                height: 4, 
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                },
              }}
            />
          )}
        </Box>
      </CardActions>
    </StyledCard>
  )

  const renderDefaultVariant = () => (
    <StyledCard 
      isActive={category.status === 'active'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <StatusIndicator status={category.status} />
      
      <CardContent sx={{ p: 2 }}>
        <CategoryHeader>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
            }}
          >
            {getCategoryIcon()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {category.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              noWrap
              sx={{ fontSize: '0.75rem' }}
            >
              {category.description || 'No description'}
            </Typography>
          </Box>
          {showActions && (
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ 
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </CategoryHeader>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          {getStatusChip()}
          
          {showStats && category.productCount !== undefined && (
            <Badge 
              badgeContent={category.productCount} 
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  height: 18,
                  minWidth: 18,
                },
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Products
              </Typography>
            </Badge>
          )}
        </Box>
      </CardContent>
    </StyledCard>
  )

  return (
    <>
      <Grow in timeout={300}>
        {variant === 'compact' ? renderCompactVariant() : 
         variant === 'detailed' ? renderDetailedVariant() : 
         renderDefaultVariant()}
      </Grow>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        {onView && (
          <MenuItem onClick={() => handleAction(() => onView(category))}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View Details
          </MenuItem>
        )}
        
        {onEdit && (
          <MenuItem onClick={() => handleAction(() => onEdit(category))}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit Category
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem 
            onClick={() => handleAction(() => onDelete(category))}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete Category
          </MenuItem>
        )}
      </Menu>
    </>
  )
}

export default CategoryCard
