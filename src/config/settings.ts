
export const APConstants = {
    elasticsearchURL: process.env.AP_ELASTIC_URL,
    clientElasticsearchURL: process.env.CLIENT_ELASTIC_URL,
    localQueue: process.env.AP_LOCAL_QUEUE,
    indexes : {
        products : {
            index : 'products',
            type : 'product'
        },
        productlist :  {
            index: 'productlist',
             type: 'product'
        },
        productType : {
            index : 'productype',
            type  : 'type'
        },
        productBucket : {
            index: 'productbuckets',
            type: 'productbucket'
        },
        notifications : {
            index :  'notifications',
            type : 'notification',
        }
    },
};
