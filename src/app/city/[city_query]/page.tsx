// cache max 30 dagen

export default function Page({params}: {params: {city_query: string}}) {
    const query = params.city_query

    // query mongo
    // if in mongo, reply with mongo

    if(query.includes("China")) return 404
}