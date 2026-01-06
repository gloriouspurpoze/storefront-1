import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Rating,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material'

interface ProductPreviewProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number
    sku: string
    status: string
    isFeatured: boolean
    images: string[]
    specifications?: Record<string, any>
    category?: {
      id: string
      name: string
    }
    provider?: {
      businessName: string
    }
    rating?: number
    reviewCount?: number
    stockQuantity: number
    createdAt: string
    updatedAt?: string
  }
  onEdit: () => void
  onDelete: () => void
  onPrint: () => void
  onShare: () => void
  onView?: () => void
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'error'
    case 'discontinued':
      return 'default'
    default:
      return 'default'
  }
}

export const ProductPreview: React.FC<ProductPreviewProps> = ({
  product,
  onEdit,
  onDelete,
  onPrint,
  onShare,
  onView
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {product.name}
          </Typography>
          <Chip
            label={product.status}
            color={getStatusColor(product.status) as any}
            variant="filled"
            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
          />
          {product.isFeatured && (
            <Chip
              label="Featured"
              color="warning"
              variant="filled"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onView && (
            <IconButton onClick={onView} color="primary" size="small">
              <VisibilityIcon />
            </IconButton>
          )}
          <IconButton onClick={onEdit} color="primary" size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={onPrint} color="primary" size="small">
            <PrintIcon />
          </IconButton>
          <IconButton onClick={onShare} color="primary" size="small">
            <ShareIcon />
          </IconButton>
          <IconButton onClick={onDelete} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Product Images */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Product Images
              </Typography>
              <Grid container spacing={2}>
                {product.images.map((image, index) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={index}>
                    <Avatar
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      variant="rounded"
                      sx={{ 
                        width: '100%', 
                        height: 120,
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          transition: 'transform 0.2s'
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Product Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Product Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Price Information */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(product.price)}
                    </Typography>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            textDecoration: 'line-through', 
                            color: 'text.secondary' 
                          }}
                        >
                          {formatCurrency(product.originalPrice)}
                        </Typography>
                        <Chip
                          label={`-${discountPercentage}%`}
                          color="error"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </>
                    )}
                  </Box>
                </Box>

                {/* Rating */}
                {product.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={product.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                      ({product.rating}/5)
                    </Typography>
                    {product.reviewCount && (
                      <Typography variant="body2" color="text.secondary">
                        • {product.reviewCount} reviews
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Stock Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Stock:
                  </Typography>
                  <Chip
                    label={product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                    color={product.stockQuantity > 0 ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {/* SKU */}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {product.sku}
                  </Typography>
                </Box>

                {/* Category */}
                {product.category && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Category: {product.category.name}
                    </Typography>
                  </Box>
                )}

                {/* Provider */}
                {product.provider && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Provider: {product.provider.businessName}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  disabled={product.stockQuantity === 0}
                  fullWidth={isMobile}
                >
                  Add to Cart
                </Button>
                {!isMobile && (
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={onView}
                  >
                    View Details
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Description */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Description
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {product.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Specifications
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Product Dates */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Product Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Created:</strong> {formatDate(product.createdAt)}
                </Typography>
                {product.updatedAt && (
                  <Typography variant="body2">
                    <strong>Last Updated:</strong> {formatDate(product.updatedAt)}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Status:</strong> {product.status}
                </Typography>
                {product.isFeatured && (
                  <Typography variant="body2">
                    <strong>Featured:</strong> Yes
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}