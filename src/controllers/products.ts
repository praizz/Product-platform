import * as Builder from 'elastic-builder';
import { listServices } from '../services/listServices';
import {APConstants} from '../config/settings';
const moment = require('moment') ;
const HttpStatus = require('../constants/httpStatus')
const Response = require('../lib/responseManager')
import { v4 as uuid } from 'uuid';
const productIndex = APConstants.indexes.products.index;
const productType = APConstants.indexes.products.type;
const productTypeIndex = APConstants.indexes.productType.index;
const productTypeType = APConstants.indexes.productType.type;

export class productsController {
/********************************************************
 *                 CREATE PRODUCT         *
 * ******************************************************/
    public static async createProduct (req, res){
        const body: any = req.body;
        const id: string = uuid();
            body.product.product_id = id;
            body.createdAt && body.updatedAt === moment().valueOf();
        let requestBody = Builder.requestBodySearch().query(Builder.matchQuery('product.name.keyword', body.product.name));
        if (!body || !body.product || !body.product) {
            return Response.failure(res, { message: 'Please pass in the right parameters' }, HttpStatus.BadRequest);
        }
        try {
            const response = await listServices.getProductName(productIndex, productType, requestBody);
            const hit: any = response.hits.hits;
            if (!hit.length) {
                body.insights = {};
                try {
                    let result = await listServices.indexToES(productIndex, productType, body, id)
                    Response.success(res, { message: 'Product Successfully created' , response: {
                        product_name: body.product.name,
                        product_id: id,
                        product_description: body.product.description,
                        createdAt: body.createdAt,
                        updatedAt: body.updatedAt}}, HttpStatus.OK);

                    const queueBody = {
                        productId   : id,
                        criteria    : body.product,
                        userEmail   : body.product.createdBy.email,
                        user_id     : body.product.createdBy.userId,
                        name        : body.product.name,
                        description : body.product.description
                    };
                    // Data to pass to the Queue for Default product recommendation.
                    listServices.pushToppInsightsQueue(queueBody);
                }
                catch{
                    return Response.failure(res, { message: 'Error indexing products' }, HttpStatus.BadRequest); 
                };
            }
            return Response.failure(res, { message: 'Product name already exists' }, HttpStatus.BadRequest); 
        }
        catch{
            return Response.failure(res, { message: 'Error validating product name' }, HttpStatus.BadRequest); 
        };
    }
/********************************************************
 *                 GET PRODUCTS        *
 * ******************************************************/
    public static async getProducts (req, res){
        const user_id = req.query.user_id;
        const start_date = req.query.start_date;
        const end_date = req.query.end_date;
        const search = req.query.q;
        const query = Builder.requestBodySearch();
        const q: Builder.Query[] = [];
        let Params: any = {};
        Params.sort = ['createdAt:desc'];
        let from = 0;
        let size = 20;
        if (search ) {
            q.push(Builder.multiMatchQuery([ 'product.name', 'product.description', 'product.createdBy.email' ], search ).type('phrase_prefix'));
            Params.body = query.query(Builder.boolQuery().must(q));
        }
        if (user_id ) {
            q.push(Builder.termQuery('product.createdBy.userId.keyword', user_id));
            Params.body = query.query(Builder.boolQuery().must(q));
        }
        if (start_date && end_date ) {
            q.push(Builder.rangeQuery('createdAt').gte(start_date).lte(end_date));
            Params.body = query.query(Builder.boolQuery().must(q));
        }
        if (req.query.from && req.query.size) {
            from = parseInt(req.query.from);
            size = parseInt(req.query.size);
            Params.size = size;
            Params.from = from;
        }
        Params.size = size;
        Params.from = from;
        try{
            let result = await listServices.searchES(Params, productIndex, productType)
            const databox = result.hits.hits.map((hit: any) => {
                return {
                    product_id: hit._id,
                    product_name: hit._source.product.name,
                    product_description: hit._source.product.description,
                    insights : hit._source.insights,
                    createdBy: hit._source.product.createdBy,
                };
            });
            return Response.success(res, { message: 'Product Successfully fetched' , response:databox}, HttpStatus.OK); 
        }
        catch {
            return Response.failure(res, { message:  'Error fetching Product!!!' }, HttpStatus.NOT_FOUND); 
        };

    }
/********************************************************
 *                 GET PRODUCT BY ID       *
 * ******************************************************/    
    public static async getProductByID (req, res){
        const productId = req.params.productId;
        if (productId) {
            try {
                let response = await listServices.getByID(productIndex, productType, productId)
                if(response){
                    return Response.success(res, { message: 'Product Successfully fetched' , response: response}, HttpStatus.OK); 
                }
            } catch (error){
               return Response.failure(res, { message:  'Invalid ID!!!' }, HttpStatus.NOT_FOUND);         
            }
        }
    }
/********************************************************
 *                 UPDATE PRODUCT BY ID       *
 * ******************************************************/  
    public static async updateProductByID (req, res){
        const productId = req.params.productId;
        const updatebody: any = req.body;
        updatebody.product.product_id = productId;
        if (productId) {
            try{
                let response = await listServices.getByID(productIndex, productType, productId)
                if (response) {
                    try{
                        await listServices.indexToES(productIndex, productType, updatebody, productId)
                        const queueBody = {
                            productId,
                            criteria    :   updatebody.product,
                            userEmail   :   updatebody.product.createdBy.email,
                            user_id     :   updatebody.product.createdBy.userId,
                            name        :   updatebody.product.name,
                            description :   updatebody.product.description
                        };
                        // Data to pass to the Queue for Default product recommendation.
                        listServices.pushToppInsightsQueue(queueBody);
                        return Response.success(res, { message: 'Product Successfully updated' , response: response}, HttpStatus.OK); 
                    }
                    catch{
                        return Response.failure(res, { message: 'updated Product not pushed to Queue' }, HttpStatus.BadRequest); 
                    };
                }
            }
            catch{
                return Response.failure(res, { message:  'The product doesnt exist!!!' }, HttpStatus.NOT_FOUND); 
            };
        }
        return Response.failure(res, { message:  'Pass a valid product ID' }, HttpStatus.BadRequest); 
    };    
/********************************************************
 *                 DELETE PRODUCT BY ID       *
 * ******************************************************/ 
    public static async deleteProductByID (req, res){
        const productId = req.params.productId;
        if (productId) {
            try{
                let response = await listServices.deleteByID(productIndex, productType, productId)
                return Response.success(res, { message: 'Product Successfully deleted' , response: response }, HttpStatus.OK); 
            }
            catch{
                return Response.failure(res, { message:  'The product doesnt exist!!!' }, HttpStatus.NOT_FOUND); 
            };
        }
    }
/********************************************************
 *                 ADD PRODUCT TYPE      *
 * ******************************************************/ 
    public static async addproductType (req, res){
        const types = {
            data: [
                {
                    id: '/1',
                    name: 'Customer Registration & Signup',
                    type: 'customerRegistrationSignup',
                    level: 1,
                    lowerLimit: 0,
                    upperLimit: 0,
                },
                {
                    id: '/2',
                    name: 'Savings & Investments',
                    type: 'savingsInvestments',
                    level: 1,
                    lowerLimit: 0,
                    upperLimit: 0,
                },
                {
                    id: '/3',
                    name: 'Account Opening',
                    type: 'accountOpening',
                    level: 1,
                    lowerLimit: 0,
                    upperLimit: 0,
                },
                {
                    id: '/4',
                    name: 'Mobile App Installs',
                    type: 'mobileAppInstall',
                    level: 1,
                    lowerLimit: 0,
                    upperLimit: 0,
                },
                {
                    id: '/5',
                    name: 'Micro Lending',
                    type: 'microLending',
                    level: 1,
                    lowerLimit: 0,
                    upperLimit: 0,
                },
                {
                    id: '/6',
                    name: 'Account Funding',
                    type: 'accountFunding',
                    level: 1,
                    lowerLimit: 0,
                    upperLimit: 0,
                },
            ]
        };
        try{
            await listServices.indexToES( productTypeIndex, productTypeType, types, false)
            return Response.success(res, { message: 'Product types successfully indexed' , response:types}, HttpStatus.OK); 
        }
        catch{
            return Response.failure(res, { message:  'An error occured' }, HttpStatus.INTERNAL_SERVER_ERROR); 
        }
    }
/********************************************************
 *                 GET ALL PRODUCT TYPE      *
 * ******************************************************/ 
    public static async getProductType (req, res){
        try{
            let response = await listServices.searchES(false, productTypeIndex, productTypeType)
            const resp = response.hits.hits;
            resp.forEach((item: any) => {
                const data = item._source.data;
                return Response.success(res, { message: 'Product types successfully indexed' , response:data}, HttpStatus.OK); 
            });
        }
        catch{
            return Response.failure(res, { message:  'Error fetching Product types!!!' , response : []}, HttpStatus.NOT_FOUND); 
        };
    }

}    
