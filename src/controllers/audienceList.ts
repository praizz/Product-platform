import * as Builder from 'elastic-builder';
import { listServices }  from '../services/listServices';
import {APConstants} from '../config/settings';
const moment = require('moment') ;
const unirest = require('unirest');
const HttpStatus = require('../constants/httpStatus')
const Response = require('../lib/responseManager')
import { v4 as uuid } from 'uuid';
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const terras3Url = process.env.terras3UploadUrl;
const s3BucketID = process.env.appId;
const productIndex = APConstants.indexes.productlist.index;
const productType = APConstants.indexes.productlist.type;

export class productListControllers{
/********************************************************
 *                 GET product          *
 * ******************************************************/
    public static async getAllproduct(req, res){
        const user_id = req.query.user_id;
        const start_date = req.query.start_date;
        const end_date = req.query.end_date;
        const status = req.query.status;
        const result_type = req.query.result_type;
        const search = req.query.q;
        const query = Builder.requestBodySearch();
        const q: Builder.Query[] = [];
        let Params: any = {};
        Params.sort = ['createdAt:desc'];
        let from = 0;
        let size = 20;
        if (search ) {
            q.push(Builder.multiMatchQuery(['description', 'createdBy', 'upload_name'], search ).type('phrase_prefix'));
            Params.body = query.query(Builder.boolQuery().must(q));
        }
        if (user_id ) {
            q.push(Builder.termQuery('user_id.keyword', user_id));
            Params.body = query.query(Builder.boolQuery().must(q));
        }
        if (start_date && end_date ) {
            q.push(Builder.rangeQuery('createdAt').gte(start_date).lte(end_date));
            Params.body = query.query(Builder.boolQuery().must(q));
        }
        if (status ) {
            q.push(Builder.termQuery('status.keyword', status));
            Params.body = query.query(Builder.boolQuery().must(q));
        }
        if (result_type ) {
            q.push(Builder.termQuery('result_type.keyword', result_type));
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
            let productlist = result.hits.hits.map((value: any) => {
                return {
                    id: value._id,
                    product_type: value._source.product_type,
                    upload_name: value._source.upload_name,
                    description: value._source.description ,
                    size: value._source.size,
                    file_id: value._source.file_id,
                    result_type: value._source.result_type,
                    createdBy: value._source.createdBy,
                    status: value._source.status,
                    no_of_profiles: value._source.no_of_profiles ,
                    createdAt: value._source.createdAt,
                };
            });
            return Response.success(res, { message: 'product Successfully fetched', response : productlist  }, HttpStatus.OK); 
        }
        catch{
            return Response.failure(res, { message: 'Error fetching product!!!' }, HttpStatus.BadRequest); 
        };

    };
/********************************************************
 *                 GET product BY ID       *
 * ******************************************************/
    public static async getproductByID(req, res){
        const productId = req.params.productId;
            try{
            let response = await listServices.getByID(productIndex, productType, productId)
                if (response){
                    return Response.success(res, { message: 'product Successfully fetched', response : response  }, HttpStatus.OK); 
                }
            }
            catch{
                return Response.failure(res, { message: 'Invalid ID!!!' }, HttpStatus.BadRequest);
            };      
    }
/********************************************************
 *                 UPDATE product BY ID       *
 * ******************************************************/
    public static async updateproductByID (req, res){
        let productId = req.params.productId;
        const updatebody = req.body;
        if (!updatebody.upload_name || !updatebody.description){
            return Response.failure(res, { message: 'Please pass in upload name and description'}, HttpStatus.NOT_FOUND); 
        }
        let body = {
            doc : {
                upload_name: updatebody.upload_name,
                description: updatebody.description,
            }
        }
        try {
            let response =  await listServices.getByID(productIndex, productType, productId)
            if (response){         
                let response = await listServices.updateES(productIndex, productType, body, productId)                
                return Response.success(res, { message: 'product Successfully updated', response : response  }, HttpStatus.OK);                    
            }
        } catch(error){
            return Response.failure(res, { message: 'Please pass a valid ID' }, HttpStatus.BadRequest);
        } 
    }
/********************************************************
 *                 DELETE product BY ID       *
 * ******************************************************/
    public static async deleteproductbyID (req, res){
        const productId = req.params.productId;
        if (productId) {
            try{
                let response = await listServices.deleteByID(productIndex, productType, productId)
                return Response.success(res, { message: 'product Successfully deleted', response : response  }, HttpStatus.OK); 
            }
            catch{
                return Response.failure(res, { message: 'The product doesnt exist' }, HttpStatus.BadRequest);
            };
        } 
        return Response.failure(res, { message: 'Please pass a valid  Id' }, HttpStatus.BadRequest)
    }

}
