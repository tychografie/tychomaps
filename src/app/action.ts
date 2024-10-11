'use server'

import { SearchStateResponse } from '@/app/types'

export async function search (
  prevState: any, formData: FormData): Promise<SearchStateResponse> {
  // return await new Promise(resolve => {
  //   setTimeout(() => {
  //     console.log('query:', formData.get('query'))
      return{
        message: 'search : ' + formData.get('query'),
      }
    // }, 2000)
  // })
}
