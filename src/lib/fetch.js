import retryFetch from '@vercel/fetch-retry'
import nodeFetch from 'node-fetch'

export const fetch = retryFetch(nodeFetch)