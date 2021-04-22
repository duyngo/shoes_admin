import algoliasearch from 'algoliasearch'

const client = algoliasearch('LS6W1RH9KS','3fc8e0db416cafc9ccd7747ef2f50c3f',{
    timeouts: {
      connect: 1000,
      read: 2 * 1000,
      write: 30 * 1000
    }
})

const usersIndex = client.initIndex('test_USERS')

export const algoliaSearchUsers = (search) => {

    return new Promise ( (resolve, reject) => {
        usersIndex.search({
            query : search,
            hitsPerPage : 20,
        }, (error, { hits } = {} ) => {
            if( error ){
                console.log(error)
                reject(error)
                throw(error)
            }
            resolve(hits)
        })
    })
}

export const algoliaAddUser = ( user ) => {

    return new Promise ( ( resolve, reject ) => {
        usersIndex.addObject()
    })

}