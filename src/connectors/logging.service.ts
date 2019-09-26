import winston = require('winston');
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, prettyPrint, Console, json } = format;

export class LoggingService {
    static logger = winston.createLogger({
        level: 'info',
        format: combine(
            json(),
            timestamp(),
            prettyPrint()
        ),
        transports: [
            new (winston.transports.DailyRotateFile)({
                filename: '/mnt/logs/AP/' + 'error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                level: 'error'
            }),
            new (winston.transports.DailyRotateFile)({
                filename: '/mnt/logs/AP/' + 'info-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                level: 'info'
            }),
            new (winston.transports.DailyRotateFile)({
                filename: '/mnt/logs/AP/' + 'debug-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                level: 'debug'
            }),
            new (winston.transports.DailyRotateFile)({
                filename: '/mnt/logs/AP/' + 'combined-%DATE%.log',
                datePattern: 'YYYY-MM-DD'
            })
        ]
    });
    constructor() { }
}