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

import Agent from '../src/index';
import { Db, MongoClient } from 'mongodb';

import * as assert from 'assert';

Agent.start({});
// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'teambition';
// Create a new MongoClient
const client = new MongoClient(url, { useUnifiedTopology: true });
const insertDocumentsOk = (db, callback) => {
  const collection = db.collection('documents');
  collection.insertMany([{ a: 1 }, { a: 2 }, { a: 3 }], (err, result) => {
    callback(result);
  });
};
const insertDocumentsFailed = (db: Db, callback) => {
  const collection = db.collection('documents');
  collection.insertMany([{ a: 1 }, { a: 2 }, { a: 3 }], (err, result) => {
    callback(result);
  });
};
// Use connect method to connect to the Server
client.connect((err) => {
  assert.equal(null, err);
  const db = client.db(dbName);
  insertDocumentsOk(db, () => {});
  (async () => {
    await (async () => setTimeout(() => {}, 1000))();
  })();
  insertDocumentsOk(db, () => {});
  insertDocumentsFailed(db, () => {
    client.close();
  });
});

setTimeout(() => {}, 10000);
