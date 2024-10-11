export const dynamic = 'force-dynamic' // defaults to auto
export async function POST (request: Request) {

  console.log('post')
  return Response.json({
    form: JSON.stringify(await request.json()),
  })

}

