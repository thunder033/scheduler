import axios from 'axios';

import { getServerHost, getServerPort } from './server-address';

axios.defaults.baseURL = `http://${getServerHost()}:${getServerPort()}`;
