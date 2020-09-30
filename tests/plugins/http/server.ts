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

// @ts-ignore
import agent from '../../../src/index';

agent.start({});

import { createServer, IncomingMessage, ServerResponse } from 'http';

const port = 5000;

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  setTimeout(() => response.end('How you doin'), 1000);
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
