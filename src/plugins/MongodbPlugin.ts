/*!
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import SwPlugin from '../core/SwPlugin';
import { createLogger } from '../logging';
import ContextManager from '../trace/context/ContextManager';
import Span from '../trace/span/Span';
import { Component } from '../trace/Component';
import { SpanLayer } from '../proto/language-agent/Tracing_pb';
import { InsertWriteOpResult, MongoClient, MongoError, WithId } from 'mongodb';

const logger = createLogger(__filename);

class MongodbPlugin implements SwPlugin {
  readonly module = 'mongodb';
  readonly versions = '*'; // TODO: narrow down the supported version

  install(): void {
    const spanKeyedByRequestId: {
      [requestId: string]: Span;
    } = {};

    const onStartEvent = (event: any) => {
      if (logger.isDebugEnabled()) {
        logger.debug('Mongodb start', event);
      }
      const span = ContextManager.current.newExitSpan(
        `MongoDB/${event.databaseName}/${event.commandName}`,
        event.address,
      );
      span.component = Component.MONGODB;
      span.layer = SpanLayer.DATABASE;
      spanKeyedByRequestId[event.requestId] = span.start();
    };

    const onSuccessEvent = async (event: any) => {
      if (logger.isDebugEnabled()) {
        logger.debug('Mongodb succeeded', event);
      }

      await (async () => setTimeout(() => {}, 1000))();

      if (!spanKeyedByRequestId[event.requestId]) {
        return;
      }
      const span = spanKeyedByRequestId[event.requestId];

      delete spanKeyedByRequestId[event.requestId];

      if (event.reply?.writeErrors) {
        const errors = event.reply.writeErrors as [{ errmsg: string }];

        span.errored = true;
        span.logs.push({
          items: [
            {
              key: 'ErrorMsg',
              val: errors.map((it) => it.errmsg).join('\n'),
            },
          ],
          timestamp: new Date().getTime(),
        });
      }

      span.stop();
    };

    const onFailedEvent = (event: any) => {
      if (logger.isDebugEnabled()) {
        logger.debug('Mongodb failed', event);
      }
      if (!spanKeyedByRequestId[event.requestId]) {
        return;
      }
      const span = spanKeyedByRequestId[event.requestId];

      span.stop();

      delete spanKeyedByRequestId[event.requestId];
    };

    const Client = require('mongodb/lib/mongo_client');

    ((original) => {
      Client.prototype.connect = function () {
        const span = ContextManager.current.newExitSpan(`MongoDB/connect`, this.s.url).start();
        span.component = Component.MONGODB;
        span.layer = SpanLayer.DATABASE;

        const snapshot = ContextManager.current.capture();

        const callback = arguments[arguments.length - 1];
        if (typeof callback === 'function') {
          arguments[arguments.length - 1] = (error: MongoError, r: MongoClient) => {
            ContextManager.current.restore(snapshot);

            callback(error, r);
          };
        }

        const result = original.apply(this, arguments);

        span.stop();

        return result;
      };
    })(Client.prototype.connect);

    ((original) => {
      Client.prototype.close = function () {
        const span = ContextManager.current.newExitSpan(`MongoDB/close`, this.s.url).start();
        span.component = Component.MONGODB;
        span.layer = SpanLayer.DATABASE;

        const snapshot = ContextManager.current.capture();

        const callback = arguments[arguments.length - 1];
        if (typeof callback === 'function') {
          arguments[arguments.length - 1] = (error: MongoError, r: MongoClient) => {
            ContextManager.current.restore(snapshot);

            callback(error, r);
          };
        }

        const result = original.apply(this, arguments);

        span.stop();

        return result;
      };
    })(Client.prototype.close);

    const Collection = require('mongodb/lib/collection');

    ((original) => {
      Collection.prototype.insertMany = function (ns: string, ops: object[]) {
        const { db, collection } = this.s.namespace;

        const span = ContextManager.current.newExitSpan(`MongoDB/${db}/${collection}/insertMany`, this.s.url).start();
        span.component = Component.MONGODB;
        span.layer = SpanLayer.DATABASE;

        const snapshot = ContextManager.current.capture();

        const callback = arguments[arguments.length - 1];
        if (typeof callback === 'function') {
          arguments[arguments.length - 1] = (error: MongoError, r: InsertWriteOpResult<WithId<any>>) => {
            ContextManager.current.restore(snapshot);

            callback(error, r);
          };
        }

        const result = original.apply(this, arguments);

        span.stop();

        return result;
      };
    })(Collection.prototype.insertMany);
  }
}

// noinspection JSUnusedGlobalSymbols
export default new MongodbPlugin();
