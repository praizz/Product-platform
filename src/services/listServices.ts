
import * as Amqp from 'amqp-ts';
import { MQProcessor } from '../connectors/RabbitMQ';
import { ElasticsearchService } from '../connectors/elasticsearch.service';

export class listServices {
    private static TGEs = ElasticsearchService.TGEs;
    public static clientEs   = ElasticsearchService.clientEs;

    public static getProductName (index, type, requestBody) {
        let Params = {
            index,
            type,
            body: requestBody,
        };
        return listServices.clientEs.search(Params);
    }
    public static getByID (index, type, id) {
        let Params = {
            index,
            type,
            id
        };
        return listServices.clientEs.get(Params);
    }
    public static deleteByID (index, type, id) {
        let Params = {
            index,
            type,
            id
        };
        return listServices.clientEs.delete(Params);
    }
    public static indexToES (index, type, body, id) {
        const indexDocParams = {
            index,
            type,
            body,
            id,
        };
        return listServices.clientEs.index(indexDocParams);
    }
    public static updateES (index, type, body, id) {
        const updateParams = {
            index,
            type,
            body,
            id,
        };
        return listServices.clientEs.update(updateParams);
    }
    public static searchES (params, index, type) {
        const searchParams = {
            index,
            type,
            body: params.query,
            id: params.id,
            from: params.from,
            size : params.size,
            sort: params.sort
        };
        return listServices.clientEs.search(searchParams);
    }
    public static pushToAiHandlerQueue(message) {
        const msg = new Amqp.Message(JSON.stringify(message));
        msg.nack(false);
        MQProcessor.AiServiceExchange.send(msg);
        console.log('this is the message pushed to the Ai-Service queue', msg);
    }

}