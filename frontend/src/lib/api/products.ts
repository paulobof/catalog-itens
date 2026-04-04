import { fetchApi } from './client'
import type {
  ProductSummary,
  ProductDetail,
  CreateProductRequest,
  UpdateProductRequest,
  ProductSearchParams,
  AddProductLocationRequest,
  UpdateProductLocationRequest,
  Page,
} from './types'

export async function getProducts(
  params: ProductSearchParams = {},
): Promise<Page<ProductSummary>> {
  return fetchApi<Page<ProductSummary>>('/api/products', {
    params: params as Record<string, string | number | boolean | undefined | null>,
  })
}

export async function getProductById(id: string): Promise<ProductDetail> {
  return fetchApi<ProductDetail>(`/api/products/${id}`)
}

export async function createProduct(
  data: CreateProductRequest,
): Promise<ProductDetail> {
  return fetchApi<ProductDetail>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProduct(
  id: string,
  data: UpdateProductRequest,
): Promise<ProductDetail> {
  return fetchApi<ProductDetail>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteProduct(id: string): Promise<void> {
  return fetchApi<void>(`/api/products/${id}`, { method: 'DELETE' })
}

export async function addProductLocation(
  productId: string,
  data: AddProductLocationRequest,
): Promise<void> {
  return fetchApi<void>(`/api/products/${productId}/locations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProductLocation(
  productId: string,
  locationId: string,
  data: UpdateProductLocationRequest,
): Promise<void> {
  return fetchApi<void>(`/api/products/${productId}/locations/${locationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function removeProductLocation(
  productId: string,
  locationId: string,
): Promise<void> {
  return fetchApi<void>(`/api/products/${productId}/locations/${locationId}`, {
    method: 'DELETE',
  })
}
