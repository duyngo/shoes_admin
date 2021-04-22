import algoliasearch from 'algoliasearch'

const client = algoliasearch('LS6W1RH9KS','3fc8e0db416cafc9ccd7747ef2f50c3f',{
    timeouts: {
      connect: 1000,
      read: 2 * 1000,
      write: 30 * 1000
    }
})


const ordersIndex = client.initIndex('test_ORDERS')

export const algoliaSearchOrders = (search) => {

    return new Promise ( (resolve, reject) => {
        ordersIndex.search({
            query : search,
            hitsPerPage : 20,
        }, (error, { hits } = {} ) => {
            if( error ){
                console.log(`[ERROR] ${error}`)
                reject(error)
                throw(error)
            }
            resolve(hits)
        })
    })
}
