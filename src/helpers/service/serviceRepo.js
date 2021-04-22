import FirebaseHelper from '../firebase';

const db = FirebaseHelper.getDatabase();

const SERVICE_COLLECTION = "services";

export const getServices = async () => {
    try{
        let snapshots = await db.collection(SERVICE_COLLECTION)
                            .get()

        let services = [];

        for (const service of snapshots.docs) {
            services.push({...service.data()})
        }

        return services;
    }catch( error ){
        console.log(error)
        throw(error)
    }
}
