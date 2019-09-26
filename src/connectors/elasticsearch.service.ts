import { Client } from 'elasticsearch';
import { APConstants } from '../config/settings';

export class ElasticsearchService {


    public static TGEs = new Client({
    host: APConstants.elasticsearchURL,
    requestTimeout: 1000 * 60 * 60,
    maxRetries: 3,
    keepAlive: false
    })

    public static clientEs = new Client({
         host : APConstants.clientElasticsearchURL,
   })}