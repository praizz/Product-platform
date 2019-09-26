require('dotenv').config();
import app from './server'
import express = require('express');
import { pp } from './pp';
import { MQProcessor } from './connectors/RabbitMQ';
import { customSegmentsQProcessor } from './consumers/customSegmentsQProcessor';
import { overlapAnalysisQProcessor } from './consumers/overlapAnalysisQProcessor';
import * as SocketIO from 'socket.io';
import { createServer, Server } from 'http';
import { LoggingService } from './connectors/logging.service';
const productRoutes = require('./routes/products' );
const productListroutes = require('./routes/productList');
const segmentRoutes = require('./routes/segments');
const notificationRoutes = require ('./routes/notification')
const insightRoutes = require('./routes/insights')

export class App {

    public express;
    constructor() {
        this.express = express();
        this.express.use(require('cookie-parser')());
        // this.express.use(require('body-parser').urlencoded({
        //     extended: true,
        //     limit: '500mb'
        // }));
        this.express.use(require('body-parser').json({ limit: '500mb' }));
        /** 
         * allow cross domain requests to hit the express server.
        */
        var allowCrossDomain = function (req, res, next) {
            var origin = req.headers.origin;
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, x-ap-auth, Content-Type, Accept");
            res.header("Access-Control-Allow-Credentials", true);
            next();
        }
        this.express.use(allowCrossDomain);
        /** 
         * register all the express routes and endpoints.
        */
        this.setUpRoutes();
    }
    private setUpRoutes() {
        LoggingService.logger.info('Registering Routes');
        //MetaService.CreateMeta();
        //pp.registerRoutes(this.express);
        //Upload.registerRoutes(this.express);
        // product.registerRoutes(this.express, passport);
        //NotificationService.registerRoutes(this.express);
        notificationRoutes.routes(this.express)
        productRoutes.routes(this.express);
        productListroutes.routes(this.express);
        segmentRoutes.routes(this.express);
        insightRoutes.routes(this.express);
        /** 
         * registering and starting rabbitmq endpoints and consumers
        */
        MQProcessor.createConnections();
        customSegmentsQProcessor.createConnections();
        //overlapAnalysisQProcessor.generateInsights();
    }
}

export default new App().express;
const port = process.env.AP_EXPRESS_PORT || 3100;
app.use(express.static('/dist'));
app.listen(port, (err) => {
    if (err) {
        return LoggingService.logger.error(err);
    }
    return console.log(`server is listening on ${port}`);
})