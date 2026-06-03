import type {
  CreateCategoryPayload,
  CreatePlatformServicePayload,
  CreateProductPayload,
  ListCategoriesQuery,
  ProductListQuery,
  ServiceListQuery,
  UpdateCategoryPayload,
  UpdatePlatformServicePayload,
  UpdateProductPayload,
} from '@profixer/api-client'
import { services } from '@/services/createMobileClient'
import { baseApi } from '@/store/api/baseApi'

export const catalogAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ---------------- Categories ---------------- */
    getAdminCategories: build.query<
      Awaited<ReturnType<typeof services.categories.listCategories>>,
      ListCategoriesQuery | void
    >({
      async queryFn(query) {
        try {
          const data = await services.categories.listCategories(query ?? {})
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Categories', id: 'LIST' }],
    }),
    createCategory: build.mutation<
      Awaited<ReturnType<typeof services.categories.createCategory>>,
      CreateCategoryPayload
    >({
      async queryFn(payload) {
        try {
          const data = await services.categories.createCategory(payload)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
    }),
    getCategoryDetail: build.query<
      Awaited<ReturnType<typeof services.categories.getCategoryById>>,
      string
    >({
      async queryFn(id) {
        try {
          const data = await services.categories.getCategoryById(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Categories', id }],
    }),
    updateCategory: build.mutation<
      Awaited<ReturnType<typeof services.categories.updateCategory>>,
      { id: string; payload: UpdateCategoryPayload }
    >({
      async queryFn({ id, payload }) {
        try {
          const data = await services.categories.updateCategory(id, payload)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Categories', id: 'LIST' }, { type: 'Categories', id }],
    }),
    deleteCategory: build.mutation<void, string>({
      async queryFn(id) {
        try {
          await services.categories.deleteCategory(id)
          return { data: undefined }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
    }),

    /* ---------------- Platform services ---------------- */
    getServicesList: build.query<
      Awaited<ReturnType<typeof services.catalog.getServices>>,
      ServiceListQuery | void
    >({
      async queryFn(query) {
        try {
          const data = await services.catalog.getServices(query ?? {})
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'CatalogServices', id: 'LIST' }],
    }),
    getServiceDetail: build.query<
      Awaited<ReturnType<typeof services.catalog.getServiceById>>,
      string
    >({
      async queryFn(id) {
        try {
          const data = await services.catalog.getServiceById(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'CatalogServices', id }],
    }),
    createPlatformService: build.mutation<
      Awaited<ReturnType<typeof services.catalog.createPlatformService>>,
      { payload: CreatePlatformServicePayload; draft?: boolean }
    >({
      async queryFn({ payload, draft }) {
        try {
          const data = await services.catalog.createPlatformService(payload, { draft })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'CatalogServices', id: 'LIST' }],
    }),
    updatePlatformService: build.mutation<
      Awaited<ReturnType<typeof services.catalog.updatePlatformService>>,
      { id: string; payload: UpdatePlatformServicePayload }
    >({
      async queryFn({ id, payload }) {
        try {
          const data = await services.catalog.updatePlatformService(id, payload)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'CatalogServices', id: 'LIST' },
        { type: 'CatalogServices', id },
      ],
    }),
    deleteService: build.mutation<void, string>({
      async queryFn(id) {
        try {
          await services.catalog.deleteService(id)
          return { data: undefined }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'CatalogServices', id: 'LIST' }],
    }),

    /* ---------------- Products ---------------- */
    getProductVendors: build.query<
      Awaited<ReturnType<typeof services.products.listVendors>>,
      void
    >({
      async queryFn() {
        try {
          const data = await services.products.listVendors()
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Vendors', id: 'LIST' }],
    }),
    getProductsList: build.query<
      Awaited<ReturnType<typeof services.products.getProducts>>,
      ProductListQuery | void
    >({
      async queryFn(query) {
        try {
          const data = await services.products.getProducts(query ?? {})
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    getProductDetail: build.query<
      Awaited<ReturnType<typeof services.products.getProductById>>,
      string
    >({
      async queryFn(id) {
        try {
          const data = await services.products.getProductById(id)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Products', id }],
    }),
    createProduct: build.mutation<
      Awaited<ReturnType<typeof services.products.createProduct>>,
      { payload: CreateProductPayload; draft?: boolean }
    >({
      async queryFn({ payload, draft }) {
        try {
          const data = await services.products.createProduct(payload, { draft })
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    updateProduct: build.mutation<
      Awaited<ReturnType<typeof services.products.updateProduct>>,
      { id: string; payload: UpdateProductPayload }
    >({
      async queryFn({ id, payload }) {
        try {
          const data = await services.products.updateProduct(id, payload)
          return { data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Products', id: 'LIST' },
        { type: 'Products', id },
      ],
    }),
    deleteProduct: build.mutation<void, string>({
      async queryFn(id) {
        try {
          await services.products.deleteProduct(id)
          return { data: undefined }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useGetCategoryDetailQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetServicesListQuery,
  useGetServiceDetailQuery,
  useCreatePlatformServiceMutation,
  useUpdatePlatformServiceMutation,
  useDeleteServiceMutation,
  useGetProductVendorsQuery,
  useGetProductsListQuery,
  useGetProductDetailQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = catalogAdminApi
